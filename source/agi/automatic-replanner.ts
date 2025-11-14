/**
 * AUTOMATIC REPLANNER - Replanejamento Automático Inteligente
 * 
 * Detecta quando o resultado diverge dos requisitos
 * e automaticamente replaneija a execução para corrigir.
 * 
 * 100% dinâmico via LLM - sem regex, sem hardcoded, sem mock.
 */

import { OpenAI } from 'openai';

export interface ReplanAnalysis {
	shouldReplan: boolean;
	divergenceDetected: boolean;
	divergenceReasons: string[];
	newPlan: string;
	estimatedEffort: 'quick' | 'medium' | 'intensive';
	confidence: number; // 0-100
}

export interface ReplanResult {
	replanned: boolean;
	newStrategy: string;
	expectedOutcome: string;
	retryCount: number;
}

export class AutomaticReplanner {
	private openai: OpenAI;
	private replanAttempts: Map<string, number> = new Map();

	constructor(openai: OpenAI) {
		this.openai = openai;
	}

	/**
	 * Analisar se deve replanejar baseado na divergência
	 */
	async analyzeNeedForReplan(
		originalPrompt: string,
		currentResult: string,
		validationReport: any
	): Promise<ReplanAnalysis> {
		const systemPrompt = `Você é um especialista em replanejamento estratégico.

Analise se o resultado atual diverge significativamente do prompt original
e determine se é necessário replanejar a execução.

Responda em JSON:
{
  "shouldReplan": boolean,
  "divergenceDetected": boolean,
  "divergenceReasons": ["razão1", "razão2", ...],
  "newPlan": "descrição do novo plano",
  "estimatedEffort": "quick|medium|intensive",
  "confidence": número entre 0-100
}

CRITÉRIOS PARA REPLANEJAMENTO:
1. Tipo de conteúdo mudou (ebook → slides)?
2. Requisitos críticos não foram atendidos?
3. Qualidade está abaixo do esperado?
4. Estrutura está desorganizada?
5. Elementos prometidos estão faltando?

ESFORÇO ESTIMADO:
- quick: Ajustes menores (< 5 minutos)
- medium: Refatoração moderada (5-15 minutos)
- intensive: Reconstrução completa (> 15 minutos)

Responda APENAS com o JSON.`;

		try {
			const response = await this.openai.chat.completions.create({
				model: 'qwen3-coder-plus',
				messages: [
					{
						role: 'system',
						content: systemPrompt
					},
					{
						role: 'user',
						content: `PROMPT ORIGINAL:
${originalPrompt}

RESULTADO ATUAL (primeiros 2000 caracteres):
${currentResult.substring(0, 2000)}

RELATÓRIO DE VALIDAÇÃO:
${JSON.stringify(validationReport, null, 2)}

ANÁLISE:
Determine se deve replanejar a execução.`
					}
				],
				temperature: 0.3,
				max_tokens: 1500
			});

			const content = response.choices[0]?.message?.content || '{}';
			const analysis = JSON.parse(content) as ReplanAnalysis;

			return analysis;
		} catch (error) {
			console.error('[AutomaticReplanner] Erro ao analisar necessidade de replan:', error);
			return {
				shouldReplan: false,
				divergenceDetected: false,
				divergenceReasons: [],
				newPlan: '',
				estimatedEffort: 'quick',
				confidence: 0
			};
		}
	}

	/**
	 * Criar novo plano de execução
	 */
	async createNewPlan(
		originalPrompt: string,
		previousResult: string,
		divergenceReasons: string[]
	): Promise<string> {
		const systemPrompt = `Você é um especialista em planejamento estratégico.

Crie um NOVO PLANO DE EXECUÇÃO que corrija os problemas identificados.

O novo plano deve:
1. Ser ESPECÍFICO e DETALHADO
2. Abordar cada razão de divergência
3. Manter a qualidade e profundidade
4. Ser EXECUTÁVEL em passos lógicos
5. Garantir que todos os requisitos sejam atendidos

Responda com um plano estruturado e claro.`;

		try {
			const response = await this.openai.chat.completions.create({
				model: 'qwen3-coder-plus',
				messages: [
					{
						role: 'system',
						content: systemPrompt
					},
					{
						role: 'user',
						content: `PROMPT ORIGINAL:
${originalPrompt}

RESULTADO ANTERIOR:
${previousResult.substring(0, 1500)}

RAZÕES DA DIVERGÊNCIA:
${divergenceReasons.join('\n')}

TAREFA:
Crie um novo plano de execução que corrija os problemas acima.
Seja específico e detalhado.`
					}
				],
				temperature: 0.7,
				max_tokens: 2000
			});

			const newPlan = response.choices[0]?.message?.content || '';
			return newPlan;
		} catch (error) {
			console.error('[AutomaticReplanner] Erro ao criar novo plano:', error);
			return '';
		}
	}

