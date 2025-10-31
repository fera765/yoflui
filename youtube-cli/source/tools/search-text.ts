import { execSync } from 'child_process';

export const searchTextToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'search_text',
		description: 'Search for text in files using grep',
		parameters: {
			type: 'object',
			properties: {
				pattern: { type: 'string', description: 'Text pattern to search' },
				directory: { type: 'string', description: 'Directory to search' },
			},
			required: ['pattern'],
		},
	},
};

export async function executeSearchTextTool(pattern: string, directory: string = '.'): Promise<string> {
	try {
		const output = execSync(`grep -r "${pattern}" ${directory} 2>/dev/null`, { encoding: 'utf-8' });
		return output || 'No matches found';
	} catch (error) {
		return 'No matches found';
	}
}
