/**
 * Input Validator - Valida inputs críticos antes de processar
 * 
 * Evita erros como "R$997" → "R$97" ao interpretar valores monetários,
 * paths inválidos, emails malformados, etc.
 */

export interface ValidationResult {
	isValid: boolean;
	value: any;
	errors: string[];
	warnings: string[];
	originalInput: string;
}

export interface ValidationRule {
	type: 'currency' | 'email' | 'url' | 'path' | 'number' | 'date' | 'phone' | 'custom';
	required?: boolean;
	min?: number;
	max?: number;
	pattern?: RegExp;
	customValidator?: (value: string) => boolean;
	errorMessage?: string;
}

/**
 * Valida valor monetário (R$, US$, €, etc.)
 */
export function validateCurrency(input: string): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Remover espaços
	const cleaned = input.trim();
	
	// Padrões comuns: R$997, R$ 997, 997, $997, 997.00, 997,00
	const currencyPatterns = [
		/^R\$\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)$/i,  // R$997 ou R$997,00
		/^\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)$/,          // $997 ou $997.00
		/^€\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)$/,      // €997 ou €997,00
		/^(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)$/           // 997 ou 997,00
	];
	
	let matchedValue: string | null = null;
	let matchedPattern = false;
	
	for (const pattern of currencyPatterns) {
		const match = cleaned.match(pattern);
		if (match) {
			matchedValue = match[1] || match[0];
			matchedPattern = true;
			break;
		}
	}
	
	if (!matchedPattern) {
		errors.push(`Formato de moeda inválido: "${input}". Use formatos como: R$997, $997.00, 997`);
		return {
			isValid: false,
			value: null,
			errors,
			warnings,
			originalInput: input
		};
	}
	
	// Extrair número limpo
	const numberStr = matchedValue!.replace(/[.,]/g, '');
	const numberValue = parseInt(numberStr, 10);
	
	// Detectar possíveis erros comuns
	if (cleaned.match(/^R\d+$/i)) {
		// "R997" sem símbolo $ pode ser "R$997" mal digitado
		warnings.push(`Detectado "${cleaned}" - você quis dizer "R$${numberValue}"?`);
	}
	
	// Validar magnitude (valores muito baixos ou altos)
	if (numberValue < 1) {
		warnings.push(`Valor muito baixo: R$${numberValue}. Confirme se está correto.`);
	}
	
	if (numberValue > 100000 && numberValue < 1000000) {
		warnings.push(`Valor alto: R$${numberValue}. Confirme se não faltam centavos (ex: R$${numberValue}.00).`);
	}
	
	// Formatar valor corretamente
	const formattedValue = new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL'
	}).format(numberValue / 100); // Assumindo centavos
	
	return {
		isValid: true,
		value: {
			raw: numberValue,
			cents: numberValue,
			reais: numberValue / 100,
			formatted: formattedValue,
			symbol: cleaned.match(/^R\$/i) ? 'R$' : cleaned.match(/^\$/) ? '$' : cleaned.match(/^€/) ? '€' : 'R$'
		},
		errors,
		warnings,
		originalInput: input
	};
}

/**
 * Valida email
 */
export function validateEmail(input: string): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	
	if (!emailRegex.test(input)) {
		errors.push(`Email inválido: "${input}"`);
		
		// Sugestões de correção
		if (input.includes(' ')) {
			warnings.push('Email não pode conter espaços');
		}
		if (!input.includes('@')) {
			warnings.push('Email deve conter @');
		}
		if (!input.includes('.')) {
			warnings.push('Email deve conter domínio (ex: @gmail.com)');
		}
		
		return {
			isValid: false,
			value: null,
			errors,
			warnings,
			originalInput: input
		};
	}
	
	// Validações adicionais
	const [localPart, domain] = input.split('@');
	
	if (localPart.length > 64) {
		warnings.push('Parte local do email muito longa (máx 64 caracteres)');
	}
	
	if (domain.length > 255) {
		warnings.push('Domínio muito longo (máx 255 caracteres)');
	}
	
	return {
		isValid: true,
		value: {
			full: input.toLowerCase(),
			localPart: localPart.toLowerCase(),
			domain: domain.toLowerCase()
		},
		errors,
		warnings,
		originalInput: input
	};
}

/**
 * Valida URL
 */
export function validateURL(input: string): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	try {
		const url = new URL(input);
		
		// Validar protocolo
		if (!['http:', 'https:'].includes(url.protocol)) {
			warnings.push(`Protocolo incomum: ${url.protocol}. Use http:// ou https://`);
		}
		
		return {
			isValid: true,
			value: {
				full: url.href,
				protocol: url.protocol,
				host: url.host,
				hostname: url.hostname,
				pathname: url.pathname,
				search: url.search,
				hash: url.hash
			},
			errors,
			warnings,
			originalInput: input
		};
	} catch (error) {
		errors.push(`URL inválida: "${input}"`);
		
		// Tentar adicionar protocolo se faltou
		if (!input.startsWith('http://') && !input.startsWith('https://')) {
			warnings.push(`Tente adicionar https:// no início: https://${input}`);
		}
		
		return {
			isValid: false,
			value: null,
			errors,
			warnings,
			originalInput: input
		};
	}
}

