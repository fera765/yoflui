/**
 * Code Validator - Valida automaticamente código gerado
 * 
 * Executa linters, testes sintáticos e checks de qualidade
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';

export interface CodeValidationResult {
	isValid: boolean;
	language: string;
	issues: ValidationIssue[];
	suggestions: string[];
	autoFixable: boolean;
	autoFixApplied?: boolean;
	score: number; // 0-100
}

export interface ValidationIssue {
	type: 'error' | 'warning' | 'info';
	line?: number;
	column?: number;
	message: string;
	rule?: string;
	severity: 'critical' | 'major' | 'minor';
}

/**
 * Detecta linguagem pelo arquivo
 */
function detectLanguage(filePath: string): string {
	const ext = extname(filePath).toLowerCase();
	
	const langMap: Record<string, string> = {
		'.js': 'javascript',
		'.jsx': 'javascript',
		'.ts': 'typescript',
		'.tsx': 'typescript',
		'.py': 'python',
		'.rb': 'ruby',
		'.go': 'go',
		'.rs': 'rust',
		'.java': 'java',
		'.cpp': 'cpp',
		'.c': 'c',
		'.cs': 'csharp',
		'.php': 'php',
		'.swift': 'swift',
		'.kt': 'kotlin'
	};
	
	return langMap[ext] || 'unknown';
}

/**
 * Valida código JavaScript/TypeScript
 */
async function validateJavaScript(filePath: string, autoFix: boolean = true): Promise<CodeValidationResult> {
	const issues: ValidationIssue[] = [];
	const suggestions: string[] = [];
	const language = filePath.endsWith('.ts') || filePath.endsWith('.tsx') ? 'typescript' : 'javascript';
	
	try {
		// 1. Verificar sintaxe básica
		const code = readFileSync(filePath, 'utf-8');
		
		try {
			// Tentar parsear como JavaScript
			new Function(code);
		} catch (syntaxError: any) {
			issues.push({
				type: 'error',
				message: `Erro de sintaxe: ${syntaxError.message}`,
				severity: 'critical'
			});
		}
		
		// 2. Verificar ESLint se disponível
		try {
			const eslintResult = execSync(
				`npx eslint "${filePath}" --format json ${autoFix ? '--fix' : ''}`,
				{ encoding: 'utf-8', cwd: dirname(filePath), timeout: 10000 }
			);
			
			const eslintData = JSON.parse(eslintResult);
			
			if (eslintData && eslintData[0]) {
				const fileResult = eslintData[0];
				
				for (const message of fileResult.messages || []) {
					issues.push({
						type: message.severity === 2 ? 'error' : 'warning',
						line: message.line,
						column: message.column,
						message: message.message,
						rule: message.ruleId,
						severity: message.severity === 2 ? 'major' : 'minor'
					});
				}
				
				if (autoFix && fileResult.output) {
					writeFileSync(filePath, fileResult.output, 'utf-8');
					suggestions.push('Auto-fix ESLint aplicado');
				}
			}
		} catch (eslintError) {
			// ESLint não disponível ou erro ao executar
			suggestions.push('ESLint não disponível. Recomendado instalar: npm install -D eslint');
		}
		
		// 3. Verificar TypeScript se for .ts/.tsx
		if (language === 'typescript') {
			try {
				const tscResult = execSync(
					`npx tsc "${filePath}" --noEmit --skipLibCheck`,
					{ encoding: 'utf-8', cwd: dirname(filePath), timeout: 10000 }
				);
				
				// Se não houver output, compilação OK
				if (!tscResult || tscResult.trim() === '') {
					suggestions.push('TypeScript: Compilação OK');
				}
			} catch (tscError: any) {
				// Parsear erros do TypeScript
				const errorOutput = tscError.stdout || tscError.stderr || '';
				const errorLines = errorOutput.split('\n');
				
				for (const line of errorLines) {
					if (line.includes('error TS')) {
						issues.push({
							type: 'error',
							message: line,
							severity: 'major'
						});
					}
				}
			}
		}
		
		// 4. Checks de qualidade básicos
		const qualityChecks = performQualityChecks(code);
		issues.push(...qualityChecks);
		
		// 5. Calcular score
		const errorCount = issues.filter(i => i.type === 'error').length;
		const warningCount = issues.filter(i => i.type === 'warning').length;
		const score = Math.max(0, 100 - (errorCount * 20) - (warningCount * 5));
		
		return {
			isValid: errorCount === 0,
			language,
			issues,
			suggestions,
			autoFixable: issues.some(i => i.rule !== undefined),
			autoFixApplied: autoFix,
			score
		};
		
	} catch (error) {
		return {
			isValid: false,
			language,
			issues: [{
				type: 'error',
				message: `Erro ao validar: ${error instanceof Error ? error.message : String(error)}`,
				severity: 'critical'
			}],
			suggestions: [],
			autoFixable: false,
			score: 0
		};
	}
}

