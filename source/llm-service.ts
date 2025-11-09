/**
 * LLM Service - Serviço de Integração com LLM e YouTube
 * 
 * Responsabilidade Única: Coordenar chamadas ao LLM com integração de ferramentas do YouTube
 * 
 * Este módulo atua como uma camada de serviço que:
 * - Configura cliente OpenAI compatível com diferentes endpoints
 * - Integra ferramenta de busca do YouTube como função do LLM
 * - Gerencia o fluxo de conversação com tool calling
 * 
 * Fluxo de Execução:
 * 1. Carrega configuração LLM (endpoint, API key, modelo)
 * 2. Verifica e usa credenciais Qwen se disponíveis
 * 3. Cria cliente OpenAI com configurações apropriadas
 * 4. Envia mensagem do usuário com prompt de sistema
 * 5. Se LLM solicitar uso de ferramenta YouTube:
 *    a. Executa busca no YouTube
 *    b. Retorna resultados ao LLM
 *    c. LLM gera resposta final com contexto dos vídeos
 * 6. Retorna resposta final do LLM
 * 
 * Lógica de Negócio:
 * - Prioriza credenciais Qwen sobre configuração padrão
 * - Suporta callbacks para rastreamento de execução de ferramentas
 * - Limita resultados do YouTube (top 50 comentários por likes)
 * - Trunca dados para otimizar uso de tokens
 * 
 * Uso:
 * ```typescript
 * import { askLLMWithYouTube } from './llm-service.js';
 * 
 * const response = await askLLMWithYouTube(
 *   "O que as pessoas estão dizendo sobre inteligência artificial?",
 *   (toolName, query) => console.log(`Executando ${toolName}: ${query}`),
 *   (result) => console.log(`Resultado: ${result.totalComments} comentários`)
 * );
 * ```
 */

import OpenAI from 'openai';
import { getConfig } from './llm-config.js';
import { getSystemPrompt } from './prompts/prompt-loader.js';
import { loadQwenCredentials, getValidAccessToken } from './qwen-oauth.js';
import { youtubeToolDefinition, executeYouTubeTool } from './youtube-tool.js';

/**
 * Normaliza URL do endpoint da API
 * 
 * Garante que a URL esteja no formato correto para uso com OpenAI SDK
 * 
 * @param resourceUrl - URL do recurso (pode ser completa ou apenas domínio)
 * @returns URL normalizada terminando em /v1
 */
function getApiEndpoint(resourceUrl?: string): string {
	if (!resourceUrl) {
		return 'https://chat.qwen.ai/api/v1';
	}
	
	const normalizedUrl = resourceUrl.startsWith('http')
		? resourceUrl
		: `https://${resourceUrl}`;
	
	return normalizedUrl.endsWith('/v1')
		? normalizedUrl
		: `${normalizedUrl}/v1`;
}

/**
 * Faz pergunta ao LLM com integração automática do YouTube
 * 
 * Esta função permite fazer perguntas ao LLM que podem resultar em busca
 * automática no YouTube. O LLM decide quando usar a ferramenta de busca.
 * 
 * @param userMessage - Mensagem/pergunta do usuário
 * @param onToolCall - Callback opcional chamado quando ferramenta é executada
 * @param onToolComplete - Callback opcional chamado quando ferramenta completa
 * @returns Resposta final do LLM como string
 * 
 * @throws Propaga erros do LLM ou da execução de ferramentas
 */
export async function askLLMWithYouTube(
	userMessage: string,
	onToolCall?: (toolName: string, query: string) => void,
	onToolComplete?: (result: any) => void
): Promise<string> {
	const config = getConfig();
	
	// Priorizar credenciais Qwen se disponíveis
	const qwenCreds = loadQwenCredentials();
	let endpoint = config.endpoint;
	let apiKey = config.apiKey || 'not-needed';
	
	if (qwenCreds && qwenCreds.access_token) {
		const validToken = await getValidAccessToken();
		if (validToken) {
			apiKey = validToken;
			endpoint = getApiEndpoint(qwenCreds.resource_url);
		}
	}
	
	const openai = new OpenAI({
		baseURL: endpoint,
		apiKey,
	});

	const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
		{
			role: 'system',
			content: getSystemPrompt('youtube_assistant'),
		},
		{
			role: 'user',
			content: userMessage,
		},
	];

	try {
		// Primeira chamada: LLM decide se precisa usar ferramenta
		const response = await openai.chat.completions.create({
			model: config.model,
			messages,
			tools: [youtubeToolDefinition],
			tool_choice: 'auto',
		});

		const assistantMessage = response.choices[0]?.message;

		// Se LLM solicitou uso da ferramenta YouTube
		if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
			const toolCall = assistantMessage.tool_calls[0];
			const func = (toolCall as any).function;
			
			if (func && func.name === 'search_youtube_comments') {
				const args = JSON.parse(func.arguments);
				const query = args.query;

				// Notificar início da execução da ferramenta
				if (onToolCall) {
					onToolCall('YouTube Search', query);
				}

				// Executar busca no YouTube
				const toolResult = await executeYouTubeTool(query);

				// Notificar conclusão da ferramenta
				if (onToolComplete) {
					onToolComplete(toolResult);
				}

				// Adicionar mensagem do assistente com tool call
				messages.push({
					role: 'assistant',
					content: assistantMessage.content || '',
					tool_calls: assistantMessage.tool_calls,
				});

				// Adicionar resultado da ferramenta (otimizado para tokens)
				messages.push({
					role: 'tool',
					content: JSON.stringify({
						success: toolResult.success,
						totalVideos: toolResult.totalVideos,
						totalComments: toolResult.totalComments,
						comments: toolResult.comments
							.sort((a, b) => b.likes - a.likes) // Ordenar por likes
							.slice(0, 50) // Limitar a 50 comentários
							.map(c => ({
								video: c.videoTitle.substring(0, 100),
								author: c.author,
								text: c.comment.substring(0, 500), // Truncar comentários longos
								likes: c.likes,
							})),
					}),
					tool_call_id: toolCall.id,
				});

				// Segunda chamada: LLM gera resposta final com contexto do YouTube
				const finalResponse = await openai.chat.completions.create({
					model: config.model,
					messages,
				});

				return finalResponse.choices[0]?.message?.content || 'No response';
			}
		}

		// Resposta direta sem uso de ferramentas
		return assistantMessage?.content || 'No response';
	} catch (error) {
		throw error;
	}
}
