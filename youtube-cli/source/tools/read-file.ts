import { readFileSync } from 'fs';
import { validateFilePath } from '../security/security.js';

export const readFileToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'read_file',
		description: 'Read contents of a file. Access to node_modules, vendor, .git and other package directories is blocked for security.',
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
		// Validate file path
		const validation = validateFilePath(filePath);
		if (!validation.valid) {
			return `Error: ${validation.error}`;
		}
		
		const content = readFileSync(filePath, 'utf-8');
		return content;
	} catch (error) {
		return `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`;
	}
}