/**
 * Valida código Python
 */
async function validatePython(filePath: string): Promise<CodeValidationResult> {
	const issues: ValidationIssue[] = [];
	const suggestions: string[] = [];
	
	try {
		// 1. Verificar sintaxe com pylint
		try {
			const pylintResult = execSync(
				`python -m py_compile "${filePath}"`,
				{ encoding: 'utf-8', timeout: 10000 }
			);
			
			suggestions.push('Python: Sintaxe OK');
		} catch (syntaxError: any) {
			issues.push({
				type: 'error',
				message: `Erro de sintaxe Python: ${syntaxError.message}`,
				severity: 'critical'
			});
		}
		
		// 2. Verificar com flake8 se disponível
		try {
			const flake8Result = execSync(
				`flake8 "${filePath}"`,
				{ encoding: 'utf-8', timeout: 10000 }
			);
			
			if (flake8Result.trim() !== '') {
				const lines = flake8Result.split('\n');
				for (const line of lines) {
					if (line.trim()) {
						issues.push({
							type: 'warning',
							message: line,
							severity: 'minor'
						});
					}
				}
			}
		} catch (flake8Error) {
			suggestions.push('flake8 não disponível. Recomendado instalar: pip install flake8');
		}
		
		const errorCount = issues.filter(i => i.type === 'error').length;
		const score = Math.max(0, 100 - (errorCount * 20) - (issues.length * 5));
		
		return {
			isValid: errorCount === 0,
			language: 'python',
			issues,
			suggestions,
			autoFixable: false,
			score
		};
		
	} catch (error) {
		return {
			isValid: false,
			language: 'python',
			issues: [{
				type: 'error',
				message: `Erro ao validar: ${error instanceof Error ? error.message : String(error)}`,
				severity: 'critical'
			}],
			suggestions: [],
			autoFixable: false,
			score: 0
		};
	}
}

/**
 * Checks de qualidade básicos
 */
function performQualityChecks(code: string): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	
	// 1. Linhas muito longas (>120 chars)
	const lines = code.split('\n');
	let longLineCount = 0;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].length > 120) {
			longLineCount++;
		}
	}
	
	if (longLineCount > lines.length * 0.2) {
		issues.push({
			type: 'warning',
			message: `${longLineCount} linhas muito longas (>120 chars)`,
			severity: 'minor'
		});
	}
	
	// 2. Código comentado demais ou de menos
	const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('#')).length;
	const commentRatio = commentLines / lines.length;
	
	if (commentRatio < 0.05 && lines.length > 50) {
		issues.push({
			type: 'info',
			message: 'Poucos comentários no código (< 5%)',
			severity: 'minor'
		});
	}
	
	// 3. Console.log / print statements (possível debug code)
	const debugStatements = (code.match(/console\.log|print\(/g) || []).length;
	if (debugStatements > 5) {
		issues.push({
			type: 'warning',
			message: `${debugStatements} statements de debug encontrados (console.log/print)`,
			severity: 'minor'
		});
	}
	
	// 4. Variáveis de letra única (exceto i, j, k em loops)
	const singleLetterVars = (code.match(/\b[a-hln-z]\b\s*=/g) || []).length;
	if (singleLetterVars > 3) {
		issues.push({
			type: 'info',
			message: `${singleLetterVars} variáveis de letra única (dificulta leitura)`,
			severity: 'minor'
		});
	}
	
	return issues;
}

