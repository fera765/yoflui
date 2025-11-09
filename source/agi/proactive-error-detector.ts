import OpenAI from 'openai';
import { getConfig } from '../llm-config.js';

/**
 * DETECTOR PROATIVO DE ERROS E AUTOCORREÇÃO
 * 
 * Este módulo é responsável por:
 * 1. Analisar resultados de ferramentas ANTES de prosseguir
 * 2. Detectar placeholders, erros de sintaxe, dados incompletos
 * 3. Sugerir e aplicar correções automaticamente
 * 4. Prevenir propagação de erros em cadeia
 */

export interface ErrorDetectionResult {
	hasError: boolean;
	errorType?: 'placeholder' | 'syntax' | 'incomplete' | 'logic' | 'none';
	confidence: number; // 0-100
	description: string;
	suggestedFix?: string;
	autoFixable: boolean;
}

export interface ValidationResult {
	isValid: boolean;
	issues: string[];
	suggestions: string[];
}

export class ProactiveErrorDetector {
	private openai: OpenAI;

	constructor(openai: OpenAI) {
		this.openai = openai;
	}

	/**
	 * Analisar resultado de ferramenta para detectar erros proativamente
	 * 
	 * REGRAS RÁPIDAS (sem LLM) para performance:
	 * 1. Detectar placeholders comuns: {{...}}, <...>, YOUR_..., PLACEHOLDER
	 * 2. Detectar mensagens de erro: "error", "failed", "exception"
	 * 3. Detectar dados vazios ou incompletos
	 */
	async analyzeToolResult(
		toolName: string,
		toolArgs: any,
		result: string,
		taskContext: string
	): Promise<ErrorDetectionResult> {
		// FASE 1: Detecção Rápida (sem LLM) - Padrões Comuns
		const quickDetection = this.quickErrorDetection(result);
		
		if (quickDetection.hasError && quickDetection.confidence >= 90) {
			// Erro óbvio detectado - retornar imediatamente
			return quickDetection;
		}

		// FASE 2: Detecção Profunda (com LLM) - Apenas para casos suspeitos
		if (quickDetection.confidence < 90 && result.length > 20) {
			return await this.deepErrorDetection(toolName, toolArgs, result, taskContext);
		}

		return quickDetection;
	}

