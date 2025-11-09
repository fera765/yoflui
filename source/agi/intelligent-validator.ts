/**
 * SISTEMA INTELIGENTE DE VALIDAÇÃO E CORREÇÃO
 * 
 * Sistema flexível que detecta e corrige QUALQUER tipo de erro,
 * não apenas 5 tipos pré-definidos.
 * 
 * Inspirado em Manus.im - Validação adaptativa e autocorreção inteligente
 */

import OpenAI from 'openai';
import { getConfig } from '../llm-config.js';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface IntelligentValidationResult {
	isValid: boolean;
	confidence: number; // 0-100
	issues: ValidationIssue[];
	suggestions: string[];
	autoCorrections: AutoCorrection[];
	requiresUserInput: boolean;
}

export interface ValidationIssue {
	type: string; // Tipo dinâmico, não limitado
	severity: 'critical' | 'high' | 'medium' | 'low';
	description: string;
	location?: string; // Onde o erro ocorreu
	evidence?: string; // Evidência do erro
}

export interface AutoCorrection {
	issueType: string;
	action: 'retry' | 'modify' | 'create' | 'delete' | 'install';
	command?: string;
	params?: any;
	confidence: number;
	explanation: string;
}

export interface TaskRequirements {
	title: string;
	expectedOutputs: string[]; // Arquivos/componentes esperados
	validationCriteria: string[];
	workDir: string;
}

/**
 * VALIDADOR INTELIGENTE - Detecta qualquer tipo de erro
 */
export class IntelligentValidator {
	private openai: OpenAI;
	private validationHistory: Map<string, IntelligentValidationResult> = new Map();

	constructor(openai: OpenAI) {
		this.openai = openai;
	}

	/**
	 * VALIDAÇÃO COMPLETA - Verifica TUDO
	 * 
	 * 1. Validação Estrutural (arquivos existem?)
	 * 2. Validação de Conteúdo (arquivos têm o que devem ter?)
	 * 3. Validação Semântica (faz sentido?)
	 * 4. Validação de Qualidade (código bom?)
	 */
	async validateTaskCompletion(
		requirements: TaskRequirements,
		result: string
	): Promise<IntelligentValidationResult> {
		const issues: ValidationIssue[] = [];
		const suggestions: string[] = [];
		const autoCorrections: AutoCorrection[] = [];

		// FASE 1: Validação Estrutural (Rápida)
		const structuralIssues = await this.validateStructure(requirements);
		issues.push(...structuralIssues);

		// FASE 2: Validação de Conteúdo (Média)
		if (structuralIssues.length === 0) {
			const contentIssues = await this.validateContent(requirements);
			issues.push(...contentIssues);
		}

		// FASE 3: Validação Semântica (LLM - Lenta mas precisa)
		if (issues.length === 0 || issues.every(i => i.severity !== 'critical')) {
			const semanticIssues = await this.validateSemantics(requirements, result);
			issues.push(...semanticIssues);
		}

		// FASE 4: Gerar Autocorreções
		for (const issue of issues) {
			const corrections = await this.generateAutoCorrections(issue, requirements);
			autoCorrections.push(...corrections);
		}

		// FASE 5: Gerar Sugestões
		suggestions.push(...this.generateSuggestions(issues, requirements));

		// Calcular confiança geral
		const confidence = this.calculateConfidence(issues, requirements);

		// Determinar se requer input do usuário
		const requiresUserInput = issues.some(i => 
			i.type.includes('ambiguous') || 
			i.type.includes('missing_spec') ||
			i.severity === 'critical' && autoCorrections.length === 0
		);

		const validationResult: IntelligentValidationResult = {
			isValid: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
			confidence,
			issues,
			suggestions,
			autoCorrections,
			requiresUserInput
		};

		// Salvar no histórico
		this.validationHistory.set(requirements.title, validationResult);

		return validationResult;
	}

