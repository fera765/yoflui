import OpenAI from 'openai';
import { getConfig } from './llm-config.js';
import { getSystemPrompt } from './prompts/prompt-loader.js';
import { loadQwenCredentials, getValidAccessToken } from './qwen-oauth.js';
import { youtubeToolDefinition, executeYouTubeTool } from './youtube-tool.js';

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

export async function askLLMWithYouTube(
	userMessage: string,
	onToolCall?: (toolName: string, query: string) => void,
	onToolComplete?: (result: any) => void
): Promise<string> {
	const config = getConfig();
	
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
		const response = await openai.chat.completions.create({
			model: config.model,
			messages,
			tools: [youtubeToolDefinition],
			tool_choice: 'auto',
		});

		const assistantMessage = response.choices[0]?.message;

		if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
			const toolCall = assistantMessage.tool_calls[0];
			const func = (toolCall as any).function;
			
			if (func && func.name === 'search_youtube_comments') {
				const args = JSON.parse(func.arguments);
				const query = args.query;

				if (onToolCall) {
					onToolCall('YouTube Search', query);
				}

				const toolResult = await executeYouTubeTool(query);

				if (onToolComplete) {
					onToolComplete(toolResult);
				}

				messages.push({
					role: 'assistant',
					content: assistantMessage.content || '',
					tool_calls: assistantMessage.tool_calls,
				});

				messages.push({
					role: 'tool',
					content: JSON.stringify({
						success: toolResult.success,
						totalVideos: toolResult.totalVideos,
						totalComments: toolResult.totalComments,
						comments: toolResult.comments
							.sort((a, b) => b.likes - a.likes)
							.slice(0, 50)
							.map(c => ({
								video: c.videoTitle.substring(0, 100),
								author: c.author,
								text: c.comment.substring(0, 500),
								likes: c.likes,
							})),
					}),
					tool_call_id: toolCall.id,
				});

				const finalResponse = await openai.chat.completions.create({
					model: config.model,
					messages,
				});

				return finalResponse.choices[0]?.message?.content || 'No response';
			}
		}

		return assistantMessage?.content || 'No response';
	} catch (error) {
		throw error;
	}
}
