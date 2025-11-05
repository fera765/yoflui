/**
 * CONDITION TOOL - Fluxo condicional para automações
 * Direciona o fluxo de automação baseado em condições
 */

export const conditionToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'condition',
		description: 'Avalia uma condição e retorna o próximo fluxo de automação a seguir. Funciona como um switch/roteador de fluxos baseado em valores.',
		parameters: {
			type: 'object',
			properties: {
				value: {
					type: 'string',
					description: 'Valor a ser testado nas condições'
				},
				conditions: {
					type: 'array',
					description: 'Lista de condições no formato [{pattern: "VALOR", nextFlow: "fluxo-id"}]',
					items: {
						type: 'object',
						properties: {
							pattern: {
								type: 'string',
								description: 'Padrão a ser comparado (suporta exact match ou regex)'
							},
							nextFlow: {
								type: 'string',
								description: 'ID do próximo fluxo/automação a executar'
							},
							matchType: {
								type: 'string',
								enum: ['exact', 'contains', 'regex', 'startsWith', 'endsWith'],
								description: 'Tipo de comparação (padrão: exact)'
							}
						},
						required: ['pattern', 'nextFlow']
					}
				},
				defaultFlow: {
					type: 'string',
					description: 'Fluxo padrão caso nenhuma condição seja atendida'
				},
				caseSensitive: {
					type: 'boolean',
					description: 'Se a comparação deve ser case-sensitive (padrão: false)'
				}
			},
			required: ['value', 'conditions']
		}
	}
};

interface Condition {
	pattern: string;
	nextFlow: string;
	matchType?: 'exact' | 'contains' | 'regex' | 'startsWith' | 'endsWith';
}

interface ConditionArgs {
	value: string;
	conditions: Condition[];
	defaultFlow?: string;
	caseSensitive?: boolean;
}

/**
 * Executa avaliação de condição e retorna próximo fluxo
 */
export async function executeConditionTool(args: ConditionArgs): Promise<string> {
	try {
		const { value, conditions, defaultFlow, caseSensitive = false } = args;

		// Normalizar valor se não for case-sensitive
		const normalizedValue = caseSensitive ? value : value.toLowerCase();

		// Avaliar cada condição
		for (const condition of conditions) {
			const normalizedPattern = caseSensitive 
				? condition.pattern 
				: condition.pattern.toLowerCase();
			
			const matchType = condition.matchType || 'exact';
			let isMatch = false;

			switch (matchType) {
				case 'exact':
					isMatch = normalizedValue === normalizedPattern;
					break;
				
				case 'contains':
					isMatch = normalizedValue.includes(normalizedPattern);
					break;
				
				case 'startsWith':
					isMatch = normalizedValue.startsWith(normalizedPattern);
					break;
				
				case 'endsWith':
					isMatch = normalizedValue.endsWith(normalizedPattern);
					break;
				
				case 'regex':
					try {
						const regex = new RegExp(condition.pattern, caseSensitive ? '' : 'i');
						isMatch = regex.test(value);
					} catch (error) {
						return JSON.stringify({
							success: false,
							error: `Invalid regex pattern: ${condition.pattern}`,
							matchedFlow: defaultFlow || null
						});
					}
					break;
			}

			// Se encontrou match, retornar o fluxo
			if (isMatch) {
				return JSON.stringify({
					success: true,
					matchedCondition: condition.pattern,
					matchedFlow: condition.nextFlow,
					matchType,
					value: value
				});
			}
		}

		// Nenhuma condição atendida, usar fluxo padrão
		if (defaultFlow) {
			return JSON.stringify({
				success: true,
				matchedCondition: 'default',
				matchedFlow: defaultFlow,
				matchType: 'default',
				value: value
			});
		}

		// Sem fluxo padrão e nenhuma condição atendida
		return JSON.stringify({
			success: false,
			error: 'No condition matched and no default flow provided',
			value: value,
			testedConditions: conditions.map(c => c.pattern)
		});

	} catch (error) {
		return JSON.stringify({
			success: false,
			error: error instanceof Error ? error.message : 'Condition evaluation failed'
		});
	}
}