	/**
	 * Detecção Rápida (Regex-based, sem LLM)
	 */
	private quickErrorDetection(result: string): ErrorDetectionResult {
		const lower = result.toLowerCase();

		// 1. Detectar placeholders óbvios
		const placeholderPatterns = [
			/\{\{[^}]+\}\}/g, // {{placeholder}}
			/<[A-Z_]+>/g, // <PLACEHOLDER>
			/YOUR_[A-Z_]+/g, // YOUR_VALUE
			/\[YOUR [^\]]+\]/gi, // [YOUR value]
			/\bPLACEHOLDER\b/gi,
			/\bTODO:/gi,
			/\bFIXME:/gi,
		];

		for (const pattern of placeholderPatterns) {
			const matches = result.match(pattern);
			if (matches && matches.length > 0) {
				return {
					hasError: true,
					errorType: 'placeholder',
					confidence: 95,
					description: `Placeholders detectados: ${matches.join(', ')}`,
					autoFixable: false, // Requer contexto do usuário
				};
			}
		}

		// 2. Detectar erros explícitos
		const errorPatterns = [
			'error:',
			'failed:',
			'exception:',
			'cannot',
			'unable to',
			'not found',
			'invalid',
			'syntax error',
		];

		for (const pattern of errorPatterns) {
			if (lower.includes(pattern)) {
				return {
					hasError: true,
					errorType: 'logic',
					confidence: 85,
					description: `Erro detectado: ${pattern}`,
					autoFixable: true, // Pode tentar estratégia alternativa
					suggestedFix: 'Tentar abordagem alternativa ou verificar pré-requisitos',
				};
			}
		}

		// 3. Detectar resultado vazio ou muito curto
		if (result.trim().length < 10) {
			return {
				hasError: true,
				errorType: 'incomplete',
				confidence: 70,
				description: 'Resultado muito curto ou vazio',
				autoFixable: true,
				suggestedFix: 'Repetir operação com parâmetros diferentes',
			};
		}

		// 4. Detectar JSON/código mal formado (básico)
		if (result.trim().startsWith('{') && !result.trim().endsWith('}')) {
			return {
				hasError: true,
				errorType: 'syntax',
				confidence: 80,
				description: 'JSON aparentemente incompleto',
				autoFixable: true,
				suggestedFix: 'Regenerar resposta completa',
			};
		}

		// Nenhum erro detectado na análise rápida
		return {
			hasError: false,
			errorType: 'none',
			confidence: 95,
			description: 'Resultado aparentemente válido',
			autoFixable: false,
		};
	}

	/**
	 * Detecção Profunda (LLM-based) - Para casos ambíguos
	 */
	private async deepErrorDetection(
		toolName: string,
		toolArgs: any,
		result: string,
		taskContext: string
	): Promise<ErrorDetectionResult> {
		const config = getConfig();

		const analysisPrompt = `Você é um Detector de Erros Proativo do FLUI AGI.

CONTEXTO DA TAREFA: ${taskContext}

FERRAMENTA EXECUTADA: ${toolName}
ARGUMENTOS: ${JSON.stringify(toolArgs, null, 2)}

RESULTADO OBTIDO:
"""
${result.substring(0, 1000)}
"""

Analise o resultado e detecte:
1. Placeholders não substituídos ({{...}}, <...>, YOUR_...)
2. Erros de sintaxe ou formato
3. Dados incompletos ou vazios
4. Lógica incorreta ou resultados sem sentido

Retorne APENAS um JSON:
{
  "hasError": true/false,
  "errorType": "placeholder|syntax|incomplete|logic|none",
  "confidence": 0-100,
  "description": "descrição clara do problema",
  "suggestedFix": "como corrigir",
  "autoFixable": true/false
}`;

		try {
			const response = await this.openai.chat.completions.create({
				model: config.model || 'qwen-max',
				messages: [{ role: 'user', content: analysisPrompt }],
				temperature: 0.1,
			});

			const content = response.choices[0]?.message?.content || '{}';
			const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
			const detection: ErrorDetectionResult = JSON.parse(cleanContent);

			return detection;
		} catch (error) {
			// Fallback: considerar válido se LLM falhar
			return {
				hasError: false,
				errorType: 'none',
				confidence: 50,
				description: 'Análise profunda falhou, assumindo válido',
				autoFixable: false,
			};
		}
	}

	/**
	 * AUTOCORREÇÃO: Tentar corrigir erro detectado automaticamente
	 * 
	 * Estratégias:
	 * 1. Para placeholders: Solicitar informação ao usuário
	 * 2. Para syntax: Regenerar com formato correto
	 * 3. Para incomplete: Repetir operação
	 * 4. Para logic: Tentar abordagem alternativa
	 */
	async attemptAutoCorrection(
		errorDetection: ErrorDetectionResult,
		originalToolName: string,
		originalArgs: any,
		taskContext: string
	): Promise<{ corrected: boolean; newStrategy?: string; newArgs?: any }> {
		if (!errorDetection.autoFixable) {
			return { corrected: false };
		}

		const config = getConfig();

		const correctionPrompt = `Você é o Sistema de Autocorreção do FLUI AGI.

ERRO DETECTADO:
Tipo: ${errorDetection.errorType}
Descrição: ${errorDetection.description}
Sugestão: ${errorDetection.suggestedFix}

CONTEXTO DA TAREFA: ${taskContext}
FERRAMENTA ORIGINAL: ${originalToolName}
ARGUMENTOS ORIGINAIS: ${JSON.stringify(originalArgs, null, 2)}

Gere uma NOVA ESTRATÉGIA para corrigir este erro automaticamente.

Retorne APENAS um JSON:
{
  "corrected": true/false,
  "newStrategy": "descrição da nova estratégia",
  "newToolName": "nome da ferramenta (pode ser a mesma)",
  "newArgs": { objeto com novos argumentos },
  "explanation": "por que esta abordagem deve funcionar"
}`;

		try {
			const response = await this.openai.chat.completions.create({
				model: config.model || 'qwen-max',
				messages: [{ role: 'user', content: correctionPrompt }],
				temperature: 0.3,
			});

			const content = response.choices[0]?.message?.content || '{}';
			const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
			const correction = JSON.parse(cleanContent);

			return {
				corrected: correction.corrected || false,
				newStrategy: correction.newStrategy,
				newArgs: correction.newArgs,
			};
		} catch (error) {
			return { corrected: false };
		}
	}

	/**
	 * Validar estratégia de execução ANTES de executar
	 * 
	 * Previne erros verificando:
	 * - Ferramentas escolhidas são apropriadas
	 * - Argumentos estão completos
	 - Não há dependências circulares
	 */
	async validateExecutionStrategy(
		toolName: string,
		args: any,
		taskGoal: string,
		availableTools: string[]
	): Promise<ValidationResult> {
		// Validação rápida
		if (!availableTools.includes(toolName)) {
			return {
				isValid: false,
				issues: [`Ferramenta '${toolName}' não existe ou não está disponível`],
				suggestions: [`Ferramentas disponíveis: ${availableTools.join(', ')}`],
			};
		}

		// Validar argumentos básicos
		if (!args || Object.keys(args).length === 0) {
			return {
				isValid: false,
				issues: ['Argumentos vazios ou ausentes'],
				suggestions: ['Fornecer argumentos completos para a ferramenta'],
			};
		}

		// Validação profunda (opcional, para economia de tokens)
		// Pode ser expandida conforme necessário

		return {
			isValid: true,
			issues: [],
			suggestions: [],
		};
	}

	/**
	 * Analisar INTENÇÃO do usuário para prever possíveis falhas
	 * 
	 * Exemplo: Se usuário pede "criar arquivo X", prever:
	 * - Diretório existe?
	 * - Permissões adequadas?
	 * - Arquivo já existe (sobrescrever)?
	 */
	async predictPotentialIssues(
		userIntent: string,
		plannedSteps: any[]
	): Promise<string[]> {
		const issues: string[] = [];

		// Análise simples baseada em padrões
		const lowerIntent = userIntent.toLowerCase();

		if (lowerIntent.includes('criar arquivo') || lowerIntent.includes('write file')) {
			issues.push('Verificar se diretório de destino existe');
			issues.push('Verificar permissões de escrita');
		}

		if (lowerIntent.includes('pesquisar') || lowerIntent.includes('search')) {
			issues.push('Verificar conectividade de rede se necessário');
			issues.push('Validar formato de consulta');
		}

		if (lowerIntent.includes('executar') || lowerIntent.includes('run')) {
			issues.push('Verificar se comando/script existe');
			issues.push('Verificar dependências do ambiente');
		}

		return issues;
	}
}
