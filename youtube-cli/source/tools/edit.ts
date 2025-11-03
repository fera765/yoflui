import { readFileSync, writeFileSync } from 'fs';
import { validateFilePath } from '../security/security.js';

export const editToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'edit_file',
		description: 'Edit a file by replacing old text with new text. Access to node_modules, vendor, .git and other package directories is blocked for security.',
		parameters: {
			type: 'object',
			properties: {
				file_path: { type: 'string', description: 'Path to file' },
				old_string: { type: 'string', description: 'Text to replace' },
				new_string: { type: 'string', description: 'New text' },
			},
			required: ['file_path', 'old_string', 'new_string'],
		},
	},
};

export async function executeEditTool(filePath: string, oldStr: string, newStr: string): Promise<string> {
	try {
		// Validate file path
		const validation = validateFilePath(filePath);
		if (!validation.valid) {
			return `Error: ${validation.error}`;
		}
		
		const content = readFileSync(filePath, 'utf-8');
		if (!content.includes(oldStr)) {
			return `Error: Old string not found in ${filePath}`;
		}
		const updated = content.replace(oldStr, newStr);
		writeFileSync(filePath, updated, 'utf-8');
		return `? File edited: ${filePath}`;
	} catch (error) {
		return `Error: ${error instanceof Error ? error.message : 'Failed to edit file'}`;
	}
}
