import OpenAI from 'openai';
import { executeToolCall, type KanbanTask } from './tools/index.js';
import { getConfig } from './llm-config.js';
import { loadQwenCredentials, getValidAccessToken } from './qwen-oauth.js';

export interface Agent {
	id: string;
	name: string;
	role: string;
	status: 'idle' | 'working' | 'delegating' | 'complete' | 'error';
	currentTask?: string;
	parentAgentId?: string;
	childAgents: string[];
	toolsUsed: string[];
	startTime: number;
	endTime?: number;
}

export interface AgentExecutionOptions {
	task: string;
	workDir: string;
	kanbanTask?: KanbanTask;
	parentAgentId?: string;
	onProgress?: (agent: Agent, message: string) => void;
	onToolExecute?: (agent: Agent, toolName: string, args: any) => void;
	onToolComplete?: (agent: Agent, toolName: string, result: string, error?: boolean) => void;
	onAgentDelegate?: (parentAgent: Agent, childAgent: Agent) => void;
	onAgentComplete?: (agent: Agent, result: string) => void;
}

export interface AgentExecutionResult {
	success: boolean;
	result: string;
	agent: Agent;
	childResults?: AgentExecutionResult[];
}

/**
 * Agent System - Can delegate tasks to other agents or use tools directly
 */
export class AgentSystem {
	private agents: Map<string, Agent> = new Map();
	private agentCounter = 0;

	/**
	 * Create a new agent
	 */
	createAgent(name: string, role: string, parentAgentId?: string): Agent {
		const agent: Agent = {
			id: `agent-${this.agentCounter++}`,
			name,
			role,
			status: 'idle',
			parentAgentId,
			childAgents: [],
			toolsUsed: [],
			startTime: Date.now(),
		};

		this.agents.set(agent.id, agent);

		// Add to parent's children if exists
		if (parentAgentId) {
			const parent = this.agents.get(parentAgentId);
			if (parent) {
				parent.childAgents.push(agent.id);
			}
		}

		return agent;
	}

