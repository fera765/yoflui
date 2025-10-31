import { execSync } from 'child_process';

export const findFilesToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'find_files',
		description: 'Find files matching a pattern',
		parameters: {
			type: 'object',
			properties: {
				pattern: { type: 'string', description: 'File pattern (e.g., "*.ts")' },
				directory: { type: 'string', description: 'Directory to search (default: current)' },
			},
			required: ['pattern'],
		},
	},
};

export async function executeFindFilesTool(pattern: string, directory: string = '.'): Promise<string> {
	try {
		const output = execSync(`find ${directory} -name "${pattern}" 2>/dev/null`, { encoding: 'utf-8' });
		return output || 'No files found';
	} catch (error) {
		return `Error: ${error instanceof Error ? error.message : 'Find failed'}`;
	}
}
