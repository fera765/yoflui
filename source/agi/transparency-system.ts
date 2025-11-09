/**
 * SISTEMA DE TRANSPARÊNCIA RADICAL
 * 
 * Implementa:
 * - Logging detalhado de todas as decisões
 * - Raciocínio vis Reasoning visível e explicável
 * - Trace completo de execução
 * - Explicação de cada ação
 * - Audit trail completo
 * 
 * Torna o Flui 10/10 em TRANSPARÊNCIA
 */

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';
export type DecisionType = 'tool_selection' | 'mode_selection' | 'task_decomposition' | 'error_recovery' | 'validation' | 'planning';

export interface LogEntry {
	id: string;
	timestamp: number;
	level: LogLevel;
	category: string;
	message: string;
	data?: Record<string, any>;
	context?: {
		taskId?: string;
		stepId?: string;
		userId?: string;
	};
}

export interface DecisionLog {
	id: string;
	timestamp: number;
	type: DecisionType;
	decision: string;
	reasoning: string[];
	alternatives: Array<{
		option: string;
		score: number;
		reasoning: string;
	}>;
	confidence: number; // 0-100
	metadata?: Record<string, any>;
}

export interface ExecutionTrace {
	id: string;
	taskId: string;
	startTime: number;
	endTime?: number;
	status: 'running' | 'completed' | 'failed' | 'cancelled';
	steps: ExecutionStep[];
	decisions: DecisionLog[];
	logs: LogEntry[];
	metrics: {
		totalSteps: number;
		completedSteps: number;
		failedSteps: number;
		totalDuration: number;
		avgStepDuration: number;
	};
}

export interface ExecutionStep {
	id: string;
	name: string;
	startTime: number;
	endTime?: number;
	status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
	tool?: string;
	input: Record<string, any>;
	output?: any;
	error?: string;
	reasoning: string;
	duration?: number;
}

export class TransparencySystem {
	private logs: LogEntry[] = [];
	private decisions: DecisionLog[] = [];
	private traces: Map<string, ExecutionTrace> = new Map();
	private currentTrace: ExecutionTrace | null = null;
	private logListeners: Array<(entry: LogEntry) => void> = [];
	private decisionListeners: Array<(decision: DecisionLog) => void> = [];
	private maxLogsInMemory = 10000;
	private logLevel: LogLevel = 'info';

	/**
	 * Configurar nível de log mínimo
	 */
	setLogLevel(level: LogLevel) {
		this.logLevel = level;
	}

	/**
	 * Adicionar listener para logs em tempo real
	 */
	addLogListener(listener: (entry: LogEntry) => void) {
		this.logListeners.push(listener);
	}

	/**
	 * Adicionar listener para decisões
	 */
	addDecisionListener(listener: (decision: DecisionLog) => void) {
		this.decisionListeners.push(listener);
	}

	/**
	 * Iniciar trace de execução
	 */
	startTrace(taskId: string): string {
		const trace: ExecutionTrace = {
			id: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			taskId,
			startTime: Date.now(),
			status: 'running',
			steps: [],
			decisions: [],
			logs: [],
			metrics: {
				totalSteps: 0,
				completedSteps: 0,
				failedSteps: 0,
				totalDuration: 0,
				avgStepDuration: 0,
			},
		};

		this.traces.set(trace.id, trace);
		this.currentTrace = trace;

		this.log('info', 'execution', `Iniciando execução da tarefa: ${taskId}`, { traceId: trace.id });

		return trace.id;
	}

	/**
	 * Finalizar trace de execução
	 */
	endTrace(traceId: string, status: 'completed' | 'failed' | 'cancelled') {
		const trace = this.traces.get(traceId);
		if (!trace) return;

		trace.endTime = Date.now();
		trace.status = status;
		trace.metrics.totalDuration = trace.endTime - trace.startTime;

		if (trace.steps.length > 0) {
			const completedSteps = trace.steps.filter(s => s.status === 'completed');
			const totalDuration = completedSteps.reduce((sum, s) => sum + (s.duration || 0), 0);
			trace.metrics.avgStepDuration = totalDuration / completedSteps.length;
		}

		this.log('info', 'execution', `Finalizando execução: ${status}`, {
			traceId,
			duration: trace.metrics.totalDuration,
			steps: trace.metrics.totalSteps,
		});

		if (this.currentTrace?.id === traceId) {
			this.currentTrace = null;
		}
	}

	/**
	 * Adicionar passo de execução
	 */
	addStep(step: Omit<ExecutionStep, 'id' | 'startTime' | 'status'>): string {
		if (!this.currentTrace) {
			throw new Error('Nenhum trace ativo');
		}

		const fullStep: ExecutionStep = {
			id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			startTime: Date.now(),
			status: 'running',
			...step,
		};

		this.currentTrace.steps.push(fullStep);
		this.currentTrace.metrics.totalSteps++;

		this.log('debug', 'step', `Iniciando passo: ${step.name}`, {
			stepId: fullStep.id,
			tool: step.tool,
			reasoning: step.reasoning,
		});

		return fullStep.id;
	}

