import { writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { dirname } from 'path';
import { validateFilePath } from '../security/security.js';
import { enhancedLogger } from '../utils/enhanced-logger.js';

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
		const { isAbsolute, join, resolve, basename } = await import('path');
		
		// SANITIZAÇÃO INTELIGENTE: Corrigir paths inválidos preservando estrutura
		let sanitizedPath = filePath;
		
		// Corrigir /workspace/ ou workspace/ para work/
		if (filePath.startsWith('/workspace/')) {
			sanitizedPath = filePath.replace('/workspace/', 'work/');
			enhancedLogger.warn('WRITE_FILE', `Sanitized path: ${filePath} -> ${sanitizedPath}`);
		} else if (filePath.startsWith('workspace/')) {
			sanitizedPath = filePath.replace('workspace/', 'work/');
			enhancedLogger.warn('WRITE_FILE', `Sanitized path: ${filePath} -> ${sanitizedPath}`);
		} else if (filePath.startsWith('/tmp/') || filePath.startsWith('/var/')) {
			// Paths de sistema são inválidos - extrair apenas nome
			sanitizedPath = basename(filePath);
			enhancedLogger.warn('WRITE_FILE', `Sanitized system path: ${filePath} -> ${sanitizedPath}`);
		}
		
		// Corrigir work/work/ duplicado
		if (sanitizedPath.startsWith('work/work/')) {
			sanitizedPath = sanitizedPath.replace('work/work/', 'work/');
			enhancedLogger.warn('WRITE_FILE', `Fixed duplicate work/: ${filePath} -> ${sanitizedPath}`);
		}
		
		let finalPath = sanitizedPath;
		
		// Se path é relativo, resolver a partir do workDir
		if (!isAbsolute(sanitizedPath)) {
			if (workDir) {
				finalPath = resolve(workDir, sanitizedPath);
			} else {
				// Criar diretamente no cwd
				finalPath = join(process.cwd(), sanitizedPath);
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
		const startTime = Date.now();
		enhancedLogger.debug('WRITE_FILE', `Creating file: ${filePath}`, { size: content.length });
		writeFileSync(filePath, content, 'utf-8');
		const duration = Date.now() - startTime;
		enhancedLogger.info('WRITE_FILE', `File written successfully: ${filePath}`, { duration, size: content.length });
		
		// CRITICAL: Verify file was actually created and has correct size
		if (!existsSync(filePath)) {
			enhancedLogger.error('WRITE_FILE', `File was not created: ${filePath}`);
			return `Error: File was not created: ${filePath}`;
		}
		enhancedLogger.debug('WRITE_FILE', `File existence verified: ${filePath}`);
		
		const stats = statSync(filePath);
		const expectedSize = Buffer.byteLength(content, 'utf-8');
		
		if (stats.size !== expectedSize) {
			return `Warning: File created but size mismatch. Expected: ${expectedSize}, Got: ${stats.size}`;
		}
		
		enhancedLogger.fileOperation('WRITE', filePath, true, { size: stats.size });
		return `✓ File written and verified: ${filePath} (${stats.size} bytes)`;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : 'Failed to write file';
		enhancedLogger.error('WRITE_FILE', `Failed to write file: ${filePath}`, { error: errorMsg });
		return `Error: ${errorMsg}`;
	}
}
