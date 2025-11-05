/**
 * OTIMIZADOR DE OUTPUT - Token Economy
 * 
 * Este módulo é responsável por:
 * 1. Processar saídas verbosas de ferramentas/automações
 * 2. Gerar resumos concisos para o usuário
 * 3. Maximizar economia de tokens mantendo informação essencial
 * 4. Decidir quando mostrar detalhes completos vs resumo
 */

export interface OutputSummary {
	conciseSummary: string; // Resumo de 1-3 frases para o usuário
	detailLevel: 'minimal' | 'standard' | 'verbose';
	tokensEstimate: number;
	keyPoints: string[];
	fullOutputAvailable: boolean;
}

export class OutputOptimizer {
	/**
	 * Otimizar output de ferramenta/etapa para apresentação ao usuário
	 * 
	 * Estratégia:
	 * 1. Se output < 200 chars: mostrar completo
	 * 2. Se output 200-1000 chars: resumir mantendo pontos-chave
	 * 3. Se output > 1000 chars: resumo muito conciso + menção a detalhes disponíveis
	 */
	optimizeOutput(
		rawOutput: string,
		toolName: string,
		taskTitle: string,
		success: boolean
	): OutputSummary {
		const length = rawOutput.length;

		// OUTPUT CURTO: Mostrar completo
		if (length < 200) {
			return {
				conciseSummary: `✅ ${taskTitle}: ${rawOutput}`,
				detailLevel: 'minimal',
				tokensEstimate: this.estimateTokens(rawOutput),
				keyPoints: [rawOutput],
				fullOutputAvailable: false,
			};
		}

		// OUTPUT MÉDIO: Resumir mantendo estrutura
		if (length < 1000) {
			const summary = this.createMediumSummary(rawOutput, taskTitle, success);
			return {
				conciseSummary: summary,
				detailLevel: 'standard',
				tokensEstimate: this.estimateTokens(summary),
				keyPoints: this.extractKeyPoints(rawOutput),
				fullOutputAvailable: true,
			};
		}

		// OUTPUT LONGO: Resumo muito conciso
		const summary = this.createConciseSummary(toolName, taskTitle, success, length);
		return {
			conciseSummary: summary,
			detailLevel: 'verbose',
			tokensEstimate: this.estimateTokens(summary),
			keyPoints: this.extractKeyPoints(rawOutput.substring(0, 500)),
			fullOutputAvailable: true,
		};
	}

	/**
	 * Criar resumo conciso para output longo
	 */
	private createConciseSummary(
		toolName: string,
		taskTitle: string,
		success: boolean,
		outputLength: number
	): string {
		const status = success ? '✅' : '⚠️';
		const verb = success ? 'completou' : 'executou';
		
		return `${status} ${taskTitle}: ${toolName} ${verb} com sucesso (${outputLength} chars de output gerados)`;
	}

	/**
	 * Criar resumo médio preservando informação essencial
	 */
	private createMediumSummary(
		rawOutput: string,
		taskTitle: string,
		success: boolean
	): string {
		const status = success ? '✅' : '⚠️';
		
		// Extrair primeiras 150 chars + últimas 50 chars
		const start = rawOutput.substring(0, 150);
		const end = rawOutput.length > 200 ? rawOutput.substring(rawOutput.length - 50) : '';
		
		if (end) {
			return `${status} ${taskTitle}:\n${start}...\n...${end}`;
		}
		
		return `${status} ${taskTitle}: ${rawOutput}`;
	}

	/**
	 * Extrair pontos-chave do output
	 */
	private extractKeyPoints(rawOutput: string): string[] {
		const points: string[] = [];
		
		// Buscar linhas que parecem ser pontos importantes
		const lines = rawOutput.split('\n');
		
		for (const line of lines) {
			const trimmed = line.trim();
			
			// Pontos que começam com -, *, números, emojis
			if (/^[\-\*\d]+[\.\)]\s/.test(trimmed) || /^[✅❌⚠️✓]/.test(trimmed)) {
				if (trimmed.length > 10 && trimmed.length < 150) {
					points.push(trimmed);
				}
			}
			
			if (points.length >= 5) break; // Máximo 5 pontos-chave
		}
		
		return points;
	}

	/**
	 * Estimar tokens (aproximação: 1 token ≈ 4 chars)
	 */
	private estimateTokens(text: string): number {
		return Math.ceil(text.length / 4);
	}

	/**
	 * Gerar resumo de execução completa (múltiplas etapas)
	 * 
	 * Para output final ao usuário após todas as etapas
	 */
	generateExecutionSummary(
		mainGoal: string,
		completedSteps: number,
		totalSteps: number,
		resourcesCreated: string[],
		finalResult: string
	): string {
		const lines: string[] = [];
		
		lines.push(`✅ **Tarefa Concluída: ${mainGoal}**\n`);
		lines.push(`**Progresso:** ${completedSteps}/${totalSteps} etapas executadas`);
		
		if (resourcesCreated.length > 0) {
			lines.push(`\n**Recursos Criados:**`);
			for (const resource of resourcesCreated.slice(0, 5)) {
				lines.push(`- ${resource}`);
			}
			if (resourcesCreated.length > 5) {
				lines.push(`- ... e mais ${resourcesCreated.length - 5} recursos`);
			}
		}
		
		lines.push(`\n**Resultado Final:**`);
		
		// Resumir resultado final se muito longo
		if (finalResult.length > 500) {
			lines.push(finalResult.substring(0, 500) + '...\n');
			lines.push(`\n_Resultado completo disponível (${finalResult.length} chars)_`);
		} else {
			lines.push(finalResult);
		}
		
		return lines.join('\n');
	}

	/**
	 * Formatar progresso de execução (para onProgress)
	 * 
	 * Output conciso durante a execução
	 */
	formatProgress(
		currentStep: number,
		totalSteps: number,
		stepTitle: string,
		stepStatus: 'pending' | 'in_progress' | 'completed' | 'error'
	): string {
		const statusEmoji = {
			pending: '⏸️',
			in_progress: '⚡',
			completed: '✅',
			error: '❌',
		};
		
		const emoji = statusEmoji[stepStatus];
		const progress = totalSteps > 0 ? `[${currentStep}/${totalSteps}]` : '';
		
		return `${emoji} ${progress} ${stepTitle}`;
	}

	/**
	 * Decidir se deve mostrar output completo ou resumo
	 * 
	 * Baseado em:
	 * - Tamanho do output
	 * - Tipo de tarefa
	 * - Preferência do usuário (se configurada)
	 */
	shouldShowFullOutput(
		outputLength: number,
		toolName: string,
		userPreference: 'concise' | 'detailed' | 'auto' = 'auto'
	): boolean {
		if (userPreference === 'detailed') return true;
		if (userPreference === 'concise') return false;
		
		// Auto: decisão inteligente
		// Sempre mostrar completo para outputs curtos
		if (outputLength < 300) return true;
		
		// Para ferramentas de leitura, preferir resumo
		if (toolName.includes('read') || toolName.includes('search')) {
			return outputLength < 500;
		}
		
		// Para ferramentas de escrita/criação, mostrar completo (confirmação)
		if (toolName.includes('write') || toolName.includes('create')) {
			return outputLength < 1000;
		}
		
		// Padrão: resumo para outputs longos
		return outputLength < 600;
	}
}
