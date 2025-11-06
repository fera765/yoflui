/**
 * LLM Configuration Manager
 * 
 * Responsabilidade Única: Gerenciar configurações globais do sistema LLM
 * 
 * Este módulo centraliza todas as configurações relacionadas ao LLM:
 * - Endpoint da API
 * - Chave de API
 * - Modelo a ser utilizado
 * - Limites de vídeos e comentários para scraping do YouTube
 * 
 * Fluxo de Dados:
 * 1. Configuração inicial com valores padrão
 * 2. Atualização dinâmica via setConfig()
 * 3. Leitura via getConfig() que retorna cópia para evitar mutações
 * 
 * Uso:
 * ```typescript
 * import { getConfig, setConfig } from './llm-config.js';
 * 
 * // Ler configuração atual
 * const config = getConfig();
 * 
 * // Atualizar configuração
 * setConfig({ model: 'gpt-4', endpoint: 'https://api.example.com/v1' });
 * ```
 */

export interface LLMConfig {
	endpoint: string;
	apiKey: string;
	model: string;
	maxVideos: number;
	maxCommentsPerVideo: number;
}

/**
 * Configuração padrão do sistema
 * 
 * Valores iniciais que serão utilizados caso nenhuma configuração
 * seja fornecida via arquivo config.json ou variáveis de ambiente
 */
let config: LLMConfig = {
	endpoint: 'https://api.llm7.io/v1',
	apiKey: '',
	model: 'qwen3-coder-plus',
	maxVideos: 7,
	maxCommentsPerVideo: 10,
};

/**
 * Obtém uma cópia da configuração atual
 * 
 * Retorna uma cópia para evitar mutações acidentais da configuração global
 * 
 * @returns Cópia imutável da configuração atual
 */
export function getConfig(): LLMConfig {
	return { ...config };
}

/**
 * Atualiza a configuração global com novos valores
 * 
 * Permite atualização parcial - apenas os campos fornecidos serão atualizados
 * 
 * @param newConfig - Objeto parcial com os campos a serem atualizados
 * 
 * Exemplo:
 * ```typescript
 * setConfig({ model: 'gpt-4' }); // Apenas atualiza o modelo
 * ```
 */
export function setConfig(newConfig: Partial<LLMConfig>): void {
	config = { ...config, ...newConfig };
}

/**
 * Busca modelos disponíveis em um endpoint específico
 * 
 * Esta função faz uma requisição HTTP para o endpoint `/models` e tenta
 * extrair a lista de modelos disponíveis. Suporta diferentes formatos de resposta:
 * - Formato direto: Array de objetos [{id: "model-name", ...}]
 * - Formato OpenAI: {object: "list", data: [{id: {...}, ...}]}
 * 
 * Lógica de Negócio:
 * 1. Tenta fazer requisição para /models
 * 2. Parseia a resposta considerando diferentes formatos
 * 3. Extrai apenas modelos que suportam tools (quando aplicável)
 * 4. Retorna lista de strings com nomes dos modelos
 * 
 * @param endpoint - URL base do endpoint da API
 * @returns Array de strings com nomes dos modelos disponíveis
 * 
 * @throws Não lança exceções - retorna lista padrão em caso de erro
 */
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
		// Fallback para lista padrão em caso de erro
		return ['openai', 'deepseek', 'gemini', 'mistral'];
	}
}