	/**
	 * Execute agent with task
	 */
	async executeAgent(options: AgentExecutionOptions): Promise<AgentExecutionResult> {
		const agent = this.createAgent(
			`Agent-${this.agentCounter}`,
			options.kanbanTask?.title || 'Task Executor',
			options.parentAgentId
		);

		agent.status = 'working';
		agent.currentTask = options.task;

		options.onProgress?.(agent, `Agent ${agent.name} started task: ${options.task}`);

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

		const openai = new OpenAI({ baseURL: endpoint, apiKey });

		// Available tools for agent
		const tools: OpenAI.Chat.ChatCompletionTool[] = [
			{
				type: 'function',
				function: {
					name: 'delegate_to_agent',
					description: 'Delegate a subtask to a new specialized agent. Use when task can be broken down.',
					parameters: {
						type: 'object',
						properties: {
							subtask: {
								type: 'string',
								description: 'The specific subtask to delegate',
							},
							agent_role: {
								type: 'string',
								description: 'Role/specialty of the agent (e.g., "File Writer", "Code Analyzer")',
							},
						},
						required: ['subtask', 'agent_role'],
					},
				},
			},
			{
				type: 'function',
				function: {
					name: 'use_tool',
					description: 'Use a tool directly to accomplish part of the task',
					parameters: {
						type: 'object',
						properties: {
							tool_name: {
								type: 'string',
								description: 'Name of tool to use',
								enum: [
									'write_file',
									'read_file',
									'edit_file',
									'execute_shell',
									'find_files',
									'search_text',
									'read_folder',
									'web_scraper',
								],
							},
							tool_args: {
								type: 'object',
								description: 'Arguments for the tool',
							},
						},
						required: ['tool_name', 'tool_args'],
					},
				},
			},
		];

		const systemPrompt = `You are an autonomous agent named "${agent.name}" with role: ${agent.role}.

Your task: ${options.task}

You can:
1. Use tools directly (write_file, read_file, edit_file, execute_shell, find_files, search_text, read_folder, web_scraper)
2. Delegate subtasks to specialized child agents using delegate_to_agent

Working Directory: ${options.workDir}

Strategy:
- For simple, direct actions ? use tools
- For complex subtasks that need specialized handling ? delegate to child agents
- Break down complex tasks intelligently
- Complete tasks efficiently`;

		const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: options.task },
		];

		let iterations = 0;
		const maxIterations = 10;
		const childResults: AgentExecutionResult[] = [];

		try {
			while (iterations < maxIterations) {
				iterations++;

				const response = await openai.chat.completions.create({
					model: config.model,
					messages,
					tools,
					tool_choice: 'auto',
				});

				const assistantMsg = response.choices[0]?.message;
				if (!assistantMsg) break;

				messages.push({
					role: 'assistant',
					content: assistantMsg.content || '',
					tool_calls: assistantMsg.tool_calls,
				});

				// Handle tool calls
				if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
					for (const toolCall of assistantMsg.tool_calls) {
						const func = (toolCall as any).function;
						const funcName = func.name;
						const args = JSON.parse(func.arguments);

						if (funcName === 'delegate_to_agent') {
							// Delegate to child agent
							agent.status = 'delegating';
							options.onProgress?.(agent, `Delegating to specialized agent: ${args.agent_role}`);

							const childOptions: AgentExecutionOptions = {
								task: args.subtask,
								workDir: options.workDir,
								parentAgentId: agent.id,
								onProgress: options.onProgress,
								onToolExecute: options.onToolExecute,
								onToolComplete: options.onToolComplete,
								onAgentDelegate: options.onAgentDelegate,
								onAgentComplete: options.onAgentComplete,
							};

							const childResult = await this.executeAgent(childOptions);
							childResults.push(childResult);

							options.onAgentDelegate?.(agent, childResult.agent);

							messages.push({
								role: 'tool',
								content: `Child agent completed: ${childResult.result}`,
								tool_call_id: toolCall.id,
							});

							agent.status = 'working';
						} else if (funcName === 'use_tool') {
							// Use tool directly
							const toolName = args.tool_name;
							const toolArgs = args.tool_args;

							agent.toolsUsed.push(toolName);
							options.onToolExecute?.(agent, toolName, toolArgs);

							let result: string;
							let hasError = false;

							try {
								result = await executeToolCall(toolName, toolArgs, options.workDir);
							} catch (error) {
								result = error instanceof Error ? error.message : String(error);
								hasError = true;
							}

							options.onToolComplete?.(agent, toolName, result, hasError);

							messages.push({
								role: 'tool',
								content: result,
								tool_call_id: toolCall.id,
							});
						}
					}
					continue;
				}

				// Agent is done
				if (assistantMsg.content) {
					agent.status = 'complete';
					agent.endTime = Date.now();

					const result: AgentExecutionResult = {
						success: true,
						result: assistantMsg.content,
						agent,
						childResults: childResults.length > 0 ? childResults : undefined,
					};

					options.onAgentComplete?.(agent, assistantMsg.content);

					return result;
				}

				break;
			}

			// Max iterations reached
			agent.status = 'complete';
			agent.endTime = Date.now();

			return {
				success: true,
				result: 'Task completed (max iterations reached)',
				agent,
				childResults: childResults.length > 0 ? childResults : undefined,
			};
		} catch (error) {
			agent.status = 'error';
			agent.endTime = Date.now();

			return {
				success: false,
				result: error instanceof Error ? error.message : String(error),
				agent,
			};
		}
	}

	/**
	 * Get agent by ID
	 */
	getAgent(agentId: string): Agent | undefined {
		return this.agents.get(agentId);
	}

	/**
	 * Get all agents
	 */
	getAllAgents(): Agent[] {
		return Array.from(this.agents.values());
	}

	/**
	 * Get agent hierarchy tree
	 */
	getAgentTree(agentId: string): any {
		const agent = this.agents.get(agentId);
		if (!agent) return null;

		return {
			...agent,
			children: agent.childAgents.map(childId => this.getAgentTree(childId)),
		};
	}
}
