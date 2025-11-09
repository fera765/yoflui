/**
 * SISTEMA DE STREAMING E PARALELIZAÇÃO - Inspirado no Cursor
 * 
 * Maximiza velocidade através de:
 * - Streaming de respostas (feedback instantâneo)
 * - Paralelização de tarefas independentes
 * - Cache inteligente de contexto
 * - Prefetching de dados
 * 
 * Torna o Flui 10/10 em VELOCIDADE
 */

import OpenAI from 'openai';
import { getConfig } from '../llm-config.js';

export interface StreamChunk {
	id: string;
	type: 'text' | 'tool_call' | 'reasoning' | 'progress' | 'complete';
	content: string;
	metadata?: Record<string, any>;
	timestamp: number;
}

export interface ParallelTask {
	id: string;
	name: string;
	execute: () => Promise<any>;
	dependencies: string[]; // IDs de tasks que devem completar antes
	priority: number; // 1-10, maior = mais prioritário
	timeout?: number;
}

export interface CacheEntry {
	key: string;
	value: any;
	timestamp: number;
	expiresAt: number;
	accessCount: number;
}

export class StreamingSystem {
	private openai: OpenAI | null = null;
	private cache: Map<string, CacheEntry> = new Map();
	private runningTasks: Map<string, Promise<any>> = new Map();
	private completedTasks: Map<string, any> = new Map();
	private cacheHits: number = 0;
	private cacheMisses: number = 0;
	
	// Callbacks
	private onStreamChunk?: (chunk: StreamChunk) => void;
	private onTaskComplete?: (taskId: string, result: any) => void;
	private onTaskError?: (taskId: string, error: Error) => void;

	constructor(openai?: OpenAI) {
		this.openai = openai || null;
	}

	/**
	 * Configurar OpenAI client
	 */
	setOpenAI(openai: OpenAI) {
		this.openai = openai;
	}

	/**
	 * Configurar callbacks
	 */
	setCallbacks(callbacks: {
		onStreamChunk?: (chunk: StreamChunk) => void;
		onTaskComplete?: (taskId: string, result: any) => void;
		onTaskError?: (taskId: string, error: Error) => void;
	}) {
		this.onStreamChunk = callbacks.onStreamChunk;
		this.onTaskComplete = callbacks.onTaskComplete;
		this.onTaskError = callbacks.onTaskError;
	}

