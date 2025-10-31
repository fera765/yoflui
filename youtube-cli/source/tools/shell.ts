import { execSync } from 'child_process';

export const shellToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'execute_shell',
		description: 'Execute a shell command',
		parameters: {
			type: 'object',
			properties: {
				command: { type: 'string', description: 'Shell command to execute' },
			},
			required: ['command'],
		},
	},
};

export async function executeShellTool(command: string): Promise<string> {
	try {
		const output = execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
		return output;
	} catch (error: any) {
		return `Error: ${error.stderr || error.message || 'Command failed'}`;
	}
}
