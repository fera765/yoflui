import { readdirSync, statSync } from 'fs';
import { join } from 'path';

export const readFolderToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'read_folder',
		description: 'List files and folders in a directory',
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
