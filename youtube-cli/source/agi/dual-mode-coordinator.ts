import OpenAI from 'openai';
import { getConfig } from '../llm-config.js';

/**
 * COORDENADOR DE MODO DUPLO
 * 
 * Este módulo é responsável por:
 * 1. Detectar automaticamente se tarefa é SIMPLES ou COMPLEXA
 * 2. Rotear para:
 *    - Modo Assistente: Respostas diretas sem orquestração
 *    - Modo AGI: Orquestração completa com decomposição
 * 3. Maximizar eficiência de tokens e tempo de resposta
 */

export type ExecutionMode = 'assistant' | 'agi';

export interface ModeDecision {
	mode: ExecutionMode;
	confidence: number; // 0-100
	reasoning: string;
	estimatedComplexity: 'trivial' | 'simple' | 'medium' | 'complex';
	requiresTools: boolean;
	requiresDecomposition: boolean;
}

export class DualModeCoordinator {
	private openai: OpenAI;

	constructor(openai: OpenAI) {
		this.openai = openai;
	}

	/**
	 * DECISÃO DE MODO (Assistant vs AGI)
	 * 
	 * FASE 1: Análise Rápida (baseada em heurísticas)
	 * FASE 2: Análise Profunda (com LLM) se necessário
	 */
	async decidExecutionMode(userPrompt: string): Promise<ModeDecision> {
		// FASE 1: Heurísticas rápidas
		const quickDecision = this.quickModeDecision(userPrompt);
		
		if (quickDecision.confidence >= 85) {
			return quickDecision;
		}

		// FASE 2: Análise profunda com LLM para casos ambíguos
		return await this.deepModeAnalysis(userPrompt);
	}

	/**
	 * Decisão Rápida - Baseada em padrões comuns (sem LLM)
	 */
	private quickModeDecision(userPrompt: string): ModeDecision {
		const lower = userPrompt.toLowerCase();
		const words = userPrompt.split(/\s+/).length;

		// MODO ASSISTENTE (Direto, sem orquestração)
		// Padrões que indicam pergunta simples/conversacional
		const assistantPatterns = [
			/^(o que|what|como|how|por que|why|quando|when|onde|where)\s+(é|are|é|do|does)/i,
			/^(explique|explain|descreva|describe|me diga|tell me)/i,
			/^(qual|which|quais|what)/i,
			/\?$/,
		];

		for (const pattern of assistantPatterns) {
			if (pattern.test(userPrompt)) {
				return {
					mode: 'assistant',
					confidence: 90,
					reasoning: 'Pergunta factual/conversacional detectada',
					estimatedComplexity: 'trivial',
					requiresTools: false,
					requiresDecomposition: false,
				};
			}
		}

		// Perguntas curtas (< 10 palavras) geralmente são simples
		if (words < 10 && userPrompt.includes('?')) {
			return {
				mode: 'assistant',
				confidence: 85,
				reasoning: 'Pergunta curta e direta',
				estimatedComplexity: 'simple',
				requiresTools: false,
				requiresDecomposition: false,
			};
		}

		// MODO AGI (Orquestração completa)
		// Padrões que indicam tarefa complexa
		const agiPatterns = [
			/(criar|create|build|implementar|implement).+(e|and).+(depois|then|seguida)/i,
			/(pesquisar|search|find).+(resumir|summarize|comparar|compare)/i,
			/(múltiplos|multiple|vários|several)/i,
			/(automatizar|automate|orquestrar|orchestrate)/i,
			/(passo a passo|step by step|etapas|stages)/i,
		];

		for (const pattern of agiPatterns) {
			if (pattern.test(userPrompt)) {
				return {
					mode: 'agi',
					confidence: 90,
					reasoning: 'Tarefa multi-etapa detectada',
					estimatedComplexity: 'complex',
					requiresTools: true,
					requiresDecomposition: true,
				};
			}
		}

		// Comandos de ação simples (criar arquivo, ler arquivo, etc.)
		const simpleActionPatterns = [
			/^(criar|create|escrever|write|ler|read)\s+arquivo/i,
			/^(executar|execute|run)\s+/i,
			/^(listar|list|mostrar|show)\s+/i,
		];

		for (const pattern of simpleActionPatterns) {
			if (pattern.test(userPrompt)) {
				// Ação simples, mas requer ferramenta
				return {
					mode: 'agi',
					confidence: 80,
					reasoning: 'Ação simples que requer ferramenta',
					estimatedComplexity: 'simple',
					requiresTools: true,
					requiresDecomposition: false,
				};
			}
		}

		// Prompts longos (> 50 palavras) tendem a ser complexos
		if (words > 50) {
			return {
				mode: 'agi',
				confidence: 75,
				reasoning: 'Prompt longo indica tarefa complexa',
				estimatedComplexity: 'medium',
				requiresTools: true,
				requiresDecomposition: true,
			};
		}

		// Caso padrão: confiança baixa, precisa de análise profunda
		return {
			mode: 'assistant',
			confidence: 50,
			reasoning: 'Incerto, requer análise profunda',
			estimatedComplexity: 'simple',
			requiresTools: false,
			requiresDecomposition: false,
		};
	}

