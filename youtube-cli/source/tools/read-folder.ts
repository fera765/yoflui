import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { validateDirectoryPath } from '../security/security.js';

export const readFolderToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'read_folder',
		description: 'List files and folders in a directory. Access to node_modules, vendor, .git and other package directories is blocked for security.',
		parameters: {
			type: 'object',
			properties: {
				path: { type: 'string', description: 'Directory path' },
			},
			required: ['path'],
		},
	},
};

export async function executeReadFolderTool(path: string): Promise<string> {
	try {
		// Validate directory path
		const validation = validateDirectoryPath(path);
		if (!validation.valid) {
			return `Error: ${validation.error}`;
		}
		
		const items = readdirSync(path);
		const details = items.map(item => {
			const fullPath = join(path, item);
			const stats = statSync(fullPath);
			return `${stats.isDirectory() ? '??' : '??'} ${item}`;
		});
		return details.join('\n');
	} catch (error) {
		return `Error: ${error instanceof Error ? error.message : 'Failed to read folder'}`;
	}
}
