export interface LLMConfig {
	endpoint: string;
	apiKey: string;
	model: string;
	maxVideos: number;
	maxCommentsPerVideo: number;
}

let config: LLMConfig = {
	endpoint: 'https://api.llm7.io/v1',
	apiKey: '',
	model: 'qwen3-coder-plus',
	maxVideos: 7,
	maxCommentsPerVideo: 10,
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
		
		if (!response.ok) {
			throw new Error(`Failed to fetch models: ${response.status}`);
		}
		
		const data: any = await response.json();
		
		// Handle both formats:
		// 1. llm7.io: [{id: "string", ...}]
		// 2. local endpoint: {object: "list", data: [{id: string | object, ...}]}
		const modelsList = Array.isArray(data) ? data : (data.data || []);
		
		return modelsList
			.map((model: any) => {
				// Handle both string and object id formats
				if (typeof model.id === 'string') {
					return model.id;
				} else if (typeof model.id === 'object' && model.id.name) {
					// Local endpoint format - only return models with tool support
					return model.id.tools ? model.id.name : null;
				}
				return null;
			})
			.filter((id: string | null): id is string => id !== null);
	} catch (error) {
		console.error('Error fetching models:', error);
		return ['openai', 'deepseek', 'gemini', 'mistral']; // Fallback
	}
}