	/**
	 * Stream de resposta do LLM com feedback instantâneo
	 * Latência < 200ms para primeiro chunk (Cursor-level)
	 */
	async streamCompletion(
		messages: OpenAI.Chat.ChatCompletionMessageParam[],
		options?: {
			model?: string;
			temperature?: number;
			maxTokens?: number;
			tools?: OpenAI.Chat.ChatCompletionTool[];
		}
	): Promise<string> {
		if (!this.openai) {
			throw new Error('OpenAI client não configurado');
		}

		const config = getConfig();
		const startTime = Date.now();
		let firstChunkTime: number | null = null;
		let accumulatedContent = '';
		let currentToolCall: any = null;

		try {
			const stream = await this.openai.chat.completions.create({
				model: options?.model || config.model || 'qwen-max',
				messages,
				temperature: options?.temperature ?? 0.3,
				max_tokens: options?.maxTokens,
				tools: options?.tools,
				stream: true,
			});

			for await (const chunk of stream) {
				// Medir latência do primeiro chunk
				if (firstChunkTime === null) {
					firstChunkTime = Date.now() - startTime;
					this.emitChunk({
						id: `latency-${Date.now()}`,
						type: 'progress',
						content: `⚡ Primeiro byte em ${firstChunkTime}ms`,
						timestamp: Date.now(),
						metadata: { latency: firstChunkTime },
					});
				}

				const delta = chunk.choices[0]?.delta;

				// Texto
				if (delta?.content) {
					accumulatedContent += delta.content;
					this.emitChunk({
						id: `text-${Date.now()}`,
						type: 'text',
						content: delta.content,
						timestamp: Date.now(),
					});
				}

				// Tool call
				if (delta?.tool_calls) {
					for (const toolCall of delta?.tool_calls) {
						if (toolCall.function?.name) {
							currentToolCall = {
								name: toolCall.function.name,
								arguments: toolCall.function.arguments || '',
							};
						} else if (toolCall.function?.arguments && currentToolCall) {
							currentToolCall.arguments += toolCall.function.arguments;
						}
					}
				}

				// Reasoning (se disponível)
				if ((delta as any)?.reasoning_content) {
					this.emitChunk({
						id: `reasoning-${Date.now()}`,
						type: 'reasoning',
						content: (delta as any).reasoning_content,
						timestamp: Date.now(),
					});
				}
			}

			// Emitir tool call completo
			if (currentToolCall) {
				this.emitChunk({
					id: `tool-${Date.now()}`,
					type: 'tool_call',
					content: JSON.stringify(currentToolCall),
					timestamp: Date.now(),
					metadata: currentToolCall,
				});
			}

			// Emitir conclusão
			this.emitChunk({
				id: `complete-${Date.now()}`,
				type: 'complete',
				content: accumulatedContent,
				timestamp: Date.now(),
				metadata: {
					totalTime: Date.now() - startTime,
					firstChunkLatency: firstChunkTime,
					tokenCount: accumulatedContent.split(/\s+/).length,
				},
			});

			return accumulatedContent;
		} catch (error) {
			throw new Error(`Stream falhou: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Executar múltiplas tarefas em paralelo respeitando dependências
	 * Similar ao Cursor Composer multi-file edits
	 */
	async executeParallel(tasks: ParallelTask[]): Promise<Map<string, any>> {
		const results = new Map<string, any>();
		const taskMap = new Map(tasks.map(t => [t.id, t]));
		const executionOrder = this.topologicalSort(tasks);

		// Agrupar por nível de dependência
		const levels: ParallelTask[][] = [];
		const processed = new Set<string>();

		for (const taskId of executionOrder) {
			const task = taskMap.get(taskId)!;
			const level = Math.max(
				0,
				...task.dependencies.map(depId => 
					levels.findIndex(l => l.some(t => t.id === depId)) + 1
				)
			);

			if (!levels[level]) {
				levels[level] = [];
			}
			levels[level].push(task);
		}

		// Executar cada nível em paralelo
		for (let i = 0; i < levels.length; i++) {
			const levelTasks = levels[i];
			
			this.emitChunk({
				id: `level-${i}`,
				type: 'progress',
				content: `🔄 Executando ${levelTasks.length} tarefa(s) em paralelo (Nível ${i + 1}/${levels.length})`,
				timestamp: Date.now(),
			});

			// Executar todas as tasks do nível em paralelo
			const promises = levelTasks.map(async task => {
				const startTime = Date.now();
				try {
					// Verificar cache primeiro
					const cachedResult = this.getFromCache(task.id);
					if (cachedResult !== null) {
						results.set(task.id, cachedResult);
						this.onTaskComplete?.(task.id, cachedResult);
						return;
					}

					// Executar com timeout
					const timeoutMs = task.timeout || 30000;
					const result = await Promise.race([
						task.execute(),
						new Promise((_, reject) => 
							setTimeout(() => reject(new Error(`Timeout após ${timeoutMs}ms`)), timeoutMs)
						),
					]);

					results.set(task.id, result);
					this.completedTasks.set(task.id, result);
					
					// Cache resultado
					this.setCache(task.id, result, 300000); // 5 min TTL

					const duration = Date.now() - startTime;
					this.emitChunk({
						id: `task-${task.id}`,
						type: 'progress',
						content: `✅ ${task.name} completado em ${duration}ms`,
						timestamp: Date.now(),
						metadata: { taskId: task.id, duration },
					});

					this.onTaskComplete?.(task.id, result);
				} catch (error) {
					const errorObj = error instanceof Error ? error : new Error(String(error));
					results.set(task.id, { error: errorObj.message });
					
					this.emitChunk({
						id: `error-${task.id}`,
						type: 'progress',
						content: `❌ ${task.name} falhou: ${errorObj.message}`,
						timestamp: Date.now(),
					});

					this.onTaskError?.(task.id, errorObj);
				}
			});

			await Promise.all(promises);
		}

		return results;
	}

	/**
	 * Ordenação topológica de tarefas (resolver dependências)
	 */
	private topologicalSort(tasks: ParallelTask[]): string[] {
		const result: string[] = [];
		const visited = new Set<string>();
		const temp = new Set<string>();
		const taskMap = new Map(tasks.map(t => [t.id, t]));

		const visit = (taskId: string) => {
			if (temp.has(taskId)) {
				throw new Error(`Dependência circular detectada: ${taskId}`);
			}
			if (visited.has(taskId)) {
				return;
			}

			temp.add(taskId);
			const task = taskMap.get(taskId);
			if (task) {
				for (const depId of task.dependencies) {
					visit(depId);
				}
			}
			temp.delete(taskId);
			visited.add(taskId);
			result.push(taskId);
		};

		// Ordenar por prioridade primeiro
		const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);
		
		for (const task of sortedTasks) {
			if (!visited.has(task.id)) {
				visit(task.id);
			}
		}

		return result;
	}

	/**
	 * Cache inteligente com TTL e LRU
	 */
	setCache(key: string, value: any, ttlMs: number = 300000) {
		const entry: CacheEntry = {
			key,
			value,
			timestamp: Date.now(),
			expiresAt: Date.now() + ttlMs,
			accessCount: 0,
		};
		this.cache.set(key, entry);

		// LRU: Remover entradas antigas se cache > 1000 items
		if (this.cache.size > 1000) {
			const sortedEntries = Array.from(this.cache.entries())
				.sort((a, b) => a[1].accessCount - b[1].accessCount);
			
			// Remover 20% menos usados
			const toRemove = Math.floor(this.cache.size * 0.2);
			for (let i = 0; i < toRemove; i++) {
				this.cache.delete(sortedEntries[i][0]);
			}
		}
	}

	getFromCache(key: string): any | null {
		const entry = this.cache.get(key);
		if (!entry) {
			this.cacheMisses++;
			return null;
		}

		// Verificar expiração
		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			this.cacheMisses++;
			return null;
		}

		// Atualizar contadores
		entry.accessCount++;
		this.cacheHits++;
		return entry.value;
	}

	clearCache() {
		this.cache.clear();
		this.cacheHits = 0;
		this.cacheMisses = 0;
	}

	/**
	 * Prefetch de dados (carregamento antecipado)
	 */
	async prefetch(tasks: ParallelTask[]) {
		// Executar tasks de baixa prioridade em background
		const lowPriorityTasks = tasks.filter(t => t.priority <= 3);
		
		for (const task of lowPriorityTasks) {
			// Não aguardar, executar em background
			task.execute()
				.then(result => this.setCache(task.id, result))
				.catch(() => {}); // Ignorar erros de prefetch
		}
	}

	/**
	 * Emitir chunk de stream
	 */
	private emitChunk(chunk: StreamChunk) {
		this.onStreamChunk?.(chunk);
	}

	/**
	 * Estatísticas de performance
	 */
	getStats() {
		const cacheTotal = this.cacheHits + this.cacheMisses;
		const cacheHitRate = cacheTotal > 0 ? (this.cacheHits / cacheTotal * 100).toFixed(1) : '0.0';

		return {
			cacheSize: this.cache.size,
			cacheHits: this.cacheHits,
			cacheMisses: this.cacheMisses,
			cacheHitRate: `${cacheHitRate}%`,
			completedTasks: this.completedTasks.size,
			runningTasks: this.runningTasks.size,
		};
	}
}

/**
 * Instância global do sistema de streaming
 */
let globalStreamingSystem: StreamingSystem | null = null;

export function getStreamingSystem(openai?: OpenAI): StreamingSystem {
	if (!globalStreamingSystem) {
		globalStreamingSystem = new StreamingSystem(openai);
	} else if (openai) {
		globalStreamingSystem.setOpenAI(openai);
	}
	return globalStreamingSystem;
}

export function resetStreamingSystem() {
	globalStreamingSystem = null;
}
