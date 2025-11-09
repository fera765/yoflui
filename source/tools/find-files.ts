import { execSync } from 'child_process';
import { validateDirectoryPath } from '../security/security.js';

export const findFilesToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'find_files',
		description: 'Find files matching a pattern. Automatically excludes node_modules, vendor, .git and other package directories.',
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
		// Validate directory path
		const validation = validateDirectoryPath(directory);
		if (!validation.valid) {
			return `Error: ${validation.error}`;
		}
		
		// Build exclude patterns for blocked directories
		const excludes = [
			'node_modules',
			'vendor',
			'.git',
			'.vscode',
			'.idea',
			'__pycache__',
			'.pytest_cache',
			'.venv',
			'venv',
			'build',
			'dist',
			'.next',
			'.cache',
			'coverage',
			'target',
		];
		
		const excludeArgs = excludes.map(dir => `-not -path "*/${dir}/*"`).join(' ');
		
		// Escape pattern for shell
		const escapedPattern = pattern.replace(/"/g, '\\"');
		
		const command = `find ${directory} ${excludeArgs} -name "${escapedPattern}" 2>/dev/null`;
		const output = execSync(command, { encoding: 'utf-8' });
		return output || 'No files found';
	} catch (error) {
		return `Error: ${error instanceof Error ? error.message : 'Find failed'}`;
	}
}
