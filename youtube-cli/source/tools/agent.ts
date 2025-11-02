import { AgentSystem, type Agent, type AgentExecutionOptions } from '../agent-system.js';

export interface AgentToolResult {
	success: boolean;
	result: string;
	agent: Agent;
	executionTime: number;
}

let globalAgentSystem: AgentSystem | null = null;

/**
 * Get or create global agent system
 */
export function getAgentSystem(): AgentSystem {
	if (!globalAgentSystem) {
		globalAgentSystem = new AgentSystem();
	}
	return globalAgentSystem;
}

/**
 * Tool definition for delegating to an agent
 */
export const delegateAgentToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'delegate_to_agent',
		description: 'Delegate a task to a specialized Agent that can use tools and delegate to other agents. Use for complex multi-step tasks from Kanban.',
		parameters: {
			type: 'object',
			properties: {
				task: {
					type: 'string',
					description: 'The task description to delegate to the agent',
				},
				kanban_task_id: {
					type: 'string',
					description: 'Optional: ID of the Kanban task being executed',
				},
			},
			required: ['task'],
		},
	},
};

/**
 * Execute agent delegation
 */
export async function executeDelegateAgent(
	task: string,
	workDir: string,
	kanbanTaskId?: string,
	onProgress?: (agent: Agent, message: string) => void,
	onToolExecute?: (agent: Agent, toolName: string, args: any) => void,
	onToolComplete?: (agent: Agent, toolName: string, result: string, error?: boolean) => void,
	onAgentDelegate?: (parentAgent: Agent, childAgent: Agent) => void,
): Promise<string> {
	const agentSystem = getAgentSystem();

	const options: AgentExecutionOptions = {
		task,
		workDir,
		onProgress,
		onToolExecute,
		onToolComplete,
		onAgentDelegate,
		onAgentComplete: (agent, result) => {
			// Log completion
		},
	};

	try {
		const result = await agentSystem.executeAgent(options);

		if (!result.success) {
			return `[!] Agent failed: ${result.result}`;
		}

		const executionTime = result.agent.endTime 
			? result.agent.endTime - result.agent.startTime
			: 0;

		const summary = [
			`[+] Agent ${result.agent.name} completed task`,
			`    Execution time: ${(executionTime / 1000).toFixed(2)}s`,
			`    Tools used: ${result.agent.toolsUsed.join(', ') || 'none'}`,
			`    Child agents: ${result.agent.childAgents.length}`,
			``,
			`Result:`,
			result.result,
		];

		return summary.join('\n');
	} catch (error) {
		return `[!] Agent execution error: ${error instanceof Error ? error.message : String(error)}`;
	}
}

/**
 * Get agent system stats
 */
export function getAgentSystemStats(): {
	totalAgents: number;
	activeAgents: number;
	completedAgents: number;
	errorAgents: number;
} {
	const system = getAgentSystem();
	const allAgents = system.getAllAgents();

	return {
		totalAgents: allAgents.length,
		activeAgents: allAgents.filter(a => a.status === 'working' || a.status === 'delegating').length,
		completedAgents: allAgents.filter(a => a.status === 'complete').length,
		errorAgents: allAgents.filter(a => a.status === 'error').length,
	};
}
