import OpenAI from 'openai';
import { getConfig } from './llm-config.js';
import { executeYouTubeTool, youtubeToolDefinition } from './youtube-tool.js';
import { loadQwenCredentials, getValidAccessToken } from './qwen-oauth.js';

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
	toolCall?: {
		name: string;
		query: string;
		result?: any;
	};
}

/**
 * Get proper API endpoint from resource_url
 */
function getApiEndpoint(resourceUrl?: string): string {
	if (!resourceUrl) {
		return 'https://chat.qwen.ai/api/v1';
	}
	
	// Normalize URL: add protocol if missing, ensure /v1 suffix
	const normalizedUrl = resourceUrl.startsWith('http')
		? resourceUrl
		: `https://${resourceUrl}`;
	
	return normalizedUrl.endsWith('/v1')
		? normalizedUrl
		: `${normalizedUrl}/v1`;
}

export async function sendMessage(
	userMessage: string,
	onToolCall?: (toolName: string, query: string) => void,
	onToolComplete?: (result: any) => void
): Promise<string> {
	const config = getConfig();
	
	// Check if using Qwen OAuth
	const qwenCreds = loadQwenCredentials();
	let endpoint = config.endpoint;
	let apiKey = config.apiKey || 'not-needed';
	
	if (qwenCreds && qwenCreds.access_token) {
		// Use Qwen OAuth credentials
		const validToken = await getValidAccessToken();
		if (validToken) {
			apiKey = validToken;
			endpoint = getApiEndpoint(qwenCreds.resource_url);
			console.log('[DEBUG] Using Qwen OAuth:', {
				endpoint,
				tokenLength: validToken.length,
			});
		}
	}
	
	const openai = new OpenAI({
		baseURL: endpoint,
		apiKey,
	});

	const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
		{
			role: 'system',
			content: 'You are a helpful AI assistant with access to YouTube comment data. When users ask about topics, trends, opinions, or pain points, use the search_youtube_comments tool to gather real user feedback from YouTube. Analyze the comments to provide insights.',
		},
		{
			role: 'user',
			content: userMessage,
		},
	];

	try {
		// First API call with tool
		const response = await openai.chat.completions.create({
			model: config.model,
			messages,
			tools: [youtubeToolDefinition],
			tool_choice: 'auto',
		});

		const assistantMessage = response.choices[0]?.message;
		
		// Debug logging
		console.log('[DEBUG] LLM Response:', {
			hasToolCalls: !!assistantMessage?.tool_calls,
			toolCallsLength: assistantMessage?.tool_calls?.length || 0,
			content: assistantMessage?.content?.substring(0, 100),
		});

		// Check if tool was called
		if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
			const toolCall = assistantMessage.tool_calls[0];
			const func = (toolCall as any).function;
			
			if (func && func.name === 'search_youtube_comments') {
				const args = JSON.parse(func.arguments);
				const query = args.query;

				// Notify about tool call
				if (onToolCall) {
					onToolCall('YouTube Search', query);
				}

				// Execute YouTube tool
				const toolResult = await executeYouTubeTool(query);

				// Notify tool complete
				if (onToolComplete) {
					onToolComplete(toolResult);
				}

				// Add assistant message with tool call
				messages.push({
					role: 'assistant',
					content: assistantMessage.content || '',
					tool_calls: assistantMessage.tool_calls,
				});

				// Add tool response
				messages.push({
					role: 'tool',
					content: JSON.stringify({
						success: toolResult.success,
						totalVideos: toolResult.totalVideos,
						totalComments: toolResult.totalComments,
						// Send top 50 comments (sorted by likes)
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

				// Second API call with tool results
				console.log('[DEBUG] Sending tool results to LLM...');
				const finalResponse = await openai.chat.completions.create({
					model: config.model,
					messages,
				});

				console.log('[DEBUG] Final response received:', {
					length: finalResponse.choices[0]?.message?.content?.length || 0
				});

				return finalResponse.choices[0]?.message?.content || 'No response';
			}
		}

		// No tool call needed
		return assistantMessage?.content || 'No response';
	} catch (error) {
		console.error('LLM Error:', error);
		throw error;
	}
}
