import OpenAI from 'openai';
import { mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getConfig } from './llm-config.js';
import { loadQwenCredentials, getValidAccessToken } from './qwen-oauth.js';
import { ALL_TOOL_DEFINITIONS, executeToolCall, loadKanban, type KanbanTask } from './tools/index.js';

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

	onProgress?.('?? Analyzing task and creating Kanban...');

	const config = getConfig();
	const qwenCreds = loadQwenCredentials();
	let endpoint = config.endpoint;
	let apiKey = config.apiKey || 'not-needed';

	if (qwenCreds?.access_token) {
		const validToken = await getValidAccessToken();
		if (validToken) {
			apiKey = validToken;
			endpoint = qwenCreds.resource_url?.startsWith('http')
				? `${qwenCreds.resource_url}/v1`
				: `https://${qwenCreds.resource_url}/v1`;
		}
	}

	const openai = new OpenAI({ baseURL: endpoint, apiKey });

	// Check if .flui.md exists and load it
	let fluiContext = '';
	const fluiPath = join(process.cwd(), '.flui.md');
	if (existsSync(fluiPath)) {
		try {
			fluiContext = readFileSync(fluiPath, 'utf-8');
			onProgress?.('?? Loaded .flui.md context');
		} catch (error) {
			// Ignore errors loading .flui.md
		}
	}

	const systemPrompt = `You are an AUTONOMOUS AI AGENT that MUST complete ALL tasks given to you.
${fluiContext ? `\n## PROJECT CONTEXT FROM .flui.md:\n${fluiContext}\n` : ''}

CRITICAL RULES:
1. First, analyze the task and create a Kanban board using update_kanban with ALL subtasks
2. Execute EVERY task one by one using the available tools
3. After EACH task completion, update the Kanban board (change task status to 'done')
4. You MUST actually USE the tools to complete tasks - don't just plan, EXECUTE!
5. When ALL tasks are done, provide a comprehensive final summary

Work directory: ${workDir}

Available tools:
- write_file: Create/overwrite files with content
- read_file: Read file contents
- edit_file: Edit files by replacing text
- execute_shell: Run shell commands
- find_files: Find files by pattern
- search_text: Search text in files
- read_folder: List directory contents
- update_kanban: Update task board
- web_fetch: Fetch URLs

IMPORTANT: You must ACTUALLY complete all tasks using the tools. Don't just update the kanban without doing the work!

Example workflow:
1. User: "Create hello.js and test.js"
2. You: update_kanban with tasks ["Create hello.js", "Create test.js"]
3. You: write_file to create hello.js with actual code
4. You: update_kanban marking "Create hello.js" as done
5. You: write_file to create test.js with actual test code
6. You: update_kanban marking "Create test.js" as done
7. You: Return summary of what was created

BE AUTONOMOUS. COMPLETE ALL TASKS. USE THE TOOLS.`;

	let messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userMessage },
	];

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
			return assistantMsg.content;
		}

		break;
	}

	return 'Task completed';
}
