import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export const writeFileToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'write_file',
		description: 'Write or create a file with content',
		parameters: {
			type: 'object',
			properties: {
				file_path: { type: 'string', description: 'Path to file' },
				content: { type: 'string', description: 'Content to write' },
			},
			required: ['file_path', 'content'],
		},
	},
};

export async function executeWriteFileTool(filePath: string, content: string): Promise<string> {
	try {
		mkdirSync(dirname(filePath), { recursive: true });
		writeFileSync(filePath, content, 'utf-8');
		return `? File written: ${filePath}`;
	} catch (error) {
		return `Error: ${error instanceof Error ? error.message : 'Failed to write file'}`;
	}
}
