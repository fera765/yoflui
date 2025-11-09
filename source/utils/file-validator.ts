/**
 * Utilitário para validação real de arquivos criados/modificados
 * Garante que operações de filesystem foram bem-sucedidas
 */

import { existsSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

export interface FileValidationResult {
	exists: boolean;
	size: number;
	modified: boolean;
	hasContent: boolean;
	path: string;
	error?: string;
}

/**
 * Valida se um arquivo foi realmente criado e tem conteúdo
 */
export function validateFileCreation(
	filePath: string,
	workDir?: string,
	expectedMinSize: number = 10
): FileValidationResult {
	try {
		// Resolver path absoluto
		const absolutePath = workDir ? join(workDir, filePath) : filePath;
		
		// Verificar existência
		if (!existsSync(absolutePath)) {
			return {
				exists: false,
				size: 0,
				modified: false,
				hasContent: false,
				path: absolutePath,
				error: 'File does not exist'
			};
		}
		
		// Verificar tamanho
		const stats = statSync(absolutePath);
		const hasContent = stats.size >= expectedMinSize;
		
		// Verificar se foi modificado recentemente (últimos 60 segundos)
		const now = Date.now();
		const modifiedTime = stats.mtimeMs;
		const ageInSeconds = (now - modifiedTime) / 1000;
		const modified = ageInSeconds <= 60;
		
		return {
			exists: true,
			size: stats.size,
			modified,
			hasContent,
			path: absolutePath,
		};
	} catch (error) {
		return {
			exists: false,
			size: 0,
			modified: false,
			hasContent: false,
			path: filePath,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Valida se um arquivo contém determinado conteúdo
 */
export function validateFileContent(
	filePath: string,
	expectedPatterns: string[],
	workDir?: string
): { valid: boolean; matchedPatterns: string[]; error?: string } {
	try {
		const absolutePath = workDir ? join(workDir, filePath) : filePath;
		
		if (!existsSync(absolutePath)) {
			return {
				valid: false,
				matchedPatterns: [],
				error: 'File does not exist'
			};
		}
		
		const content = readFileSync(absolutePath, 'utf-8');
		const matchedPatterns = expectedPatterns.filter(pattern => 
			content.includes(pattern)
		);
		
		return {
			valid: matchedPatterns.length > 0,
			matchedPatterns
		};
	} catch (error) {
		return {
			valid: false,
			matchedPatterns: [],
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Valida múltiplos arquivos de uma vez
 */
export function validateMultipleFiles(
	filePaths: string[],
	workDir?: string
): Map<string, FileValidationResult> {
	const results = new Map<string, FileValidationResult>();
	
	for (const filePath of filePaths) {
		const result = validateFileCreation(filePath, workDir);
		results.set(filePath, result);
	}
	
	return results;
}

/**
 * Gera relatório de validação em formato legível
 */
export function generateValidationReport(
	results: Map<string, FileValidationResult>
): string {
	let report = '📊 File Validation Report\n';
	report += '━'.repeat(50) + '\n\n';
	
	let totalFiles = 0;
	let existingFiles = 0;
	let validFiles = 0;
	
	for (const [filePath, result] of results.entries()) {
		totalFiles++;
		
		if (result.exists) {
			existingFiles++;
			
			if (result.hasContent && result.modified) {
				validFiles++;
				report += `✅ ${filePath}\n`;
				report += `   Size: ${result.size} bytes | Modified: Recently\n`;
			} else {
				report += `⚠️  ${filePath}\n`;
				if (!result.hasContent) {
					report += `   Issue: File too small (${result.size} bytes)\n`;
				}
				if (!result.modified) {
					report += `   Issue: Not recently modified\n`;
				}
			}
		} else {
			report += `❌ ${filePath}\n`;
			report += `   Error: ${result.error || 'File not found'}\n`;
		}
		
		report += '\n';
	}
	
	report += '━'.repeat(50) + '\n';
	report += `Summary: ${validFiles}/${totalFiles} files valid\n`;
	report += `Exists: ${existingFiles}/${totalFiles}\n`;
	report += `Valid: ${validFiles}/${totalFiles}\n`;
	
	return report;
}