	/**
	 * Executar replanejamento
	 */
	async executeReplan(
		originalPrompt: string,
		previousResult: string,
		validationReport: any,
		executionCallback: (plan: string) => Promise<string>
	): Promise<ReplanResult> {
		// Criar ID único para rastrear tentativas
		const taskId = `${originalPrompt.substring(0, 50)}_${Date.now()}`;
		const currentAttempt = (this.replanAttempts.get(taskId) || 0) + 1;
		this.replanAttempts.set(taskId, currentAttempt);

		// Analisar necessidade de replan
		const analysis = await this.analyzeNeedForReplan(
			originalPrompt,
			previousResult,
			validationReport
		);

		if (!analysis.shouldReplan || currentAttempt > 3) {
			return {
				replanned: false,
				newStrategy: 'Replanejamento não necessário ou limite de tentativas atingido',
				expectedOutcome: 'Manter resultado atual',
				retryCount: currentAttempt
			};
		}

		console.log(`[AutomaticReplanner] Iniciando replanejamento (tentativa ${currentAttempt})`);
		console.log(`[AutomaticReplanner] Razões: ${analysis.divergenceReasons.join(', ')}`);
		console.log(`[AutomaticReplanner] Esforço estimado: ${analysis.estimatedEffort}`);

		// Criar novo plano
		const newPlan = await this.createNewPlan(
			originalPrompt,
			previousResult,
			analysis.divergenceReasons
		);

		// Executar novo plano
		let newResult = '';
		try {
			newResult = await executionCallback(newPlan);
		} catch (error) {
			console.error('[AutomaticReplanner] Erro ao executar novo plano:', error);
		}

		return {
			replanned: true,
			newStrategy: newPlan,
			expectedOutcome: `Resultado corrigido após replanejamento (tentativa ${currentAttempt})`,
			retryCount: currentAttempt
		};
	}

	/**
	 * Decidir se deve fazer retry baseado em análise inteligente
	 */
	async shouldRetry(
		originalPrompt: string,
		currentResult: string,
		validationReport: any,
		maxRetries: number = 3
	): Promise<{ shouldRetry: boolean; reason: string; retryCount: number }> {
		const taskId = `${originalPrompt.substring(0, 50)}_retry`;
		const retryCount = (this.replanAttempts.get(taskId) || 0) + 1;

		if (retryCount > maxRetries) {
			return {
				shouldRetry: false,
				reason: `Limite de tentativas (${maxRetries}) atingido`,
				retryCount
			};
		}

		const analysis = await this.analyzeNeedForReplan(
			originalPrompt,
			currentResult,
			validationReport
		);

		this.replanAttempts.set(taskId, retryCount);

		return {
			shouldRetry: analysis.shouldReplan && analysis.confidence > 70,
			reason: analysis.divergenceReasons[0] || 'Replanejamento recomendado',
			retryCount
		};
	}

	/**
	 * Gerar relatório de replanejamento
	 */
	formatReplanReport(analysis: ReplanAnalysis, result: ReplanResult): string {
		let output = `
===========================================
🔄 RELATÓRIO DE REPLANEJAMENTO
===========================================

📊 ANÁLISE:
  Replanejamento Necessário: ${analysis.shouldReplan ? 'SIM' : 'NÃO'}
  Divergência Detectada: ${analysis.divergenceDetected ? 'SIM' : 'NÃO'}
  Confiança: ${analysis.confidence}%
  Esforço Estimado: ${analysis.estimatedEffort}

❌ RAZÕES DA DIVERGÊNCIA:
`;

		for (const reason of analysis.divergenceReasons) {
			output += `  - ${reason}\n`;
		}

		output += `
📋 NOVO PLANO:
${analysis.newPlan}

✅ RESULTADO:
  Replanejado: ${result.replanned ? 'SIM' : 'NÃO'}
  Tentativa: ${result.retryCount}
  Resultado Esperado: ${result.expectedOutcome}

===========================================
`;

		return output;
	}
}
