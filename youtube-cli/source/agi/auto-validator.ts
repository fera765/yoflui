/**
 * Sistema Autônomo de Validação e Correção
 * 
 * Responsável por:
 * - Validar builds automaticamente
 * - Detectar erros de dependências
 * - Sugerir correções inteligentes
 * - Executar npm install quando necessário
 */

import OpenAI from 'openai';

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	suggestions: string[];
	needsNpmInstall: boolean;
	needsBuild: boolean;
	autoFixCommands: string[];
}

/**
 * Valida projeto e sugere correções automaticamente
 */
export async function validateProject(
	workDir: string,
	openai: OpenAI
): Promise<ValidationResult> {
	const { executeShellTool } = await import('../tools/shell.js');
	const { existsSync } = await import('fs');
	
	const result: ValidationResult = {
		isValid: true,
		errors: [],
		suggestions: [],
		needsNpmInstall: false,
		needsBuild: false,
		autoFixCommands: []
	};
	
	// 1. Verificar se package.json existe
	if (!existsSync(`${workDir}/package.json`)) {
		result.isValid = false;
		result.errors.push('package.json não encontrado');
		result.suggestions.push('Criar package.json ou mover do template');
		return result;
	}
	
	// 2. Verificar se node_modules existe
	if (!existsSync(`${workDir}/node_modules`)) {
		result.needsNpmInstall = true;
		result.autoFixCommands.push(`cd ${workDir} && npm install`);
		result.suggestions.push('Executar npm install para instalar dependências');
	}
	
	// 3. Tentar build se tiver script build
	try {
		const buildOutput = await executeShellTool(
			`cd ${workDir} && npm run build 2>&1`,
			120000
		);
		
		if (buildOutput.includes('error') || buildOutput.includes('Error') || buildOutput.includes('failed')) {
			result.isValid = false;
			result.errors.push('Build falhou');
			
			// Analisar erro com LLM para sugerir correção
			const analysis = await analyzeBuildError(buildOutput, openai);
			result.suggestions.push(...analysis.suggestions);
			result.autoFixCommands.push(...analysis.commands);
		}
	} catch (error) {
		result.errors.push(`Erro ao executar build: ${error}`);
	}
	
	return result;
}

/**
 * Analisa erro de build com LLM e sugere correções
 */
async function analyzeBuildError(
	errorOutput: string,
	openai: OpenAI
): Promise<{ suggestions: string[]; commands: string[] }> {
	try {
		const analysis = await openai.chat.completions.create({
			model: 'qwen-plus',
			messages: [{
				role: 'system',
				content: `Você é um especialista em debugging. Analise o erro de build e sugira correções específicas.

Responda em JSON:
{
  "errorType": "tipo do erro (missing-dep, syntax, config, etc)",
  "suggestions": ["sugestão 1", "sugestão 2"],
  "commands": ["comando 1 para corrigir", "comando 2"]
}`
			}, {
				role: 'user',
				content: `Erro de build:\n${errorOutput.substring(0, 2000)}`
			}],
			temperature: 0.2,
			max_tokens: 500
		});
		
		const response = analysis.choices[0]?.message?.content || '{}';
		const parsed = JSON.parse(response.trim());
		
		return {
			suggestions: parsed.suggestions || [],
			commands: parsed.commands || []
		};
	} catch {
		return {
			suggestions: ['Verificar logs de erro manualmente'],
			commands: []
		};
	}
}

/**
 * Detecta dependências faltantes em erro
 */
export function detectMissingDependencies(errorText: string): string[] {
	const missing: string[] = [];
	
	// Padrões comuns de erro de dependência
	const patterns = [
		/Cannot find module ['"]([^'"]+)['"]/g,
		/Cannot find package ['"]([^'"]+)['"]/g,
		/Module not found: Error: Can't resolve ['"]([^'"]+)['"]/g,
		/Error: Cannot find module ['"]([^'"]+)['"]/g
	];
	
	for (const pattern of patterns) {
		let match;
		while ((match = pattern.exec(errorText)) !== null) {
			const dep = match[1];
			// Filtrar paths relativos
			if (!dep.startsWith('.') && !dep.startsWith('/')) {
				missing.push(dep);
			}
		}
	}
	
	return [...new Set(missing)]; // Remove duplicatas
}

/**
 * Executa auto-correção de erros comuns
 */
export async function autoFixCommonErrors(
	workDir: string,
	errors: string[],
	onProgress?: (message: string) => void
): Promise<boolean> {
	const { executeShellTool } = await import('../tools/shell.js');
	
	for (const error of errors) {
		// Erro: módulo não encontrado
		if (error.includes('Cannot find module') || error.includes('Module not found')) {
			const deps = detectMissingDependencies(error);
			if (deps.length > 0) {
				onProgress?.(`🔧 Auto-correção: Instalando dependências faltantes: ${deps.join(', ')}`);
				const installCmd = `cd ${workDir} && npm install ${deps.join(' ')}`;
				await executeShellTool(installCmd, 120000);
			}
		}
		
		// Erro: falta npm install
		if (error.includes('node_modules')) {
			onProgress?.('🔧 Auto-correção: Executando npm install');
			await executeShellTool(`cd ${workDir} && npm install`, 120000);
		}
	}
	
	return true;
}
