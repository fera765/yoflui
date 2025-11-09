import { executeToolCall } from '../tools/index.js';

/**
 * AGENTE DE AUTOMAÇÃO DEDICADO
 * 
 * Responsável exclusivamente por executar automações
 * e fornecer feedback estruturado de execução
 */
export class AutomationAgent {
	/**
	 * Executa uma automação e retorna log estruturado
	 */
	async executeAutomation(
		automationCommand: string,
		args: any,
		workDir: string
	): Promise<{
		success: boolean;
		output: string;
		executionTime: number;
		error?: string;
	}> {
		const startTime = Date.now();

		try {
			const result = await executeToolCall(automationCommand, args, workDir);
			const executionTime = Date.now() - startTime;

			return {
				success: true,
				output: result,
				executionTime,
			};

		} catch (error) {
			const executionTime = Date.now() - startTime;
			const errorMsg = error instanceof Error ? error.message : String(error);

			return {
				success: false,
				output: '',
				executionTime,
				error: errorMsg,
			};
		}
	}

	/**
	 * Valida se uma automação foi concluída com sucesso
	 */
	validateExecution(result: {
		success: boolean;
		output: string;
		executionTime: number;
		error?: string;
	}): boolean {
		if (!result.success) {
			return false;
		}

		// Verificar se output contém indicadores de erro
		const errorIndicators = ['error:', 'failed', 'exception', 'cannot', 'unable'];
		const outputLower = result.output.toLowerCase();

		for (const indicator of errorIndicators) {
			if (outputLower.includes(indicator)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Formata log de execução para feedback ao Orquestrador
	 */
	formatExecutionLog(result: {
		success: boolean;
		output: string;
		executionTime: number;
		error?: string;
	}): string {
		if (result.success) {
			return `[AUTOMAÇÃO CONCLUÍDA]
Tempo: ${result.executionTime}ms
Status: Sucesso ✓
Output: ${result.output.substring(0, 500)}`;
		} else {
			return `[AUTOMAÇÃO FALHOU]
Tempo: ${result.executionTime}ms
Status: Erro ✗
Erro: ${result.error || 'Desconhecido'}`;
		}
	}
}