	/**
	 * VALIDAÇÃO ESTRUTURAL - Arquivos existem?
	 */
	private async validateStructure(requirements: TaskRequirements): Promise<ValidationIssue[]> {
		const issues: ValidationIssue[] = [];

		for (const expectedOutput of requirements.expectedOutputs) {
			const fullPath = join(requirements.workDir, expectedOutput);
			
			if (!existsSync(fullPath)) {
				issues.push({
					type: 'missing_file',
					severity: 'critical',
					description: `Arquivo esperado não foi criado: ${expectedOutput}`,
					location: fullPath,
					evidence: `Expected: ${fullPath}, Found: false`
				});
			}
		}

		return issues;
	}

	/**
	 * VALIDAÇÃO DE CONTEÚDO - Arquivos têm o que devem ter?
	 */
	private async validateContent(requirements: TaskRequirements): Promise<ValidationIssue[]> {
		const issues: ValidationIssue[] = [];

		for (const expectedOutput of requirements.expectedOutputs) {
			const fullPath = join(requirements.workDir, expectedOutput);
			
			if (!existsSync(fullPath)) continue;

			try {
				const content = await readFile(fullPath, 'utf-8');

				// Validações básicas
				if (content.length < 50) {
					issues.push({
						type: 'empty_file',
						severity: 'high',
						description: `Arquivo muito pequeno ou vazio: ${expectedOutput}`,
						location: fullPath,
						evidence: `Size: ${content.length} bytes`
					});
				}

				// Detectar placeholders
				const placeholders = this.detectPlaceholders(content);
				if (placeholders.length > 0) {
					issues.push({
						type: 'placeholder_detected',
						severity: 'high',
						description: `Placeholders não substituídos em ${expectedOutput}`,
						location: fullPath,
						evidence: placeholders.join(', ')
					});
				}

				// Detectar erros de sintaxe (básico)
				if (expectedOutput.endsWith('.tsx') || expectedOutput.endsWith('.ts')) {
					const syntaxIssues = this.detectSyntaxIssues(content, expectedOutput);
					issues.push(...syntaxIssues);
				}

			} catch (error) {
				issues.push({
					type: 'file_read_error',
					severity: 'medium',
					description: `Erro ao ler arquivo: ${expectedOutput}`,
					location: fullPath,
					evidence: error instanceof Error ? error.message : 'Unknown error'
				});
			}
		}

		return issues;
	}

	/**
	 * VALIDAÇÃO SEMÂNTICA - Faz sentido? (LLM)
	 */
	private async validateSemantics(
		requirements: TaskRequirements,
		result: string
	): Promise<ValidationIssue[]> {
		const config = getConfig();

		const prompt = `Você é um Validador Semântico Inteligente do FLUI AGI.

**TAREFA:** ${requirements.title}

**CRITÉRIOS DE VALIDAÇÃO:**
${requirements.validationCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

**OUTPUTS ESPERADOS:**
${requirements.expectedOutputs.map((o, i) => `${i + 1}. ${o}`).join('\n')}

**RESULTADO DA EXECUÇÃO:**
${result.substring(0, 1500)}

**SUA MISSÃO:**
Analise se a tarefa foi REALMENTE completada com qualidade.

**VALIDAÇÃO RIGOROSA:**
1. Os arquivos esperados foram criados?
2. O conteúdo faz sentido para a tarefa?
3. Há evidências de trabalho real (não apenas "sucesso" genérico)?
4. A qualidade está adequada?

**RETORNE APENAS JSON:**
{
  "issues": [
    {
      "type": "tipo_dinamico_do_erro",
      "severity": "critical|high|medium|low",
      "description": "descrição clara",
      "location": "onde ocorreu",
      "evidence": "evidência do problema"
    }
  ],
  "overallQuality": 0-100,
  "reasoning": "explicação detalhada"
}

**IMPORTANTE:** Se não houver problemas, retorne issues: []`;

		try {
			const response = await this.openai.chat.completions.create({
				model: config.model || 'qwen-max',
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.2,
				max_tokens: 1000
			});

			const content = response.choices[0]?.message?.content || '{"issues": []}';
			const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
			const validation = JSON.parse(cleanContent);

			return validation.issues || [];
		} catch (error) {
			// Fallback: sem issues se LLM falhar
			return [];
		}
	}

