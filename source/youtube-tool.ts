
import { getConfig } from './llm-config.js';
// import type { ScraperResult } from './types.js'; // Removido, pois ScraperResult estava em types.js, mas a função scrapeYouTubeData não existe mais

export interface YouTubeToolResult {
	success: boolean;
	query: string;
	totalVideos: number;
	totalComments: number;
	comments: Array<{
		videoTitle: string;
		videoUrl: string;
		comment: string;
		author: string;
		likes: number;
	}>;
	videos: Array<{
		videoTitle: string;
		videoUrl: string;
		videoId: string;
		comments: Array<{
			comment: string;
			author: string;
			likes: number;
		}>;
		transcript?: {
			language: string;
			fullText: string;
			segmentsCount: number;
		};
	}>;
	error?: string;
}

export async function executeYouTubeTool(query: string): Promise<YouTubeToolResult> {
	try {
			// A função scrapeYouTubeData foi removida junto com o scraper.ts.
			// Para resolver o gargalo, vamos retornar um erro claro para a LLM.
			return {
				success: false,
				query,
				totalVideos: 0,
				totalComments: 0,
				comments: [],
				videos: [],
				error: 'A ferramenta de pesquisa do YouTube foi desativada devido a problemas de dependência (scraper.ts).',
			};
		

		} catch (error) {
			return {
				success: false,
				query,
				totalVideos: 0,
				totalComments: 0,
				comments: [],
				videos: [],
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
}

// Tool definition for OpenAI function calling
export const youtubeToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'search_youtube_comments',
		description: 'Search YouTube videos and extract comments AND transcripts (when available). Use this to analyze what people are saying about a specific topic on YouTube and get the full video transcript. Returns video titles, URLs, comments, and transcripts.',
		parameters: {
			type: 'object',
			properties: {
				query: {
					type: 'string',
					description: 'The search query for YouTube videos (e.g., "weight loss tips", "programming tutorials")',
				},
			},
			required: ['query'],
		},
	},
};
