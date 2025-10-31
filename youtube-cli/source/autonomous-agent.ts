import OpenAI from 'openai';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { getConfig } from './llm-config.js';
import { loadQwenCredentials, getValidAccessToken } from './qwen-oauth.js';
import { ALL_TOOL_DEFINITIONS, executeToolCall, loadKanban, type KanbanTask } from './tools/index.js';

interface AgentOptions {
	userMessage: string;
	workDir: string;
	onProgress?: (message: string) => void;
}

export async function runAutonomousAgent(options: AgentOptions): Promise<string> {
	const { userMessage, workDir, onProgress } = options;

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

	const systemPrompt = `You are an autonomous AI agent. When given a task:
1. Break it down into subtasks and create a Kanban board using update_kanban
2. Execute tasks one by one using available tools
3. Update Kanban as you progress
4. When all tasks are done, provide a final summary

Work directory: ${workDir}

Available tools: edit_file, read_file, write_file, execute_shell, find_files, search_text, read_folder, update_kanban, web_fetch

Be autonomous and efficient.`;

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

				onProgress?.(`?? Executing: ${toolName}`);

				const result = await executeToolCall(toolName, args, workDir);

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
