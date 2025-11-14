/**
 * CONTENT COMPLETENESS CHECKER - Detecção e Correção de Conteúdo Truncado
 * 
 * Detecta automaticamente se o conteúdo foi truncado/incompleto
 * e solicita à LLM que complete o conteúdo faltante.
 * 
 * 100% dinâmico via LLM - sem regex, sem hardcoded, sem mock.
 */

import { OpenAI } from 'openai';

export interface CompletenessAnalysis {
	isComplete: boolean;
	truncationDetected: boolean;
	missingParts: string[];
	confidence: number; // 0-100
	suggestedFix: string;
	completedContent?: string;
}

export class ContentCompletenessChecker {
	private openai: OpenAI;

	constructor(openai: OpenAI) {
		this.openai = openai;
	}

	/**
	 * Analisar se o conteúdo está completo
	 * Deixa a LLM decidir dinamicamente se há truncamento
	 */
	async checkCompleteness(
		originalPrompt: string,
		generatedContent: string,
		contentType: string
	): Promise<CompletenessAnalysis> {
		const systemPrompt = `Você é um especialista em análise de qualidade de conteúdo.

Analise o conteúdo gerado e determine se está COMPLETO ou TRUNCADO.

Responda em JSON com a seguinte estrutura:
{
  "isComplete": boolean,
  "truncationDetected": boolean,
  "missingParts": ["parte 1", "parte 2", ...],
  "confidence": número entre 0-100,
  "suggestedFix": "descrição do que precisa ser feito para completar"
}

CRITÉRIOS DE COMPLETUDE:
1. O conteúdo atende todos os requisitos do prompt original?
2. Há sinais de truncamento (texto cortado, frases incompletas)?
3. O conteúdo tem uma conclusão lógica?
4. Todos os tópicos prometidos foram cobertos?
5. A profundidade é adequada para o tipo de conteúdo?

SINAIS DE TRUNCAMENTO:
- Frases que terminam abruptamente
- Falta de conclusão ou resumo
- Tópicos mencionados mas não desenvolvidos
- Tabelas ou listas incompletas
- Falta de elementos visuais prometidos
- Número de páginas/slides menor que o solicitado

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

TIPO DE CONTEÚDO: ${contentType}

CONTEÚDO GERADO (primeiros 3000 caracteres):
${generatedContent.substring(0, 3000)}

ANÁLISE:
Determine se este conteúdo está completo ou truncado.`
					}
				],
				temperature: 0.3,
				max_tokens: 1000
			});

			const content = response.choices[0]?.message?.content || '{}';
			const analysis = JSON.parse(content) as CompletenessAnalysis;

			return analysis;
		} catch (error) {
			console.error('[ContentCompletenessChecker] Erro ao analisar completude:', error);
			return {
				isComplete: true,
				truncationDetected: false,
				missingParts: [],
				confidence: 0,
				suggestedFix: 'Análise automática falhou'
			};
		}
	}

	/**
	 * Corrigir conteúdo truncado solicitando à LLM que complete
	 */
	async fixTruncatedContent(
		originalPrompt: string,
		truncatedContent: string,
		missingParts: string[],
		contentType: string
	): Promise<string> {
		const systemPrompt = `Você é um especialista em completar conteúdo.

O conteúdo foi truncado/incompleto. Sua tarefa é COMPLETAR o conteúdo faltante.

INSTRUÇÕES:
1. Mantenha o estilo e tom do conteúdo original
2. Garanta progressão lógica e coerência
3. Complete as partes faltantes com qualidade equivalente
4. Não repita o conteúdo já existente
5. Mantenha a mesma profundidade e detalhe
6. Garanta que o resultado final seja COMPLETO e COESO

Responda com o conteúdo COMPLETO (não apenas as partes faltantes).`;

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

TIPO DE CONTEÚDO: ${contentType}

CONTEÚDO TRUNCADO:
${truncatedContent}

PARTES FALTANTES:
${missingParts.join('\n')}

TAREFA:
Complete o conteúdo acima, garantindo que todas as partes faltantes sejam incluídas.
Responda com o conteúdo COMPLETO e FINAL.`
					}
				],
				temperature: 0.7,
				max_tokens: 4000
			});

			const completedContent = response.choices[0]?.message?.content || truncatedContent;
			return completedContent;
		} catch (error) {
			console.error('[ContentCompletenessChecker] Erro ao corrigir conteúdo:', error);
			return truncatedContent;
		}
	}

	/**
	 * Validar se o conteúdo completo atende aos requisitos
	 */
	async validateCompletedContent(
		originalPrompt: string,
		completedContent: string,
		contentType: string
	): Promise<{ isValid: boolean; issues: string[]; score: number }> {
		const systemPrompt = `Você é um validador de qualidade de conteúdo.

Valide se o conteúdo completo atende aos requisitos do prompt original.

Responda em JSON:
{
  "isValid": boolean,
  "issues": ["issue1", "issue2", ...],
  "score": número entre 0-100
}

CRITÉRIOS:
- Completude: Todos os requisitos foram atendidos?
- Coerência: O conteúdo é lógico e coeso?
- Qualidade: O conteúdo é de alta qualidade?
- Profundidade: A profundidade é adequada?
- Formatação: O conteúdo está bem formatado?

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

TIPO DE CONTEÚDO: ${contentType}

CONTEÚDO COMPLETO (primeiros 3000 caracteres):
${completedContent.substring(0, 3000)}

Valide se este conteúdo atende aos requisitos.`
					}
				],
				temperature: 0.3,
				max_tokens: 1000
			});

			const content = response.choices[0]?.message?.content || '{}';
			const validation = JSON.parse(content);

			return {
				isValid: validation.isValid ?? true,
				issues: validation.issues ?? [],
				score: validation.score ?? 80
			};
		} catch (error) {
			console.error('[ContentCompletenessChecker] Erro ao validar conteúdo:', error);
			return {
				isValid: false,
				issues: ['Validação automática falhou'],
				score: 0
			};
		}
	}

	/**
	 * Fluxo completo: Checar, Corrigir e Validar
	 */
	async ensureCompleteness(
		originalPrompt: string,
		generatedContent: string,
		contentType: string,
		maxRetries: number = 3
	): Promise<{ content: string; isComplete: boolean; attempts: number }> {
		let currentContent = generatedContent;
		let attempts = 0;

		while (attempts < maxRetries) {
			attempts++;

			// Verificar completude
			const analysis = await this.checkCompleteness(
				originalPrompt,
				currentContent,
				contentType
			);

			if (analysis.isComplete && analysis.confidence > 80) {
				// Conteúdo está completo
				return { content: currentContent, isComplete: true, attempts };
			}

			// Conteúdo está incompleto - corrigir
			console.log(
				`[ContentCompletenessChecker] Conteúdo incompleto detectado (tentativa ${attempts}/${maxRetries})`
			);
			console.log(`[ContentCompletenessChecker] Partes faltantes: ${analysis.missingParts.join(', ')}`);

			currentContent = await this.fixTruncatedContent(
				originalPrompt,
				currentContent,
				analysis.missingParts,
				contentType
			);

			// Validar conteúdo corrigido
			const validation = await this.validateCompletedContent(
				originalPrompt,
				currentContent,
				contentType
			);

			if (validation.isValid && validation.score > 80) {
				return { content: currentContent, isComplete: true, attempts };
			}

			if (validation.issues.length > 0) {
				console.log(`[ContentCompletenessChecker] Problemas encontrados: ${validation.issues.join(', ')}`);
			}
		}

		// Retornar melhor conteúdo obtido após máximo de tentativas
		return { content: currentContent, isComplete: false, attempts };
	}
}