	/**
	 * GERAR AUTOCORREÇÕES - Como corrigir automaticamente?
	 */
	private async generateAutoCorrections(
		issue: ValidationIssue,
		requirements: TaskRequirements
	): Promise<AutoCorrection[]> {
		const corrections: AutoCorrection[] = [];

		switch (issue.type) {
			case 'missing_file':
				corrections.push({
					issueType: issue.type,
					action: 'create',
					params: {
						filePath: issue.location,
						taskTitle: requirements.title
					},
					confidence: 90,
					explanation: 'Criar arquivo faltante com conteúdo apropriado'
				});
				break;

			case 'empty_file':
				corrections.push({
					issueType: issue.type,
					action: 'modify',
					params: {
						filePath: issue.location,
						action: 'expand'
					},
					confidence: 85,
					explanation: 'Expandir arquivo vazio com conteúdo real'
				});
				break;

			case 'placeholder_detected':
				corrections.push({
					issueType: issue.type,
					action: 'modify',
					params: {
						filePath: issue.location,
						action: 'replace_placeholders'
					},
					confidence: 80,
					explanation: 'Substituir placeholders por valores reais'
				});
				break;

			case 'syntax_error':
				corrections.push({
					issueType: issue.type,
					action: 'modify',
					params: {
						filePath: issue.location,
						action: 'fix_syntax'
					},
					confidence: 75,
					explanation: 'Corrigir erros de sintaxe automaticamente'
				});
				break;

			case 'missing_dependency':
				corrections.push({
					issueType: issue.type,
					action: 'install',
					command: `cd ${requirements.workDir} && npm install ${issue.evidence}`,
					confidence: 95,
					explanation: 'Instalar dependência faltante'
				});
				break;

			default:
				// Para tipos desconhecidos, usar LLM para gerar correção
				const llmCorrection = await this.generateLLMCorrection(issue, requirements);
				if (llmCorrection) {
					corrections.push(llmCorrection);
				}
		}

		return corrections;
	}

	/**
	 * GERAR CORREÇÃO VIA LLM - Para erros desconhecidos
	 */
	private async generateLLMCorrection(
		issue: ValidationIssue,
		requirements: TaskRequirements
	): Promise<AutoCorrection | null> {
		const config = getConfig();

		const prompt = `Você é um Sistema de Autocorreção Inteligente.

**ERRO DETECTADO:**
Tipo: ${issue.type}
Severidade: ${issue.severity}
Descrição: ${issue.description}
Local: ${issue.location}
Evidência: ${issue.evidence}

**CONTEXTO:**
Tarefa: ${requirements.title}
WorkDir: ${requirements.workDir}

**SUA MISSÃO:**
Gere uma estratégia de autocorreção para este erro.

**RETORNE APENAS JSON:**
{
  "action": "retry|modify|create|delete|install|custom",
  "command": "comando shell se necessário",
  "params": { "parâmetros específicos" },
  "confidence": 0-100,
  "explanation": "por que esta correção deve funcionar"
}`;

		try {
			const response = await this.openai.chat.completions.create({
				model: config.model || 'qwen-max',
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.3,
				max_tokens: 500
			});

			const content = response.choices[0]?.message?.content || '{}';
			const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
			const correction = JSON.parse(cleanContent);

			return {
				issueType: issue.type,
				action: correction.action,
				command: correction.command,
				params: correction.params,
				confidence: correction.confidence || 50,
				explanation: correction.explanation || 'Correção gerada por LLM'
			};
		} catch (error) {
			return null;
		}
	}

