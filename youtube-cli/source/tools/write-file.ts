import { writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { dirname } from 'path';
import { validateFilePath } from '../security/security.js';

export const writeFileToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'write_file',
		description: 'Write or create a file with content. Access to node_modules, vendor, .git and other package directories is blocked for security.',
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

export async function executeWriteFileTool(filePath: string, content: string, workDir?: string): Promise<string> {
	try {
		// CORRIGIDO: Usar workDir se fornecido, caso contrário usar path absoluto ou process.cwd()
		const { isAbsolute, join, resolve } = await import('path');
		let finalPath = filePath;
		
		// Se path é relativo, resolver a partir do workDir
		if (!isAbsolute(filePath)) {
			if (workDir) {
				finalPath = resolve(workDir, filePath);
			} else {
				// Fallback para work/ apenas se não houver workDir
				finalPath = join(process.cwd(), 'work', filePath);
			}
		}
		
		// Validate file path (passar workDir como workspace root)
		const validation = validateFilePath(finalPath, workDir);
		if (!validation.valid) {
			return `Error: ${validation.error}`;
		}
		
		// Usar finalPath
		filePath = finalPath;
		
		// Create directories recursively
		mkdirSync(dirname(filePath), { recursive: true });
		
		// Write file
		writeFileSync(filePath, content, 'utf-8');
		
		// CRITICAL: Verify file was actually created and has correct size
		if (!existsSync(filePath)) {
			return `Error: File was not created: ${filePath}`;
		}
		
		const stats = statSync(filePath);
		const expectedSize = Buffer.byteLength(content, 'utf-8');
		
		if (stats.size !== expectedSize) {
			return `Warning: File created but size mismatch. Expected: ${expectedSize}, Got: ${stats.size}`;
		}
		
		return `✓ File written and verified: ${filePath} (${stats.size} bytes)`;
	} catch (error) {
		return `Error: ${error instanceof Error ? error.message : 'Failed to write file'}`;
	}
}
