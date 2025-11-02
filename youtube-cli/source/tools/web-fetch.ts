import { withTimeout, TIMEOUT_CONFIG } from '../config/timeout-config.js';

export const webFetchToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'web_fetch',
		description: 'Fetch content from a URL',
		parameters: {
			type: 'object',
			properties: {
				url: { type: 'string', description: 'URL to fetch' },
			},
			required: ['url'],
		},
	},
};

export async function executeWebFetchTool(url: string): Promise<string> {
	try {
		// Apply timeout to HTTP request
		const response = await withTimeout(
			fetch(url),
			TIMEOUT_CONFIG.HTTP_REQUEST,
			`HTTP fetch ${url}`
		);
		
		if (!response.ok) {
			return `Error: HTTP ${response.status}`;
		}
		
		const text = await response.text();
		return text.substring(0, 5000); // Limit to 5000 chars
	} catch (error) {
		return `Error: ${error instanceof Error ? error.message : 'Failed to fetch'}`;
	}
}