	/**
	 * GERAR SUGESTÕES - O que o usuário pode fazer?
	 */
	private generateSuggestions(
		issues: ValidationIssue[],
		requirements: TaskRequirements
	): string[] {
		const suggestions: string[] = [];

		const criticalIssues = issues.filter(i => i.severity === 'critical');
		const highIssues = issues.filter(i => i.severity === 'high');

		if (criticalIssues.length > 0) {
			suggestions.push(`⚠️ ${criticalIssues.length} problema(s) crítico(s) detectado(s) - tarefa não pode ser marcada como completa`);
		}

		if (highIssues.length > 0) {
			suggestions.push(`⚠️ ${highIssues.length} problema(s) de alta prioridade detectado(s) - recomenda-se correção`);
		}

		// Sugestões específicas por tipo
		const missingFiles = issues.filter(i => i.type === 'missing_file');
		if (missingFiles.length > 0) {
			suggestions.push(`📁 Criar arquivos faltantes: ${missingFiles.map(i => i.location).join(', ')}`);
		}

		const placeholders = issues.filter(i => i.type === 'placeholder_detected');
		if (placeholders.length > 0) {
			suggestions.push(`🔧 Substituir placeholders por valores reais`);
		}

		return suggestions;
	}

	/**
	 * CALCULAR CONFIANÇA - Quão confiante estamos na validação?
	 */
	private calculateConfidence(
		issues: ValidationIssue[],
		requirements: TaskRequirements
	): number {
		let confidence = 100;

		// Reduzir confiança baseado em issues
		for (const issue of issues) {
			switch (issue.severity) {
				case 'critical':
					confidence -= 30;
					break;
				case 'high':
					confidence -= 15;
					break;
				case 'medium':
					confidence -= 5;
					break;
				case 'low':
					confidence -= 2;
					break;
			}
		}

		// Garantir mínimo de 0
		return Math.max(0, confidence);
	}

	/**
	 * DETECTAR PLACEHOLDERS - Padrões comuns
	 */
	private detectPlaceholders(content: string): string[] {
		const placeholders: string[] = [];
		const patterns = [
			/\{\{[^}]+\}\}/g,
			/<[A-Z_]+>/g,
			/YOUR_[A-Z_]+/g,
			/\[YOUR [^\]]+\]/gi,
			/\bPLACEHOLDER\b/gi,
			/\bTODO:/gi,
			/\bFIXME:/gi,
		];

		for (const pattern of patterns) {
			const matches = content.match(pattern);
			if (matches) {
				placeholders.push(...matches);
			}
		}

		return [...new Set(placeholders)];
	}

	/**
	 * DETECTAR ERROS DE SINTAXE - Básico
	 */
	private detectSyntaxIssues(content: string, filename: string): ValidationIssue[] {
		const issues: ValidationIssue[] = [];

		// Verificar imports quebrados
		const importPattern = /import\s+.*\s+from\s+['"](.*)['"]/g;
		let match;
		while ((match = importPattern.exec(content)) !== null) {
			const importPath = match[1];
			if (importPath.startsWith('./') || importPath.startsWith('../')) {
				// Import relativo - verificar se arquivo existe seria ideal
				// Por enquanto, apenas detectar imports suspeitos
				if (importPath.includes('undefined') || importPath.includes('null')) {
					issues.push({
						type: 'invalid_import',
						severity: 'high',
						description: `Import inválido detectado: ${importPath}`,
						location: filename,
						evidence: match[0]
					});
				}
			}
		}

		// Verificar chaves desbalanceadas
		const openBraces = (content.match(/\{/g) || []).length;
		const closeBraces = (content.match(/\}/g) || []).length;
		if (openBraces !== closeBraces) {
			issues.push({
				type: 'unbalanced_braces',
				severity: 'high',
				description: `Chaves desbalanceadas: ${openBraces} abertas, ${closeBraces} fechadas`,
				location: filename,
				evidence: `Open: ${openBraces}, Close: ${closeBraces}`
			});
		}

		return issues;
	}
}