	/**
	 * Análise Profunda com LLM - Para casos ambíguos
	 */
	private async deepModeAnalysis(userPrompt: string): Promise<ModeDecision> {
		const config = getConfig();

		const analysisPrompt = `Você é o Classificador de Modo do FLUI AGI.

PROMPT DO USUÁRIO:
"""
${userPrompt}
"""

Determine se este prompt requer:
- **Modo Assistente**: Resposta direta, conversacional, factual (sem ferramentas ou decomposição)
- **Modo AGI**: Orquestração complexa, uso de ferramentas, decomposição em etapas

Critérios:
1. ASSISTENTE: Perguntas factuais, explicações, conversas simples
2. AGI: Criação de arquivos, pesquisas, múltiplas etapas, automações

Retorne APENAS um JSON:
{
  "mode": "assistant|agi",
  "confidence": 0-100,
  "reasoning": "por que escolheu este modo",
  "estimatedComplexity": "trivial|simple|medium|complex",
  "requiresTools": true/false,
  "requiresDecomposition": true/false
}`;

		try {
			const response = await this.openai.chat.completions.create({
				model: config.model || 'qwen-max',
				messages: [{ role: 'user', content: analysisPrompt }],
				temperature: 0.2,
			});

			const content = response.choices[0]?.message?.content || '{}';
			const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
			const decision: ModeDecision = JSON.parse(cleanContent);

			return decision;
		} catch (error) {
			// Fallback: usar modo AGI para segurança
			return {
				mode: 'agi',
				confidence: 60,
				reasoning: 'Análise profunda falhou, usando AGI por segurança',
				estimatedComplexity: 'medium',
				requiresTools: true,
				requiresDecomposition: true,
			};
		}
	}

	/**
	 * Executar em MODO ASSISTENTE (resposta direta, sem orquestração)
	 */
	async executeAssistantMode(userPrompt: string): Promise<string> {
		const config = getConfig();

		const systemPrompt = `Você é o FLUI, um assistente AGI altamente eficiente e conciso.

Responda de forma DIRETA, CLARA e PRECISA à pergunta do usuário.

Regras:
- Seja conciso mas completo
- Use conhecimento interno (não invente ferramentas)
- Para perguntas factuais, responda diretamente
- Para comparações, estruture bem (tabelas/listas)
- NÃO use ferramentas ou decomposição`;

		try {
			const response = await this.openai.chat.completions.create({
				model: config.model || 'qwen-max',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt },
				],
				temperature: 0.3,
			});

			return response.choices[0]?.message?.content || 'Não foi possível gerar resposta.';
		} catch (error) {
			return `Erro no modo assistente: ${error instanceof Error ? error.message : String(error)}`;
		}
	}
}