/**
 * Valida qualquer arquivo de código
 */
export async function validateCode(
	filePath: string,
	options: {
		autoFix?: boolean;
		strict?: boolean;
	} = {}
): Promise<CodeValidationResult> {
	const { autoFix = true, strict = false } = options;
	
	if (!existsSync(filePath)) {
		return {
			isValid: false,
			language: 'unknown',
			issues: [{
				type: 'error',
				message: `Arquivo não encontrado: ${filePath}`,
				severity: 'critical'
			}],
			suggestions: [],
			autoFixable: false,
			score: 0
		};
	}
	
	const language = detectLanguage(filePath);
	
	switch (language) {
		case 'javascript':
		case 'typescript':
			return await validateJavaScript(filePath, autoFix);
		
		case 'python':
			return await validatePython(filePath);
		
		default:
			return {
				isValid: true, // Assume válido se não puder validar
				language,
				issues: [],
				suggestions: [`Validação automática não disponível para ${language}`],
				autoFixable: false,
				score: 100
			};
	}
}

/**
 * Formata resultado para exibição
 */
export function formatValidationResult(result: CodeValidationResult): string {
	const lines: string[] = [];
	
	lines.push(`\n📊 Validação de Código (${result.language.toUpperCase()})\n`);
	lines.push(`Score: ${result.score}/100 ${result.score >= 80 ? '✅' : result.score >= 60 ? '⚠️' : '❌'}\n`);
	
	if (result.isValid) {
		lines.push('✅ Código válido!\n');
	} else {
		lines.push('❌ Código contém erros!\n');
	}
	
	if (result.issues.length > 0) {
		const errors = result.issues.filter(i => i.type === 'error');
		const warnings = result.issues.filter(i => i.type === 'warning');
		const infos = result.issues.filter(i => i.type === 'info');
		
		if (errors.length > 0) {
			lines.push(`\n❌ Erros (${errors.length}):`);
			errors.slice(0, 10).forEach(err => {
				const location = err.line ? ` [Linha ${err.line}]` : '';
				lines.push(`  • ${location} ${err.message}`);
			});
		}
		
		if (warnings.length > 0) {
			lines.push(`\n⚠️  Avisos (${warnings.length}):`);
			warnings.slice(0, 10).forEach(warn => {
				const location = warn.line ? ` [Linha ${warn.line}]` : '';
				lines.push(`  • ${location} ${warn.message}`);
			});
		}
		
		if (infos.length > 0) {
			lines.push(`\nℹ️  Informações (${infos.length}):`);
			infos.slice(0, 5).forEach(info => {
				lines.push(`  • ${info.message}`);
			});
		}
	}
	
	if (result.suggestions.length > 0) {
		lines.push('\n💡 Sugestões:');
		result.suggestions.forEach(sug => {
			lines.push(`  • ${sug}`);
		});
	}
	
	if (result.autoFixApplied) {
		lines.push('\n🔧 Auto-fix aplicado automaticamente');
	}
	
	return lines.join('\n');
}

/**
 * Hook para validar automaticamente após criar arquivo
 */
export async function validateAfterCreate(filePath: string): Promise<void> {
	const result = await validateCode(filePath, { autoFix: true });
	
	console.log(formatValidationResult(result));
	
	if (!result.isValid) {
		console.log('\n⚠️  ATENÇÃO: Código gerado contém erros. Revisar é recomendado.');
	}
}
