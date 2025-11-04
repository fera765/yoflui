import OpenAI from 'openai';
import { AnalyzedIntention } from './types.js';

/**
 * AGENTE DE ANÁLISE DE INTENÇÃO
 * 
 * Extrai a intenção principal, restrições, critérios de sucesso
 * e formato de saída esperado do prompt do usuário
 */
export class IntentionAnalyzer {
	/**
	 * Analisa o prompt do usuário e extrai a estrutura de intenção
	 */
	async analyze(userPrompt: string, openai: OpenAI): Promise<AnalyzedIntention> {
		const analysisPrompt = `Você é o Agente de Análise de Intenção do FLUI AGI.

Sua tarefa é extrair informações estruturadas do prompt do usuário para planeamento eficiente.

PROMPT DO USUÁRIO:
"""
${userPrompt}
"""

Extraia e retorne APENAS um JSON com:
{
  "mainGoal": "objetivo principal em uma frase clara",
  "constraints": ["restrição 1", "restrição 2"],
  "successCriteria": ["critério 1", "critério 2"],
  "outputFormat": "formato esperado (texto, tabela, código, etc)",
  "complexity": "simple|medium|complex",
  "estimatedSubTasks": número (1-20)
}

Regras:
- mainGoal: O que o usuário quer alcançar
- constraints: Limitações explícitas (ex: "não use browser", "max 2 páginas")
- successCriteria: Como saber se foi bem-sucedido
- outputFormat: Como apresentar o resultado
- complexity: simple (1-2 etapas), medium (3-5 etapas), complex (6+ etapas)
- estimatedSubTasks: Quantas sub-tarefas você estima que serão necessárias`;

		const response = await openai.chat.completions.create({
			model: 'qwen-max',
			messages: [{ role: 'user', content: analysisPrompt }],
			temperature: 0.2, // Baixa temperatura para análise precisa
		});

		const content = response.choices[0]?.message?.content || '{}';
		
		try {
			// Limpar markdown se presente
			const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
			const intention: AnalyzedIntention = JSON.parse(cleanContent);
			
			// Validar e aplicar defaults
			return {
				mainGoal: intention.mainGoal || userPrompt,
				constraints: intention.constraints || [],
				successCriteria: intention.successCriteria || ['Tarefa completada com sucesso'],
				outputFormat: intention.outputFormat || 'texto claro e estruturado',
				complexity: intention.complexity || 'medium',
				estimatedSubTasks: intention.estimatedSubTasks || 3,
			};
		} catch (error) {
			// Fallback em caso de erro no parsing
			return {
				mainGoal: userPrompt,
				constraints: [],
				successCriteria: ['Tarefa completada com sucesso'],
				outputFormat: 'texto claro',
				complexity: 'medium',
				estimatedSubTasks: 3,
			};
		}
	}
}
