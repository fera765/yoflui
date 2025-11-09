/**
 * Input Extractor - Extrai e valida inputs críticos do prompt do usuário
 * 
 * Detecta valores monetários, emails, URLs, paths críticos e valida antes de processar
 */

import {
	validateCurrency,
	validateEmail,
	validateURL,
	validatePath,
	validateNumber,
	ValidationResult,
	formatValidationMessage
} from './input-validator.js';

export interface ExtractedInput {
	type: 'currency' | 'email' | 'url' | 'path' | 'number' | 'date';
	value: string;
	position: number;
	length: number;
	validation?: ValidationResult;
	confidence: number; // 0-1
}

export interface ExtractionResult {
	inputs: ExtractedInput[];
	hasProblems: boolean;
	problems: string[];
	suggestions: string[];
	correctedPrompt?: string;
}

/**
 * Extrai valores monetários do prompt
 */
function extractCurrency(prompt: string): ExtractedInput[] {
	const patterns = [
		// R$997, R$ 997, R$997.00, R$ 997,00
		/R\$?\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?/gi,
		// $997, $ 997, $997.00
		/\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
		// €997, € 997
		/€\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?/g,
		// "preço: 997", "valor: 997"
		/(?:preço|valor|custo|price|cost):\s*R?\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/gi
	];
	
	const results: ExtractedInput[] = [];
	
	for (const pattern of patterns) {
		let match;
		while ((match = pattern.exec(prompt)) !== null) {
			results.push({
				type: 'currency',
				value: match[0].trim(),
				position: match.index,
				length: match[0].length,
				confidence: 0.9
			});
		}
	}
	
	return results;
}

/**
 * Extrai emails do prompt
 */
function extractEmail(prompt: string): ExtractedInput[] {
	const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
	const results: ExtractedInput[] = [];
	
	let match;
	while ((match = emailPattern.exec(prompt)) !== null) {
		results.push({
			type: 'email',
			value: match[0],
			position: match.index,
			length: match[0].length,
			confidence: 0.95
		});
	}
	
	return results;
}

/**
 * Extrai URLs do prompt
 */
function extractURL(prompt: string): ExtractedInput[] {
	const urlPattern = /(https?:\/\/[^\s]+)/g;
	const results: ExtractedInput[] = [];
	
	let match;
	while ((match = urlPattern.exec(prompt)) !== null) {
		results.push({
			type: 'url',
			value: match[0],
			position: match.index,
			length: match[0].length,
			confidence: 0.98
		});
	}
	
	return results;
}

/**
 * Extrai paths de arquivos do prompt
 */
function extractPath(prompt: string): ExtractedInput[] {
	const patterns = [
		// Unix paths: /path/to/file.txt
		/\/[\w\-\.\/]+/g,
		// Windows paths: C:\path\to\file.txt
		/[A-Z]:\\[\w\-\.\\]+/gi,
		// Paths em contexto: "arquivo X.txt", "pasta Y/"
		/(?:arquivo|file|pasta|folder|directory|dir)[\s:]+([^\s,\.]+(?:\.\w+)?)/gi
	];
	
	const results: ExtractedInput[] = [];
	
	for (const pattern of patterns) {
		let match;
		while ((match = pattern.exec(prompt)) !== null) {
			const value = match[1] || match[0];
			results.push({
				type: 'path',
				value: value.trim(),
				position: match.index,
				length: match[0].length,
				confidence: 0.7 // Paths têm menor confiança pois podem ser ambíguos
			});
		}
	}
	
	return results;
}

/**
 * Extrai números importantes do prompt
 */
function extractNumbers(prompt: string): ExtractedInput[] {
	const patterns = [
		// Números com contexto: "limite: 100", "máximo: 50"
		/(?:limite|limit|max|min|mínimo|máximo|quantidade|count):\s*(\d+)/gi,
		// Porcentagens: 50%, 75%
		/(\d+(?:\.\d+)?)\s*%/g
	];
	
	const results: ExtractedInput[] = [];
	
	for (const pattern of patterns) {
		let match;
		while ((match = pattern.exec(prompt)) !== null) {
			const value = match[1] || match[0];
			results.push({
				type: 'number',
				value: value.trim(),
				position: match.index,
				length: match[0].length,
				confidence: 0.85
			});
		}
	}
	
	return results;
}

/**
 * Extrai e valida todos os inputs críticos do prompt
 */
