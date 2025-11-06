/**
 * Feedback Generator - Gera feedbacks breves (máx 30 palavras) antes de cada ação
 */

import OpenAI from 'openai';
import { getConfig } from '../llm-config.js';
import { FluiFeedback } from './types.js';

export class FeedbackGenerator {
	private openai: OpenAI;
	
	constructor(openai: OpenAI) {
		this.openai = openai;
	}
	
	/**
	 * Gerar feedback antes de criar kanban
	 */
	generateKanbanCreationFeedback(userGoal: string): FluiFeedback {
		return {
			type: 'action',
			message: `Vou analisar "${userGoal}" e criar um plano de ação para executar com excelência.`,
			timestamp: Date.now()
		};
	}
	
	/**
	 * Gerar feedback antes de executar uma tool
	 */
	async generateToolExecutionFeedback(
		toolName: string,
		toolArgs: any,
		context: string
	): Promise<FluiFeedback> {
		try {
			const config = getConfig();
			
			const prompt = `Você é o FLUI, um assistente AGI. 
Explique em MÁXIMO 30 palavras o que você vai fazer AGORA.

CONTEXTO: ${context}
TOOL: ${toolName}
ARGS: ${JSON.stringify(toolArgs).substring(0, 100)}

Responda de forma natural, direta e amigável. Comece com um verbo de ação.
Exemplos:
- "Vou ler o arquivo package.json para entender as dependências do projeto."
- "Vou executar o comando npm install para instalar as dependências."
- "Vou buscar informações sobre React na web para responder sua pergunta."

APENAS a frase de ação, SEM explicações adicionais. Máximo 30 palavras.`;

			const response = await this.openai.chat.completions.create({
				model: config.model || 'qwen-max',
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.7,
				max_tokens: 100
			});
			
			const message = response.choices[0]?.message?.content?.trim() || 
				this.getFallbackFeedback(toolName);
			
			return {
				type: 'action',
				message: this.truncateToMaxWords(message, 30),
				timestamp: Date.now()
			};
		} catch (error) {
			return {
				type: 'action',
				message: this.getFallbackFeedback(toolName),
				timestamp: Date.now()
			};
		}
	}
	
	/**
	 * Gerar feedback ao completar uma tarefa
	 */
	generateTaskCompletionFeedback(taskTitle: string, success: boolean): FluiFeedback {
		if (success) {
			return {
				type: 'success',
				message: `Concluí com sucesso: ${taskTitle}`,
				timestamp: Date.now()
			};
		} else {
			return {
				type: 'info',
				message: `Finalizei "${taskTitle}" mas encontrei algumas limitações.`,
				timestamp: Date.now()
			};
		}
	}
	
	/**
	 * Gerar feedback ao atualizar kanban
	 */
	generateKanbanUpdateFeedback(
		completedTasks: number,
		totalTasks: number,
		currentTask?: string
	): FluiFeedback {
		if (completedTasks === totalTasks) {
			return {
				type: 'success',
				message: `Excelente! Todas as ${totalTasks} tarefas foram concluídas com sucesso.`,
				timestamp: Date.now()
			};
		} else if (currentTask) {
			return {
				type: 'action',
				message: `Avançando para: ${currentTask} (${completedTasks + 1}/${totalTasks})`,
				timestamp: Date.now()
			};
		} else {
			return {
				type: 'info',
				message: `Progresso: ${completedTasks}/${totalTasks} tarefas concluídas`,
				timestamp: Date.now()
			};
		}
	}
	
	/**
	 * Gerar feedback ao criar relatório final
	 */
	generateFinalReportFeedback(): FluiFeedback {
		return {
			type: 'action',
			message: `Vou criar um documento detalhando tudo que foi realizado.`,
			timestamp: Date.now()
		};
	}
	
	/**
	 * Feedback de fallback por tipo de tool
	 */
	private getFallbackFeedback(toolName: string): string {
		const feedbackMap: Record<string, string> = {
			write_file: 'Vou criar um arquivo com o conteúdo especificado.',
			read_file: 'Vou ler o arquivo para análise.',
			edit_file: 'Vou editar o arquivo conforme solicitado.',
			delete_file: 'Vou remover o arquivo.',
			execute_shell: 'Vou executar o comando no terminal.',
			find_files: 'Vou buscar os arquivos no diretório.',
			read_folder: 'Vou listar o conteúdo do diretório.',
			search_text: 'Vou procurar pelo texto especificado.',
			web_scraper: 'Vou buscar informações na web.',
			intelligent_web_research: 'Vou realizar uma pesquisa aprofundada.',
			search_youtube_comments: 'Vou buscar comentários no YouTube.',
			save_memory: 'Vou salvar esta informação na memória.',
			default: 'Vou executar a ação solicitada.'
		};
		
		return feedbackMap[toolName] || feedbackMap.default;
	}
	
	/**
	 * Truncar mensagem para máximo de N palavras
	 */
	private truncateToMaxWords(text: string, maxWords: number): string {
		const words = text.trim().split(/\s+/);
		if (words.length <= maxWords) {
			return text;
		}
		return words.slice(0, maxWords).join(' ') + '...';
	}
}
