/**
 * UI FORMATTER - Formatação elegante para execução de automações
 */

export class AutomationUIFormatter {
	/**
	 * Formata início de automação
	 */
	static formatStart(name: string, description: string): string {
		const border = '═'.repeat(70);
		return `
╔${border}╗
║  🤖 ${name.padEnd(65)}║
║  📝 ${description.substring(0, 65).padEnd(65)}║
╚${border}╝
`;
	}

	/**
	 * Formata step em execução
	 */
	static formatStepRunning(stepType: string, stepId: string): string {
		const emoji = this.getStepEmoji(stepType);
		return `${emoji} Executando: ${stepType} (${stepId})`;
	}

	/**
	 * Formata step concluído
	 */
	static formatStepComplete(stepType: string, stepId: string, success: boolean): string {
		const emoji = success ? '✅' : '❌';
		return `${emoji} ${stepType} (${stepId})`;
	}

	/**
	 * Formata mensagem de log
	 */
	static formatLogMessage(message: string, level: string = 'info'): string {
		const emoji = this.getLogEmoji(level);
		return `${emoji} ${message}`;
	}

	/**
	 * Formata variável definida
	 */
	static formatVariable(name: string, value: string): string {
		return `📊 ${name} = "${value}"`;
	}

	/**
	 * Formata conclusão de automação
	 */
	static formatComplete(success: boolean, duration: number, stepsExecuted: number): string {
		const emoji = success ? '🎉' : '⚠️';
		const status = success ? 'SUCESSO' : 'PARCIAL';
		const border = '─'.repeat(70);
		
		return `
${border}
${emoji} Automação Concluída: ${status}
⏱️  Tempo: ${(duration / 1000).toFixed(2)}s
📊 Steps: ${stepsExecuted}
${border}
`;
	}

	/**
	 * Retorna emoji baseado no tipo de step
	 */
	private static getStepEmoji(stepType: string): string {
		const emojiMap: Record<string, string> = {
			'log': '📝',
			'tool': '🔧',
			'set_variable': '📊',
			'conditional': '🔀',
			'llm': '🧠',
			'user_input': '⌨️',
			'end': '🏁'
		};
		return emojiMap[stepType] || '⚙️';
	}

	/**
	 * Retorna emoji baseado no nível de log
	 */
	private static getLogEmoji(level: string): string {
		const emojiMap: Record<string, string> = {
			'info': 'ℹ️',
			'success': '✅',
			'warning': '⚠️',
			'error': '❌',
			'debug': '🐛'
		};
		return emojiMap[level] || 'ℹ️';
	}

	/**
	 * Formata progresso de automação
	 */
	static formatProgress(current: number, total: number): string {
		const percentage = Math.round((current / total) * 100);
		const filled = Math.round(percentage / 5); // 20 blocos max
		const empty = 20 - filled;
		
		const bar = '█'.repeat(filled) + '░'.repeat(empty);
		return `📈 Progresso: [${bar}] ${percentage}% (${current}/${total})`;
	}
}
