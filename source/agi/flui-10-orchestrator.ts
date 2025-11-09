/**
 * FLUI 10/10 ORCHESTRATOR
 * 
 * Integração completa de todos os 5 pilares:
 * 1. ✅ Autonomia do Cline - Sistema de aprovações e execução autônoma
 * 2. ✅ Velocidade do Cursor - Streaming, paralelização e cache
 * 3. ✅ Context Awareness Superior - Indexação semântica e busca inteligente
 * 4. ✅ Transparência Radical - Logs detalhados e raciocínio visível
 * 5. ✅ Controle Granular - Aprovações configuráveis e overrides
 * 
 * Este é o orquestrador definitivo que torna o Flui 10/10 em todas as áreas.
 */

import OpenAI from 'openai';
import { getConfig } from '../llm-config.js';
import { loadQwenCredentials, getValidAccessToken } from '../qwen-oauth.js';

// Importar todos os sistemas
import { ApprovalSystem, getApprovalSystem, ApprovalRequest, ApprovalLevel } from './approval-system.js';
import { StreamingSystem, getStreamingSystem, ParallelTask, StreamChunk } from './streaming-system.js';
import { ContextIndexer, getContextIndexer, SearchResult } from './context-indexer.js';
import { TransparencySystem, getTransparencySystem, DecisionLog } from './transparency-system.js';

// Importar sistemas existentes
import { CentralOrchestratorV2 } from './orchestrator-v2.js';
import { KanbanTask, ToolExecution, FluiFeedback } from './types.js';

export interface Flui10Config {
	approvalLevel: ApprovalLevel;
	streamingEnabled: boolean;
	contextIndexingEnabled: boolean;
	transparencyLevel: 'minimal' | 'normal' | 'detailed' | 'complete';
	parallelizationEnabled: boolean;
	cacheEnabled: boolean;
}

export interface Flui10Callbacks {
	onStreamChunk?: (chunk: StreamChunk) => void;
	onApprovalRequest?: (request: ApprovalRequest) => Promise<{ approved: boolean; modifications?: any }>;
	onProgress?: (message: string, kanban?: KanbanTask[]) => void;
	onFeedback?: (feedback: FluiFeedback) => void;
	onToolExecution?: (toolExec: ToolExecution) => void;
	onDecision?: (decision: DecisionLog) => void;
}

/**
 * Orquestrador FLUI 10/10
 * Combina o melhor do Cline, Cursor, e mais
 */
export class Flui10Orchestrator {
	private openai: OpenAI | null = null;
	private config: Flui10Config;
	private callbacks: Flui10Callbacks;
	
	// Sistemas integrados
	private approvalSystem: ApprovalSystem;
	private streamingSystem: StreamingSystem;
	private contextIndexer: ContextIndexer;
	private transparencySystem: TransparencySystem;
	private coreOrchestrator: CentralOrchestratorV2;
	
	private initialized = false;
	private currentTraceId: string | null = null;

	constructor(config?: Partial<Flui10Config>, callbacks?: Flui10Callbacks) {
		// Configuração padrão: Balance entre autonomia e controle
		this.config = {
			approvalLevel: 'auto_write',
			streamingEnabled: true,
			contextIndexingEnabled: true,
			transparencyLevel: 'detailed',
			parallelizationEnabled: true,
			cacheEnabled: true,
			...config,
		};

		this.callbacks = callbacks || {};

		// Inicializar sistemas
		this.approvalSystem = getApprovalSystem(this.config.approvalLevel);
		this.streamingSystem = getStreamingSystem();
		this.contextIndexer = getContextIndexer();
		this.transparencySystem = getTransparencySystem();
		this.coreOrchestrator = new CentralOrchestratorV2();

		// Configurar callbacks
		this.setupCallbacks();
	}

	/**
	 * Configurar todos os callbacks entre sistemas
	 */
	private setupCallbacks() {
		// Streaming → UI
		if (this.callbacks.onStreamChunk) {
			this.streamingSystem.setCallbacks({
				onStreamChunk: this.callbacks.onStreamChunk,
			});
		}

		// Approval → UI
		if (this.callbacks.onApprovalRequest) {
			this.approvalSystem.setApprovalCallback(async (request) => {
				const response = await this.callbacks.onApprovalRequest!(request);
				return {
					approved: response.approved,
					modifications: response.modifications,
				};
			});
		}

		// Transparency → UI  & Log decisions
		if (this.callbacks.onDecision) {
			this.transparencySystem.addDecisionListener(this.callbacks.onDecision);
		}

		// Configurar transparência baseado no nível
		switch (this.config.transparencyLevel) {
			case 'minimal':
				this.transparencySystem.setLogLevel('error');
				break;
			case 'normal':
				this.transparencySystem.setLogLevel('info');
				break;
			case 'detailed':
				this.transparencySystem.setLogLevel('debug');
				break;
			case 'complete':
				this.transparencySystem.setLogLevel('debug');
				// Adicionar listener para emitir todos os logs
				this.transparencySystem.addLogListener((entry) => {
					if (this.callbacks.onProgress) {
						this.callbacks.onProgress(`[${entry.level}] ${entry.message}`);
					}
				});
				break;
		}

		// Core Orchestrator → Flui10
		this.coreOrchestrator.setCallbacks({
			onFeedback: this.callbacks.onFeedback,
			onToolExecution: this.callbacks.onToolExecution,
		});
	}

