import OpenAI from 'openai';
import { getConfig } from './llm-config.js';
import { executeYouTubeTool, youtubeToolDefinition } from './youtube-tool.js';

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
	toolCall?: {
		name: string;
		query: string;
		result?: any;
	};
}

export async function sendMessage(
	userMessage: string,
	onToolCall?: (toolName: string, query: string) => void,
	onToolComplete?: (result: any) => void
): Promise<string> {
	const config = getConfig();
	
	const openai = new OpenAI({
		baseURL: config.endpoint,
		apiKey: config.apiKey || 'not-needed',
	});

	const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
		{
			role: 'system',
			content: 'You are a helpful AI assistant with access to YouTube comment data. When users ask about topics, trends, or opinions, use the search_youtube_comments tool to gather real user feedback from YouTube comments. Analyze the comments to provide insights, identify patterns, pain points, and common themes.',
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
						// Send top 100 comments to avoid token limits
						comments: toolResult.comments.slice(0, 100).map(c => ({
							video: c.videoTitle,
							author: c.author,
							text: c.comment,
							likes: c.likes,
						})),
					}),
					tool_call_id: toolCall.id,
				});

				// Second API call with tool results
				const finalResponse = await openai.chat.completions.create({
					model: config.model,
					messages,
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
