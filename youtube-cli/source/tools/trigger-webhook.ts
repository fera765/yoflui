/**
 * TRIGGER WEBHOOK TOOL - Envia requisições HTTP para APIs externas
 * Permite enviar dados para webhooks/APIs com total flexibilidade
 */

export const triggerWebhookToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'trigger_webhook',
		description: 'Envia uma requisição HTTP (GET, POST, PUT, DELETE, PATCH) para uma URL externa com payload customizável. Ideal para integrar com APIs, webhooks e serviços externos.',
		parameters: {
			type: 'object',
			properties: {
				url: {
					type: 'string',
					description: 'URL completa do endpoint (incluindo https://)'
				},
				method: {
					type: 'string',
					enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
					description: 'Método HTTP da requisição'
				},
				payload: {
					type: 'object',
					description: 'Dados a serem enviados no corpo da requisição (body)'
				},
				headers: {
					type: 'object',
					description: 'Headers HTTP customizados (ex: {"Authorization": "Bearer token", "Content-Type": "application/json"})'
				},
				queryParams: {
					type: 'object',
					description: 'Parâmetros de query string (ex: {"page": "1", "limit": "10"} vira ?page=1&limit=10)'
				},
				timeout: {
					type: 'number',
					description: 'Timeout em milissegundos (padrão: 30000)'
				},
				retryOnFailure: {
					type: 'boolean',
					description: 'Tentar novamente em caso de falha (padrão: false)'
				},
				validateStatus: {
					type: 'boolean',
					description: 'Validar se status code é 2xx (padrão: true)'
				}
			},
			required: ['url', 'method']
		}
	}
};

interface TriggerWebhookArgs {
	url: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	payload?: Record<string, any>;
	headers?: Record<string, string>;
	queryParams?: Record<string, string>;
	timeout?: number;
	retryOnFailure?: boolean;
	validateStatus?: boolean;
}

/**
 * Executa requisição HTTP para webhook/API externa
 */
export async function executeTriggerWebhookTool(args: TriggerWebhookArgs): Promise<string> {
	const {
		url,
		method,
		payload = {},
		headers = {},
		queryParams = {},
		timeout = 30000,
		retryOnFailure = false,
		validateStatus = true
	} = args;

	try {
		// Validar URL
		let finalUrl: URL;
		try {
			finalUrl = new URL(url);
		} catch (error) {
			return JSON.stringify({
				success: false,
				error: 'Invalid URL format. URL must include protocol (https://)',
				url
			});
		}

		// Adicionar query params
		if (queryParams && Object.keys(queryParams).length > 0) {
			Object.entries(queryParams).forEach(([key, value]) => {
				finalUrl.searchParams.append(key, String(value));
			});
		}

		// Preparar headers padrão
		const defaultHeaders: Record<string, string> = {
			'Content-Type': 'application/json',
			'User-Agent': 'FLUI-Automation/1.0',
			...headers
		};

		// Preparar opções da requisição
		const fetchOptions: RequestInit = {
			method,
			headers: defaultHeaders,
			signal: AbortSignal.timeout(timeout)
		};

		// Adicionar body se não for GET
		if (method !== 'GET' && payload && Object.keys(payload).length > 0) {
			fetchOptions.body = JSON.stringify(payload);
		}

		// Executar requisição
		const startTime = Date.now();
		let response: Response;

		const executeRequest = async () => {
			return await fetch(finalUrl.toString(), fetchOptions);
		};

		// Executar com retry se habilitado
		if (retryOnFailure) {
			let attempts = 0;
			const maxAttempts = 3;
			
			while (attempts < maxAttempts) {
				attempts++;
				try {
					response = await executeRequest();
					if (response.ok || !validateStatus) {
						break;
					}
					if (attempts < maxAttempts) {
						await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
					}
				} catch (error) {
					if (attempts === maxAttempts) {
						throw error;
					}
					await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
				}
			}
		} else {
			response = await executeRequest();
		}

		const executionTime = Date.now() - startTime;

		// Ler resposta
		let responseData: any;
		const contentType = response.headers.get('content-type');
		
		if (contentType?.includes('application/json')) {
			try {
				responseData = await response.json();
			} catch {
				responseData = await response.text();
			}
		} else {
			responseData = await response.text();
		}

		// Validar status se habilitado
		if (validateStatus && !response.ok) {
			return JSON.stringify({
				success: false,
				error: `HTTP Error: ${response.status} ${response.statusText}`,
				statusCode: response.status,
				statusText: response.statusText,
				responseData,
				executionTime,
				url: finalUrl.toString(),
				method
			});
		}

		// Sucesso
		return JSON.stringify({
			success: true,
			statusCode: response.status,
			statusText: response.statusText,
			responseData,
			executionTime,
			url: finalUrl.toString(),
			method,
			headers: Object.fromEntries(response.headers.entries())
		});

	} catch (error) {
		// Tratar erros
		let errorMessage = 'Unknown error';
		let errorType = 'UNKNOWN';

		if (error instanceof Error) {
			errorMessage = error.message;
			
			if (error.name === 'AbortError' || errorMessage.includes('timeout')) {
				errorType = 'TIMEOUT';
				errorMessage = `Request timeout after ${timeout}ms`;
			} else if (errorMessage.includes('fetch')) {
				errorType = 'NETWORK';
			}
		}

		return JSON.stringify({
			success: false,
			error: errorMessage,
			errorType,
			url,
			method
		});
	}
}