	/**
	 * Atualizar status de passo
	 */
	updateStep(
		stepId: string,
		updates: Partial<Pick<ExecutionStep, 'status' | 'output' | 'error'>>
	) {
		if (!this.currentTrace) return;

		const step = this.currentTrace.steps.find(s => s.id === stepId);
		if (!step) return;

		Object.assign(step, updates);

		if (updates.status === 'completed' || updates.status === 'failed') {
			step.endTime = Date.now();
			step.duration = step.endTime - step.startTime;

			if (updates.status === 'completed') {
				this.currentTrace.metrics.completedSteps++;
			} else if (updates.status === 'failed') {
				this.currentTrace.metrics.failedSteps++;
			}

			this.log(
				updates.status === 'completed' ? 'info' : 'error',
				'step',
				`Passo ${updates.status}: ${step.name}`,
				{
					stepId,
					duration: step.duration,
					error: updates.error,
				}
			);
		}
	}

	/**
	 * Registrar uma decisão com raciocínio completo
	 */
	logDecision(decision: Omit<DecisionLog, 'id' | 'timestamp'>): string {
		const fullDecision: DecisionLog = {
			id: `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: Date.now(),
			...decision,
		};

		this.decisions.push(fullDecision);

		if (this.currentTrace) {
			this.currentTrace.decisions.push(fullDecision);
		}

		// Emitir para listeners
		for (const listener of this.decisionListeners) {
			try {
				listener(fullDecision);
			} catch (error) {
				console.error('[TransparencySystem] Erro no listener de decisão:', error);
			}
		}

		// Log detalhado da decisão
		this.log('info', 'decision', `Decisão tomada: ${decision.decision}`, {
			decisionId: fullDecision.id,
			type: decision.type,
			confidence: decision.confidence,
			reasoning: decision.reasoning,
			alternatives: decision.alternatives,
		});

		return fullDecision.id;
	}

	/**
	 * Registrar log genérico
	 */
	log(
		level: LogLevel,
		category: string,
		message: string,
		data?: Record<string, any>,
		context?: LogEntry['context']
	): string {
		// Verificar nível mínimo
		const levels: LogLevel[] = ['debug', 'info', 'warning', 'error', 'critical'];
		if (levels.indexOf(level) < levels.indexOf(this.logLevel)) {
			return ''; // Não loggar
		}

		const entry: LogEntry = {
			id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: Date.now(),
			level,
			category,
			message,
			data,
			context,
		};

		this.logs.push(entry);

		// Adicionar ao trace atual
		if (this.currentTrace) {
			this.currentTrace.logs.push(entry);
		}

		// Emitir para listeners
		for (const listener of this.logListeners) {
			try {
				listener(entry);
			} catch (error) {
				console.error('[TransparencySystem] Erro no listener de log:', error);
			}
		}

		// Limpar logs antigos se exceder limite
		if (this.logs.length > this.maxLogsInMemory) {
			this.logs.splice(0, this.logs.length - this.maxLogsInMemory);
		}

		// Imprimir no console se nível >= warning
		if (levels.indexOf(level) >= levels.indexOf('warning')) {
			const prefix = this.getLogPrefix(level);
			console.log(`${prefix} [${category}] ${message}`, data ? data : '');
		}

		return entry.id;
	}

	/**
	 * Obter prefix para console
	 */
	private getLogPrefix(level: LogLevel): string {
		switch (level) {
			case 'debug': return '🔍';
			case 'info': return 'ℹ️';
			case 'warning': return '⚠️';
			case 'error': return '❌';
			case 'critical': return '🚨';
		}
	}

	/**
	 * Explicar uma decisão de forma humana
	 */
	explainDecision(decisionId: string): string {
		const decision = this.decisions.find(d => d.id === decisionId);
		if (!decision) return 'Decisão não encontrada';

		const lines: string[] = [];
		lines.push(`\n🤔 Decisão: ${decision.decision}`);
		lines.push(`📊 Confiança: ${decision.confidence}%`);
		lines.push(`🕐 Momento: ${new Date(decision.timestamp).toLocaleString()}`);
		lines.push('\n💭 Raciocínio:');
		
		for (let i = 0; i < decision.reasoning.length; i++) {
			lines.push(`  ${i + 1}. ${decision.reasoning[i]}`);
		}

		if (decision.alternatives.length > 0) {
			lines.push('\n🔄 Alternativas consideradas:');
			for (const alt of decision.alternatives) {
				lines.push(`  • ${alt.option} (score: ${alt.score})`);
				lines.push(`    ↳ ${alt.reasoning}`);
			}
		}

		return lines.join('\n');
	}

	/**
	 * Gerar relatório de execução
	 */
	generateExecutionReport(traceId: string): string {
		const trace = this.traces.get(traceId);
		if (!trace) return 'Trace não encontrado';

		const lines: string[] = [];
		lines.push('\n📊 RELATÓRIO DE EXECUÇÃO\n');
		lines.push(`Task ID: ${trace.taskId}`);
		lines.push(`Status: ${trace.status}`);
		lines.push(`Duração: ${trace.metrics.totalDuration}ms`);
		lines.push(`Passos: ${trace.metrics.completedSteps}/${trace.metrics.totalSteps} completados`);
		
		if (trace.metrics.failedSteps > 0) {
			lines.push(`⚠️  Falhas: ${trace.metrics.failedSteps}`);
		}

		lines.push(`\n📈 Métricas:`);
		lines.push(`  - Duração média por passo: ${trace.metrics.avgStepDuration.toFixed(0)}ms`);
		lines.push(`  - Taxa de sucesso: ${((trace.metrics.completedSteps / trace.metrics.totalSteps) * 100).toFixed(1)}%`);

		lines.push(`\n🎯 Decisões Tomadas: ${trace.decisions.length}`);
		for (const decision of trace.decisions) {
			lines.push(`  • ${decision.type}: ${decision.decision} (${decision.confidence}% confiança)`);
		}

		lines.push(`\n📝 Passos Executados:`);
		for (const step of trace.steps) {
			const icon = step.status === 'completed' ? '✅' : step.status === 'failed' ? '❌' : '⏳';
			const duration = step.duration ? ` (${step.duration}ms)` : '';
			lines.push(`  ${icon} ${step.name}${duration}`);
			if (step.reasoning) {
				lines.push(`     💭 ${step.reasoning}`);
			}
			if (step.error) {
				lines.push(`     ⚠️  ${step.error}`);
			}
		}

		lines.push(`\n📚 Logs: ${trace.logs.length} entradas`);
		const logsByLevel = trace.logs.reduce((acc, log) => {
			acc[log.level] = (acc[log.level] || 0) + 1;
			return acc;
		}, {} as Record<LogLevel, number>);
		for (const [level, count] of Object.entries(logsByLevel)) {
			lines.push(`  - ${level}: ${count}`);
		}

		return lines.join('\n');
	}

	/**
	 * Buscar logs
	 */
	searchLogs(filters: {
		level?: LogLevel;
		category?: string;
		messagePattern?: RegExp;
		startTime?: number;
		endTime?: number;
	}): LogEntry[] {
		return this.logs.filter(log => {
			if (filters.level && log.level !== filters.level) return false;
			if (filters.category && log.category !== filters.category) return false;
			if (filters.messagePattern && !filters.messagePattern.test(log.message)) return false;
			if (filters.startTime && log.timestamp < filters.startTime) return false;
			if (filters.endTime && log.timestamp > filters.endTime) return false;
			return true;
		});
	}

	/**
	 * Exportar trace para JSON
	 */
	exportTrace(traceId: string): string {
		const trace = this.traces.get(traceId);
		if (!trace) return '{}';
		return JSON.stringify(trace, null, 2);
	}

	/**
	 * Obter trace atual
	 */
	getCurrentTrace(): ExecutionTrace | null {
		return this.currentTrace;
	}

	/**
	 * Obter estatísticas globais
	 */
	getStats() {
		const totalTraces = this.traces.size;
		const completedTraces = Array.from(this.traces.values()).filter(t => t.status === 'completed').length;
		const failedTraces = Array.from(this.traces.values()).filter(t => t.status === 'failed').length;

		const logsByLevel = this.logs.reduce((acc, log) => {
			acc[log.level] = (acc[log.level] || 0) + 1;
			return acc;
		}, {} as Record<LogLevel, number>);

		const decisionsByType = this.decisions.reduce((acc, d) => {
			acc[d.type] = (acc[d.type] || 0) + 1;
			return acc;
		}, {} as Record<DecisionType, number>);

		return {
			totalLogs: this.logs.length,
			logsByLevel,
			totalDecisions: this.decisions.length,
			decisionsByType,
			totalTraces,
			completedTraces,
			failedTraces,
			activeTraces: Array.from(this.traces.values()).filter(t => t.status === 'running').length,
		};
	}

	/**
	 * Limpar logs antigos
	 */
	clearOldLogs(olderThanMs: number) {
		const cutoff = Date.now() - olderThanMs;
		this.logs = this.logs.filter(log => log.timestamp > cutoff);
		this.decisions = this.decisions.filter(d => d.timestamp > cutoff);
	}

	/**
	 * Limpar tudo
	 */
	clear() {
		this.logs = [];
		this.decisions = [];
		this.traces.clear();
		this.currentTrace = null;
	}
}

/**
 * Instância global
 */
let globalTransparencySystem: TransparencySystem | null = null;

export function getTransparencySystem(): TransparencySystem {
	if (!globalTransparencySystem) {
		globalTransparencySystem = new TransparencySystem();
	}
	return globalTransparencySystem;
}

export function resetTransparencySystem() {
	globalTransparencySystem = null;
}
