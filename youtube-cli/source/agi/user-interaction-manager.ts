/**
 * User Interaction Manager - Gerencia interações com o usuário durante execução
 * 
 * Permite ao FLUI solicitar informações adicionais quando necessário
 */

import { UserQuestion, UserAnswer } from './types.js';

export type UserResponseCallback = (question: UserQuestion) => Promise<string>;

export class UserInteractionManager {
	private questionCounter = 0;
	private pendingQuestions: Map<string, UserQuestion> = new Map();
	private answers: Map<string, UserAnswer> = new Map();
	private responseCallback?: UserResponseCallback;
	
	/**
	 * Configurar callback para obter resposta do usuário
	 */
	setResponseCallback(callback: UserResponseCallback) {
		this.responseCallback = callback;
	}
	
	/**
	 * Solicitar informação ao usuário
	 */
	async askUser(
		question: string,
		context?: string,
		placeholder?: string,
		required: boolean = true
	): Promise<string> {
		const userQuestion: UserQuestion = {
			id: `question-${++this.questionCounter}`,
			question,
			context,
			placeholder,
			required
		};
		
		this.pendingQuestions.set(userQuestion.id, userQuestion);
		
		if (!this.responseCallback) {
			throw new Error('Response callback not configured');
		}
		
		// Aguardar resposta do usuário via callback
		const answer = await this.responseCallback(userQuestion);
		
		// Registrar resposta
		const userAnswer: UserAnswer = {
			questionId: userQuestion.id,
			answer,
			timestamp: Date.now()
		};
		
		this.answers.set(userQuestion.id, userAnswer);
		this.pendingQuestions.delete(userQuestion.id);
		
		return answer;
	}
	
	/**
	 * Verificar se há perguntas pendentes
	 */
	hasPendingQuestions(): boolean {
		return this.pendingQuestions.size > 0;
	}
	
	/**
	 * Obter histórico de perguntas e respostas
	 */
	getHistory(): Array<{ question: string; answer: string }> {
		return Array.from(this.answers.values()).map(answer => {
			const question = this.pendingQuestions.get(answer.questionId);
			return {
				question: question?.question || 'Unknown',
				answer: answer.answer
			};
		});
	}
	
	/**
	 * Limpar histórico
	 */
	clear() {
		this.questionCounter = 0;
		this.pendingQuestions.clear();
		this.answers.clear();
	}
}
