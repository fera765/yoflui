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

export async function executeWriteFileTool(filePath: string, content: string): Promise<string> {
	try {
		// CRÍTICO: Se path não começa com work/ e não é absoluto, forçar prefixo work/
		const { isAbsolute, join } = await import('path');
		let finalPath = filePath;
		let pathWasCorrected = false;
		
		if (!isAbsolute(filePath) && !filePath.startsWith('work/') && !filePath.startsWith('work\\')) {
			finalPath = join('work', filePath);
			pathWasCorrected = true;
			console.warn(`[WRITE_FILE] PATH corrigido: ${filePath} → ${finalPath}`);
		}
		
		// Validate file path
		const validation = validateFilePath(finalPath);
		if (!validation.valid) {
			return `Error: ${validation.error}`;
		}
		
		// Atualizar para usar finalPath em vez de filePath
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
		
		const pathNote = pathWasCorrected ? ` [PATH auto-corrected to work/]` : '';
		return `✓ File written and verified: ${filePath} (${stats.size} bytes)${pathNote}`;
	} catch (error) {
		return `Error: ${error instanceof Error ? error.message : 'Failed to write file'}`;
	}
}
