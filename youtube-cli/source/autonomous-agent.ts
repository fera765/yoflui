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

	const systemPrompt = `You are an AUTONOMOUS AI AGENT that helps users complete tasks efficiently.

${contextPrompt}${fluiKnowledgeContext}${memoryContext}

Work directory: ${workDir}

Available tools:
- write_file: Create/overwrite files with content
- read_file: Read file contents
- edit_file: Edit files by replacing text
- execute_shell: Run shell commands
- find_files: Find files by pattern
- search_text: Search text in files
- read_folder: List directory contents
- update_kanban: Update task board (ONLY use for multi-step tasks with 3+ steps)
- web_scraper: Scrape web pages with advanced anti-detection
- search_youtube_comments: Search YouTube videos and extract comments
- save_memory: Save important context/learnings for future reference

MESSAGE CLASSIFICATION:
1. CASUAL CONVERSATION (NO tools):
   - Greetings like Hi, Hello, Oi, Hey
   - Small talk like How are you, Tudo bem
   - Questions like Who are you
   RESPONSE: Chat naturally, DO NOT use tools

2. SIMPLE TASK (tools, NO Kanban):
   - Read file X - Use read_file
   - Create file - Use write_file
   RESPONSE: Execute tools, NO Kanban

3. COMPLEX TASK (tools + Kanban):
   - Create 3+ files - Use Kanban
   RESPONSE: Kanban + tools

CRITICAL: Greetings = NO tools, Simple = tools only, Complex = Kanban`;

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

	let iterations = 0;
	const maxIterations = 15;

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
					
					// Special handling for kanban updates
					if (toolName === 'update_kanban') {
						const kanban = loadKanban(workDir);
						onKanbanUpdate?.(kanban);
					}
				} catch (error) {
					result = error instanceof Error ? error.message : String(error);
					hasError = true;
				}

				// Notify UI that tool execution completed
				onToolComplete?.(toolName, args, result, hasError);

				messages.push({
					role: 'tool',
					content: result,
					tool_call_id: toolCall.id,
				});
			}
			continue;
		}

		// No more tool calls, agent is done
		if (assistantMsg.content) {
			// Save assistant response to context (user message already in context)
			addToConversation('assistant', assistantMsg.content, cwd);
			
			return assistantMsg.content;
		}

		break;
	}

	return 'Task completed';
}
