import OpenAI from 'openai';
import { mkdirSync, existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { getConfig } from './llm-config.js';
import { loadQwenCredentials, getValidAccessToken } from './qwen-oauth.js';
import { getAllToolDefinitions, executeToolCall, loadKanban, type KanbanTask, loadMemories } from './tools/index.js';
import { saveConversationHistory, loadConversationHistory, type MemoryEntry } from './tools/memory.js';
import { loadOrCreateContext, saveContext, generateContextPrompt, addToConversation } from './context-manager.js';
import { withTimeout, TIMEOUT_CONFIG } from './config/timeout-config.js';
import { getSystemPrompt } from './prompts/prompt-loader.js';
import { responseOptimizer } from './utils/response-optimizer.js';
import { detectLargeTask } from './agi/task-decomposer.js';
import { validateTaskCompletion, formatValidationReport, extractRequirements } from './agi/task-validator.js';

interface AgentOptions {
	userMessage: string;
	workDir: string;
	onProgress?: (message: string) => void;
	onKanbanUpdate?: (tasks: KanbanTask[]) => void;
	onToolExecute?: (toolName: string, args: any) => void;
	onToolComplete?: (toolName: string, args: any, result: string, error?: boolean) => void;
}

/**
 * Load flui.md file (case-insensitive) from current working directory
 * Returns content if found, empty string otherwise
 */
function loadFluiKnowledge(cwd: string = process.cwd()): string {
	try {
		// List all files in directory
		const files = readdirSync(cwd);
		
		// Find flui.md files (case-insensitive)
		const fluiFile = files.find(file => {
			const lowerFile = file.toLowerCase();
			return lowerFile === 'flui.md';
		});
		
		if (!fluiFile) {
			return '';
		}
		
		const fluiPath = join(cwd, fluiFile);
		if (existsSync(fluiPath)) {
			const content = readFileSync(fluiPath, 'utf-8');
			return content.trim();
		}
		
		return '';
	} catch (error) {
		// Silent fail - if directory doesn't exist or can't read, just return empty
		return '';
	}
}

export async function runAutonomousAgent(options: AgentOptions): Promise<string> {
	const { userMessage, workDir, onProgress, onKanbanUpdate, onToolExecute, onToolComplete } = options;

	// Create work directory
	mkdirSync(workDir, { recursive: true });

	// Load or create context (silently scans folder structure)
	const cwd = process.cwd();
	const context = loadOrCreateContext(userMessage, cwd);
	const contextPrompt = generateContextPrompt(context);
	
	// Load flui.md knowledge base and notify if found
	const fluiKnowledge = loadFluiKnowledge(cwd);
	if (fluiKnowledge && onProgress) {
		onProgress('[+] Loaded flui.md context');
	}
	
	// Save user message to conversation history BEFORE processing
	addToConversation('user', userMessage, cwd);
	
	// Save context immediately
	saveContext(context, cwd);

	const config = getConfig();
	const qwenCreds = loadQwenCredentials();
	let endpoint = config.endpoint;
	let apiKey = config.apiKey || 'not-needed';

	// Use Qwen OAuth if available
	if (qwenCreds?.access_token) {
		const validToken = await getValidAccessToken();
		if (validToken) {
			apiKey = validToken;
			// Use the resource_url from OAuth response
			const resourceUrl = qwenCreds.resource_url || 'portal.qwen.ai';
			endpoint = `https://${resourceUrl}/v1`;
		}
	}

	const openai = new OpenAI({ baseURL: endpoint, apiKey });

	// Load saved memories
	const savedMemories = loadMemories(workDir);
	const memoryContext = savedMemories.length > 0 
		? `\n## SAVED MEMORIES:\n${savedMemories.map(m => `- [${m.category}] ${m.content}`).join('\n')}\n`
		: '';

	// Build flui.md knowledge context (already loaded above)
	const fluiKnowledgeContext = fluiKnowledge 
		? `\n## FLUI KNOWLEDGE BASE:\n${fluiKnowledge}\n`
		: '';

	const systemPrompt = getSystemPrompt('autonomous_agent', {
		context_prompt: contextPrompt,
		flui_knowledge_context: fluiKnowledgeContext,
		memory_context: memoryContext,
		work_dir: workDir,
	});

	// Build messages with context history
	let messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
		{ role: 'system', content: systemPrompt },
	];

	// Add recent conversation from context (last 5 messages)
	const recentHistory = context.conversationHistory.slice(-5);
	for (const entry of recentHistory) {
		messages.push({
			role: entry.role,
			content: entry.content,
		});
	}

	// Add current user message
	messages.push({ role: 'user', content: userMessage });

	// NOVO: Detectar tarefas complexas e ajustar max iterations
	const isComplexTask = detectLargeTask(userMessage);
	const requirements = extractRequirements(userMessage);
	
	console.log(`[DEBUG] isComplexTask: ${isComplexTask}, requirements: ${requirements.length}`);
	
	// Aumentar limite de iterações para tarefas complexas
	const maxIterations = isComplexTask || requirements.length > 5 ? 30 : 15;
	
	if (isComplexTask) {
		console.log('[INFO] Tarefa complexa detectada - aumentando limite para 30 iterações');
	}

	let iterations = 0;

	while (iterations < maxIterations) {
		iterations++;

		// Apply timeout to LLM calls
		const response = await withTimeout(
			openai.chat.completions.create({
				model: config.model,
				messages,
				tools: getAllToolDefinitions(),
				tool_choice: 'auto',
			}),
			TIMEOUT_CONFIG.LLM_COMPLETION,
			'Autonomous agent LLM call'
		);

		const assistantMsg = response.choices[0]?.message;

		if (!assistantMsg) break;

		messages.push({
			role: 'assistant',
			content: assistantMsg.content || '',
			tool_calls: assistantMsg.tool_calls,
		});

		// Check if tools were called
		if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
			for (const toolCall of assistantMsg.tool_calls) {
				const func = (toolCall as any).function;
				const toolName = func.name;
				const args = JSON.parse(func.arguments);

				// Notify UI that tool execution started
				onToolExecute?.(toolName, args);

				let result: string;
				let hasError = false;

				try {
					result = await executeToolCall(toolName, args, workDir);
					
					// Register tool execution for response optimization
					responseOptimizer.registerToolExecution(toolName, result);
					
					// Special handling for kanban updates
					if (toolName === 'update_kanban') {
						const kanban = loadKanban(workDir);
						onKanbanUpdate?.(kanban);
					}
				} catch (error) {
					result = `Error: ${error instanceof Error ? error.message : String(error)}`;
					hasError = true;
				}

				// Notify UI that tool execution completed (with error flag)
				onToolComplete?.(toolName, args, result, hasError);

				// Add result to conversation (continue flow even on error)
				messages.push({
					role: 'tool',
					content: result,
					tool_call_id: toolCall.id,
				});
			}
			// Continue loop even if tool failed - LLM can handle errors
			continue;
		}

		// No more tool calls, agent is done
		if (assistantMsg.content) {
			// Optimize response for token economy
			let optimizedResponse = responseOptimizer.optimizeResponse(
				assistantMsg.content,
				userMessage
			);
			
			// NOVO: Validar se todos os requisitos foram cumpridos ANTES de retornar
			if (requirements.length > 0) {
				const executedSteps = context.conversationHistory
					.filter(msg => msg.role === 'assistant')
					.map((msg, idx) => ({
						id: `step-${idx}`,
						tool: 'unknown',
						result: msg.content
					}));
				
				const validation = validateTaskCompletion(userMessage, executedSteps, optimizedResponse);
				
				console.log(`\n[VALIDAÇÃO] Taxa de conclusão: ${validation.completionRate.toFixed(0)}%`);
				
				if (!validation.complete && validation.completionRate < 80) {
					console.log('⚠️  Tarefa incompleta! Requisitos pendentes:');
					console.log(formatValidationReport(validation));
					
					// Se tem requisitos críticos faltando, adicionar ao response
					const criticalMissing = validation.missingRequirements.filter(r => r.priority === 'critical');
					if (criticalMissing.length > 0) {
						optimizedResponse += '\n\n⚠️ ATENÇÃO: Requisitos críticos pendentes:\n';
						criticalMissing.forEach(req => {
							optimizedResponse += `- ${req.description}\n`;
						});
					}
				} else {
					console.log('✅ Tarefa validada com sucesso!');
				}
			}
			
			// Save optimized response to context (user message already in context)
			addToConversation('assistant', optimizedResponse, cwd);
			
			return optimizedResponse;
		}

		break;
	}

	return 'Task completed';
}
