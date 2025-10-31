export interface LLMConfig {
	endpoint: string;
	apiKey: string;
	model: string;
}

let config: LLMConfig = {
	endpoint: 'https://api.llm7.io/v1',
	apiKey: '',
	model: 'gpt-4.1-nano-2025-04-14',
};

export function getConfig(): LLMConfig {
	return { ...config };
}

export function setConfig(newConfig: Partial<LLMConfig>): void {
	config = { ...config, ...newConfig };
}

export async function fetchAvailableModels(endpoint: string): Promise<string[]> {
	try {
		const modelsUrl = endpoint.endsWith('/') ? `${endpoint}models` : `${endpoint}/models`;
		const response = await fetch(modelsUrl);
		const data = await response.json();
		
		if (Array.isArray(data)) {
			return data.map((model: any) => model.id);
		}
		
		return [];
	} catch (error) {
		console.error('Failed to fetch models:', error);
		return [];
	}
}
