import { readFileSync } from 'fs';

export const readFileToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'read_file',
		description: 'Read contents of a file',
		parameters: {
			type: 'object',
			properties: {
				file_path: { type: 'string', description: 'Path to file to read' },
			},
			required: ['file_path'],
		},
	},
};

export async function executeReadFileTool(filePath: string): Promise<string> {
	try {
		const content = readFileSync(filePath, 'utf-8');
		return content;
	} catch (error) {
		return `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`;
	}
}