/**
 * Valida path de arquivo/diretório
 */
export function validatePath(input: string): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Caracteres inválidos em paths (Windows)
	const invalidChars = /[<>:"|?*]/;
	
	if (invalidChars.test(input)) {
		errors.push(`Path contém caracteres inválidos: ${input.match(invalidChars)![0]}`);
		return {
			isValid: false,
			value: null,
			errors,
			warnings,
			originalInput: input
		};
	}
	
	// Validar paths absolutos vs relativos
	const isAbsolute = input.startsWith('/') || /^[A-Za-z]:/.test(input);
	
	if (!isAbsolute && input.includes('..')) {
		warnings.push('Path relativo com ".." pode causar problemas de segurança');
	}
	
	return {
		isValid: true,
		value: {
			original: input,
			normalized: input.replace(/\\/g, '/'),
			isAbsolute,
			isRelative: !isAbsolute
		},
		errors,
		warnings,
		originalInput: input
	};
}

/**
 * Valida número
 */
export function validateNumber(input: string, min?: number, max?: number): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Tentar converter
	const num = Number(input);
	
	if (isNaN(num)) {
		errors.push(`Não é um número válido: "${input}"`);
		return {
			isValid: false,
			value: null,
			errors,
			warnings,
			originalInput: input
		};
	}
	
	// Validar range
	if (min !== undefined && num < min) {
		errors.push(`Número muito baixo: ${num} (mínimo: ${min})`);
	}
	
	if (max !== undefined && num > max) {
		errors.push(`Número muito alto: ${num} (máximo: ${max})`);
	}
	
	return {
		isValid: errors.length === 0,
		value: {
			number: num,
			integer: Math.floor(num),
			decimal: num % 1,
			isInteger: Number.isInteger(num),
			isPositive: num > 0,
			isNegative: num < 0
		},
		errors,
		warnings,
		originalInput: input
	};
}

/**
 * Validador genérico com múltiplas regras
 */
export function validate(input: string, rules: ValidationRule[]): ValidationResult {
	const allErrors: string[] = [];
	const allWarnings: string[] = [];
	let finalValue: any = input;
	
	for (const rule of rules) {
		let result: ValidationResult;
		
		switch (rule.type) {
			case 'currency':
				result = validateCurrency(input);
				break;
			case 'email':
				result = validateEmail(input);
				break;
			case 'url':
				result = validateURL(input);
				break;
			case 'path':
				result = validatePath(input);
				break;
			case 'number':
				result = validateNumber(input, rule.min, rule.max);
				break;
			case 'custom':
				if (rule.customValidator) {
					const isValid = rule.customValidator(input);
					result = {
						isValid,
						value: isValid ? input : null,
						errors: isValid ? [] : [rule.errorMessage || 'Validação customizada falhou'],
						warnings: [],
						originalInput: input
					};
				} else {
					result = {
						isValid: true,
						value: input,
						errors: [],
						warnings: [],
						originalInput: input
					};
				}
				break;
			default:
				result = {
					isValid: true,
					value: input,
					errors: [],
					warnings: [],
					originalInput: input
				};
		}
		
		allErrors.push(...result.errors);
		allWarnings.push(...result.warnings);
		
		if (result.isValid && result.value !== null) {
			finalValue = result.value;
		}
		
		// Se uma regra falhar e for required, retornar imediatamente
		if (!result.isValid && rule.required) {
			return {
				isValid: false,
				value: null,
				errors: allErrors,
				warnings: allWarnings,
				originalInput: input
			};
		}
	}
	
	return {
		isValid: allErrors.length === 0,
		value: finalValue,
		errors: allErrors,
		warnings: allWarnings,
		originalInput: input
	};
}

/**
 * Helper para confirmar valores com usuário se houver warnings
 */
export function formatValidationMessage(result: ValidationResult): string {
	const parts: string[] = [];
	
	if (!result.isValid) {
		parts.push('❌ Validação falhou:');
		result.errors.forEach(err => parts.push(`  • ${err}`));
	}
	
	if (result.warnings.length > 0) {
		parts.push('⚠️  Avisos:');
		result.warnings.forEach(warn => parts.push(`  • ${warn}`));
	}
	
	if (result.isValid && typeof result.value === 'object' && result.value !== null) {
		parts.push('✅ Valor validado:');
		if ('formatted' in result.value) {
			parts.push(`  • ${result.value.formatted}`);
		} else if ('full' in result.value) {
			parts.push(`  • ${result.value.full}`);
		}
	}
	
	return parts.join('\n');
}