export function extractAndValidateInputs(prompt: string): ExtractionResult {
	const inputs: ExtractedInput[] = [];
	
	// Extrair cada tipo
	inputs.push(...extractCurrency(prompt));
	inputs.push(...extractEmail(prompt));
	inputs.push(...extractURL(prompt));
	inputs.push(...extractPath(prompt));
	inputs.push(...extractNumbers(prompt));
	
	// Remover duplicatas (mesma posição)
	const uniqueInputs = inputs.filter((input, index, self) =>
		index === self.findIndex(t => t.position === input.position)
	);
	
	// Ordenar por posição
	uniqueInputs.sort((a, b) => a.position - b.position);
	
	// Validar cada input
	const problems: string[] = [];
	const suggestions: string[] = [];
	
	for (const input of uniqueInputs) {
		let validation: ValidationResult;
		
		switch (input.type) {
			case 'currency':
				validation = validateCurrency(input.value);
				break;
			case 'email':
				validation = validateEmail(input.value);
				break;
			case 'url':
				validation = validateURL(input.value);
				break;
			case 'path':
				validation = validatePath(input.value);
				break;
			case 'number':
				validation = validateNumber(input.value);
				break;
			default:
				continue;
		}
		
		input.validation = validation;
		
		if (!validation.isValid) {
			problems.push(`${input.type.toUpperCase()}: ${validation.errors.join(', ')}`);
		}
		
		if (validation.warnings.length > 0) {
			suggestions.push(`${input.type.toUpperCase()}: ${validation.warnings.join(', ')}`);
		}
	}
	
	// Tentar gerar prompt corrigido se houver problemas
	let correctedPrompt: string | undefined;
	if (problems.length > 0 || suggestions.length > 0) {
		correctedPrompt = generateCorrectedPrompt(prompt, uniqueInputs);
	}
	
	return {
		inputs: uniqueInputs,
		hasProblems: problems.length > 0,
		problems,
		suggestions,
		correctedPrompt
	};
}

/**
 * Gera uma versão corrigida do prompt
 */
function generateCorrectedPrompt(original: string, inputs: ExtractedInput[]): string {
	let corrected = original;
	
	// Aplicar correções de trás para frente para não bagunçar posições
	const sortedInputs = [...inputs].sort((a, b) => b.position - a.position);
	
	for (const input of sortedInputs) {
		if (!input.validation || input.validation.isValid) continue;
		
		// Se temos um valor corrigido, substituir
		if (input.validation.value && typeof input.validation.value === 'object') {
			let replacement = input.value;
			
			if (input.type === 'currency' && 'formatted' in input.validation.value) {
				replacement = input.validation.value.formatted;
			} else if (input.type === 'email' && 'full' in input.validation.value) {
				replacement = input.validation.value.full;
			} else if (input.type === 'url' && 'full' in input.validation.value) {
				replacement = input.validation.value.full;
			}
			
			corrected = corrected.substring(0, input.position) +
				replacement +
				corrected.substring(input.position + input.length);
		}
	}
	
	return corrected;
}

/**
 * Formata relatório de validação para exibir ao usuário
 */
export function formatValidationReport(result: ExtractionResult): string {
	const lines: string[] = [];
	
	if (result.inputs.length === 0) {
		return ''; // Nenhum input crítico detectado
	}
	
	lines.push('🔍 Inputs Críticos Detectados:\n');
	
	for (const input of result.inputs) {
		if (input.validation) {
			const status = input.validation.isValid ? '✅' : '❌';
			lines.push(`${status} ${input.type.toUpperCase()}: "${input.value}"`);
			
			if (!input.validation.isValid) {
				input.validation.errors.forEach(err => {
					lines.push(`   ├─ ❌ ${err}`);
				});
			}
			
			if (input.validation.warnings.length > 0) {
				input.validation.warnings.forEach(warn => {
					lines.push(`   ├─ ⚠️  ${warn}`);
				});
			}
		}
	}
	
	if (result.hasProblems) {
		lines.push('\n❌ PROBLEMAS ENCONTRADOS:');
		result.problems.forEach(problem => lines.push(`  • ${problem}`));
	}
	
	if (result.suggestions.length > 0) {
		lines.push('\n⚠️  SUGESTÕES:');
		result.suggestions.forEach(suggestion => lines.push(`  • ${suggestion}`));
	}
	
	if (result.correctedPrompt && result.correctedPrompt !== result.inputs[0]?.value) {
		lines.push('\n💡 PROMPT SUGERIDO (corrigido):');
		lines.push(`   "${result.correctedPrompt}"`);
	}
	
	return lines.join('\n');
}

/**
 * Valida prompt antes de executar (para uso no orchestrator)
 */
export function validatePromptInputs(prompt: string): {
	isValid: boolean;
	report: string;
	correctedPrompt?: string;
} {
	const result = extractAndValidateInputs(prompt);
	const report = formatValidationReport(result);
	
	return {
		isValid: !result.hasProblems,
		report,
		correctedPrompt: result.correctedPrompt
	};
}
