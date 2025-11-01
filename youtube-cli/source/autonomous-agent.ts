import OpenAI from 'openai';
import { mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getConfig } from './llm-config.js';
import { loadQwenCredentials, getValidAccessToken } from './qwen-oauth.js';
import { ALL_TOOL_DEFINITIONS, executeToolCall, loadKanban, type KanbanTask, loadMemories } from './tools/index.js';
import { saveConversationHistory, loadConversationHistory, type MemoryEntry } from './tools/memory.js';
import { loadOrCreateContext, saveContext, generateContextPrompt, addToConversation } from './context-manager.js';

interface AgentOptions {
	userMessage: string;
	workDir: string;
	onProgress?: (message: string) => void;
	onKanbanUpdate?: (tasks: KanbanTask[]) => void;
	onToolExecute?: (toolName: string, args: any) => void;
	onToolComplete?: (toolName: string, args: any, result: string, error?: boolean) => void;
}

export async function runAutonomousAgent(options: AgentOptions): Promise<string> {
	const { userMessage, workDir, onProgress, onKanbanUpdate, onToolExecute, onToolComplete } = options;

	// Create work directory
	mkdirSync(workDir, { recursive: true });

	// Load or create context (silently scans folder structure)
	const cwd = process.cwd();
	const context = loadOrCreateContext(userMessage, cwd);
	const contextPrompt = generateContextPrompt(context);
	
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

	const systemPrompt = `You are an AUTONOMOUS AI AGENT that helps users complete tasks efficiently.

${contextPrompt}
${memoryContext}

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
- web_fetch: Fetch URLs
- search_youtube_comments: Search YouTube videos and extract comments
- save_memory: Save important context/learnings for future reference

TASK CLASSIFICATION:
- **Simple task (1-2 steps)**: Just execute the tool(s) and respond. NO Kanban needed.
  Example: "Read file X" ? Use read_file and respond
  Example: "Create hello.txt" ? Use write_file and respond

- **Complex task (3+ steps)**: Create Kanban, execute tasks, update Kanban as you progress.
  Example: "Create 3 files with tests" ? Use update_kanban first, then execute
  Example: "Build a web app" ? Use update_kanban to track multiple steps

WORKFLOW:
1. Analyze if task requires multiple steps (3+)
2. If YES: Create Kanban ? Execute tools ? Update Kanban ? Respond
3. If NO: Execute tool(s) directly ? Respond (no Kanban)

IMPORTANT: 
- Use Kanban ONLY for genuinely complex tasks
- Always ACTUALLY execute the tools to complete tasks
- Provide clear, concise responses about what was done`;

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

		const response = await openai.chat.completions.create({
			model: config.model,
			messages,
			tools: ALL_TOOL_DEFINITIONS,
			tool_choice: 'auto',
		});

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
			// Save conversation to context
			addToConversation('user', userMessage, cwd);
			addToConversation('assistant', assistantMsg.content, cwd);
			
			return assistantMsg.content;
		}

		break;
	}

	return 'Task completed';
}
