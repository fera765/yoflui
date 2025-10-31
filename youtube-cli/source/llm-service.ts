import OpenAI from 'openai';
import { getConfig } from './llm-config.js';
import { executeYouTubeTool } from './youtube-tool.js';

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
 * Detect if user intent requires YouTube search
 * Since llm7.io doesn't support function calling, we use heuristics
 */
function detectYouTubeIntent(message: string): string | null {
	const lower = message.toLowerCase();
	
	// Direct YouTube search intent
	if (lower.includes('youtube') && (lower.includes('search') || lower.includes('busca') || lower.includes('pesquise'))) {
		// Extract only the topic, not the whole command
		const match = message.match(/(?:search|busca|pesquise)\s+(?:youtube\s+)?(?:for|sobre|por)?\s+(.+?)(?:\s+and|\se|$)/i);
		if (match) return match[1].trim().replace(/^["']|["']$/g, '');
	}
	
	// Phrases that indicate needing YouTube data
	const needsYouTube = [
		/what are (?:people|users) saying about (.+)/i,
		/analyze.*comments.*about (.+)/i,
		/(?:find|search|get).*(?:comments|videos|opinions).*about (.+)/i,
		/(o que|quais s?o).+(?:dizendo|falando|comentando).+sobre (.+)/i,
		/pesquise.*sobre (.+?)(?:\se|$)/i,
		/busque.*sobre (.+?)(?:\se|$)/i,
		/analise.*sobre (.+?)(?:\se|$)/i,
		/(?:pain points?|dores|problemas).*(?:in|no|do) (.+?) (?:niche|nicho)/i,
	];
	
	for (const pattern of needsYouTube) {
		const match = message.match(pattern);
		if (match) {
			const query = match[match.length - 1].trim();
			// Clean up common trailing words
			return query.replace(/(?:\se suas dores|\sand .*problems?|!|\?)$/i, '').trim();
		}
	}
	
	return null;
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

	try {
		// Detect YouTube intent (since llm7.io doesn't support function calling)
		const youtubeQuery = detectYouTubeIntent(userMessage);
		
		if (youtubeQuery) {
			// Manual tool execution
			if (onToolCall) {
				onToolCall('YouTube Search', youtubeQuery);
			}

			// Execute YouTube tool
			const toolResult = await executeYouTubeTool(youtubeQuery);

			// Notify tool complete
			if (onToolComplete) {
				onToolComplete(toolResult);
			}

			// Create enriched prompt with YouTube data
			const systemPrompt = `You are an AI analyst. The user asked about "${youtubeQuery}" and I've gathered ${toolResult.totalComments} real comments from ${toolResult.totalVideos} YouTube videos.

Your task: Analyze these comments and provide insights about:
- Main themes and patterns
- Common pain points or problems mentioned
- User sentiment and opinions
- Key takeaways

Be specific and reference actual comment content when relevant.`;

			// Take top 20 most-liked comments to reduce token usage
			const topComments = toolResult.comments
				.sort((a, b) => b.likes - a.likes)
				.slice(0, 20)
				.map(c => {
					// Clean comment text to avoid API errors
					const cleanText = c.comment
						.replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
						.substring(0, 300); // Limit comment length
					return `? [${c.videoTitle.substring(0, 50)}] ${c.author}: "${cleanText}" (${c.likes} likes)`;
				})
				.join('\n\n');
			
			const commentsSample = topComments;

			const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
				{
					role: 'system',
					content: systemPrompt,
				},
				{
					role: 'user',
					content: `Here are the YouTube comments:\n\n${commentsSample}\n\nPlease analyze these comments and answer: ${userMessage}`,
				},
			];

			const response = await openai.chat.completions.create({
				model: config.model,
				messages,
			});

			return response.choices[0]?.message?.content || 'No response generated';
		}

		// No YouTube intent detected - normal chat
		const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
			{
				role: 'system',
				content: 'You are a helpful AI assistant. Answer questions clearly and concisely.',
			},
			{
				role: 'user',
				content: userMessage,
			},
		];

		const response = await openai.chat.completions.create({
			model: config.model,
			messages,
		});

		return response.choices[0]?.message?.content || 'No response';
	} catch (error) {
		console.error('LLM Error:', error);
		throw error;
	}
}