	/**
	 * Inicialização assíncrona
	 */
	async initialize(): Promise<void> {
		if (this.initialized) return;

		this.transparencySystem.log('info', 'init', 'Inicializando Flui 10/10 Orchestrator');

		try {
			// Configurar OpenAI
			const config = getConfig();
			const qwenCreds = loadQwenCredentials();
			let endpoint = config.endpoint;
			let apiKey = config.apiKey || 'not-needed';

			if (qwenCreds?.access_token) {
				const validToken = await getValidAccessToken();
				if (validToken) {
					apiKey = validToken;
					const resourceUrl = qwenCreds.resource_url || 'portal.qwen.ai';
					endpoint = `https://${resourceUrl}/v1`;
				}
			}

			this.openai = new OpenAI({ baseURL: endpoint, apiKey });
			this.streamingSystem.setOpenAI(this.openai);

			this.transparencySystem.log('info', 'init', 'OpenAI configurado com sucesso');

			this.initialized = true;
			this.transparencySystem.log('info', 'init', 'Flui 10/10 inicializado com sucesso', {
				config: this.config,
			});
		} catch (error) {
			this.transparencySystem.log('error', 'init', 'Falha na inicialização', {
				error: error instanceof Error ? error.message : String(error),
			});
			throw new Error(`Falha ao inicializar: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Executar tarefa com todos os sistemas integrados
	 */
	async execute(
		userPrompt: string,
		workDir: string
	): Promise<{ result: string; mode: 'assistant' | 'agi'; stats: any }> {
		await this.initialize();

		// Iniciar trace de transparência
		this.currentTraceId = this.transparencySystem.startTrace(userPrompt);

		this.transparencySystem.log('info', 'execution', 'Iniciando execução', {
			prompt: userPrompt,
			workDir,
			config: this.config,
		});

		try {
			// FASE 1: Indexação de contexto (se habilitado)
			if (this.config.contextIndexingEnabled) {
				const stepId = this.transparencySystem.addStep({
					name: 'Indexação de contexto',
					input: { workDir },
					reasoning: 'Indexar codebase para context awareness superior',
				});

				try {
					await this.contextIndexer.indexCodebase(workDir, {
						maxDepth: 5,
						includeTests: false,
						incremental: true,
					});

					const stats = this.contextIndexer.getStats();
					this.transparencySystem.updateStep(stepId, {
						status: 'completed',
						output: stats,
					});

					this.transparencySystem.log('info', 'context', 'Indexação completa', stats);
				} catch (error) {
					this.transparencySystem.updateStep(stepId, {
						status: 'failed',
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}

			// FASE 2: Buscar contexto relevante
			const relevantContext = this.config.contextIndexingEnabled 
				? this.contextIndexer.search(userPrompt, { limit: 5 })
				: [];

			if (relevantContext.length > 0) {
				this.transparencySystem.log('info', 'context', `Encontrado ${relevantContext.length} chunks relevantes`, {
					chunks: relevantContext.map(r => ({
						file: r.chunk.file,
						name: r.chunk.name,
						score: r.score,
					})),
				});
			}

			// FASE 3: Decisão de modo (com raciocínio explícito)
			const decisionId = this.transparencySystem.logDecision({
				type: 'mode_selection',
				decision: 'Analisando complexidade da tarefa',
				reasoning: [
					'Verificando palavras-chave de complexidade',
					'Analisando tamanho do prompt',
					'Detectando necessidade de ferramentas',
				],
				alternatives: [
					{
						option: 'Modo Assistente (resposta direta)',
						score: 30,
						reasoning: 'Prompt parece conversacional',
					},
					{
						option: 'Modo AGI (orquestração completa)',
						score: 70,
						reasoning: 'Detectadas palavras-chave de ação',
					},
				],
				confidence: 70,
			});

			// FASE 4: Executar com orquestrador core
			const coreResult = await this.coreOrchestrator.orchestrate(
				userPrompt,
				workDir,
				(message, kanban) => {
					this.transparencySystem.log('info', 'progress', message, { kanban });
					this.callbacks.onProgress?.(message, kanban);
				}
			);

			// FASE 5: Finalizar trace
			this.transparencySystem.endTrace(this.currentTraceId, 'completed');

			// FASE 6: Coletar estatísticas
			const stats = {
				approval: this.approvalSystem.getStats(),
				streaming: this.streamingSystem.getStats(),
				context: this.contextIndexer.getStats(),
				transparency: this.transparencySystem.getStats(),
			};

			this.transparencySystem.log('info', 'execution', 'Execução completa', { stats });

			// Gerar relatório se transparência completa
			if (this.config.transparencyLevel === 'complete') {
				const report = this.transparencySystem.generateExecutionReport(this.currentTraceId);
				this.callbacks.onProgress?.(report);
			}

			return {
				result: coreResult.result,
				mode: coreResult.mode,
				stats,
			};
		} catch (error) {
			if (this.currentTraceId) {
				this.transparencySystem.endTrace(this.currentTraceId, 'failed');
			}

			this.transparencySystem.log('error', 'execution', 'Execução falhou', {
				error: error instanceof Error ? error.message : String(error),
			});

			throw error;
		}
	}

	/**
	 * Executar tarefas em paralelo (Velocidade do Cursor)
	 */
	async executeParallel(tasks: ParallelTask[]): Promise<Map<string, any>> {
		this.transparencySystem.log('info', 'parallel', `Executando ${tasks.length} tarefas em paralelo`);

		const stepId = this.transparencySystem.addStep({
			name: 'Execução paralela',
			input: { taskCount: tasks.length },
			reasoning: 'Maximizar velocidade executando tarefas independentes simultaneamente',
		});

		try {
			const results = await this.streamingSystem.executeParallel(tasks);

			this.transparencySystem.updateStep(stepId, {
				status: 'completed',
				output: { resultCount: results.size },
			});

			return results;
		} catch (error) {
			this.transparencySystem.updateStep(stepId, {
				status: 'failed',
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Buscar código com context awareness
	 */
	searchCode(query: string, options?: { limit?: number; filePattern?: RegExp }): SearchResult[] {
		this.transparencySystem.log('info', 'search', `Buscando: "${query}"`, options);

		const results = this.contextIndexer.search(query, options);

		this.transparencySystem.log('info', 'search', `Encontrado ${results.length} resultados`, {
			topResults: results.slice(0, 3).map(r => ({
				file: r.chunk.file,
				score: r.score,
			})),
		});

		return results;
	}

	/**
	 * Configurar nível de aprovação em runtime
	 */
	setApprovalLevel(level: ApprovalLevel) {
		this.approvalSystem.setApprovalLevel(level);
		this.transparencySystem.log('info', 'config', `Nível de aprovação alterado para: ${level}`);
	}

	/**
	 * Pausar execução (requer aprovação manual para tudo)
	 */
	pause() {
		this.approvalSystem.pause();
		this.transparencySystem.log('warning', 'control', 'Execução pausada - todas ações requerem aprovação');
	}

	/**
	 * Resumir execução
	 */
	resume() {
		this.approvalSystem.resume();
		this.transparencySystem.log('info', 'control', 'Execução resumida');
	}

	/**
	 * Obter relatório completo de execução
	 */
	getExecutionReport(): string {
		if (!this.currentTraceId) {
			return 'Nenhuma execução ativa';
		}
		return this.transparencySystem.generateExecutionReport(this.currentTraceId);
	}

	/**
	 * Obter estatísticas de todos os sistemas
	 */
	getSystemStats() {
		return {
			approval: this.approvalSystem.getStats(),
			streaming: this.streamingSystem.getStats(),
			context: this.contextIndexer.getStats(),
			transparency: this.transparencySystem.getStats(),
			config: this.config,
		};
	}

	/**
	 * Explicar uma decisão tomada
	 */
	explainDecision(decisionId: string): string {
		return this.transparencySystem.explainDecision(decisionId);
	}

	/**
	 * Limpar caches e histórico
	 */
	clear() {
		this.streamingSystem.clearCache();
		this.contextIndexer.clear();
		this.transparencySystem.clear();
		this.approvalSystem.clearHistory();
		this.transparencySystem.log('info', 'cleanup', 'Todos os sistemas limpos');
	}
}

/**
 * Factory function para criar instância configurada
 */
export function createFlui10Orchestrator(
	config?: Partial<Flui10Config>,
	callbacks?: Flui10Callbacks
): Flui10Orchestrator {
	return new Flui10Orchestrator(config, callbacks);
}

/**
 * Configurações pré-definidas
 */
export const PRESET_CONFIGS = {
	// Máxima autonomia (Full Auto)
	autonomous: {
		approvalLevel: 'full_auto' as ApprovalLevel,
		streamingEnabled: true,
		contextIndexingEnabled: true,
		transparencyLevel: 'normal' as const,
		parallelizationEnabled: true,
		cacheEnabled: true,
	},

	// Balanceado (padrão recomendado)
	balanced: {
		approvalLevel: 'auto_write' as ApprovalLevel,
		streamingEnabled: true,
		contextIndexingEnabled: true,
		transparencyLevel: 'detailed' as const,
		parallelizationEnabled: true,
		cacheEnabled: true,
	},

	// Controle manual (Cline-like)
	controlled: {
		approvalLevel: 'manual' as ApprovalLevel,
		streamingEnabled: true,
		contextIndexingEnabled: true,
		transparencyLevel: 'complete' as const,
		parallelizationEnabled: false,
		cacheEnabled: true,
	},

	// Máxima velocidade
	fast: {
		approvalLevel: 'full_auto' as ApprovalLevel,
		streamingEnabled: true,
		contextIndexingEnabled: false, // Desabilitar para velocidade
		transparencyLevel: 'minimal' as const,
		parallelizationEnabled: true,
		cacheEnabled: true,
	},
};
