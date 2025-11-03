import { scrapeYouTubeData } from './scraper.js';
import { getConfig } from './llm-config.js';
import type { ScraperResult } from './types.js';

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
		const config = getConfig();
		const result: ScraperResult = await scrapeYouTubeData(
			query,
			config.maxVideos,
			config.maxCommentsPerVideo
		);
		
		// Flatten all comments with video context
		const allComments = result.videos.flatMap((videoData) =>
			videoData.comments.map((comment) => ({
				videoTitle: videoData.video.title,
				videoUrl: videoData.video.url,
				comment: comment.text,
				author: comment.author,
				likes: comment.likes || 0,
			}))
		);

		// Format videos with transcript info
		const videosWithData = result.videos.map((videoData) => ({
			videoTitle: videoData.video.title,
			videoUrl: videoData.video.url,
			videoId: videoData.video.id,
			comments: videoData.comments.map((comment) => ({
				comment: comment.text,
				author: comment.author,
				likes: comment.likes || 0,
			})),
			transcript: videoData.transcript ? {
				language: videoData.transcript.language,
				fullText: videoData.transcript.fullText,
				segmentsCount: videoData.transcript.segments.length,
			} : undefined,
		}));

		return {
			success: true,
			query,
			totalVideos: result.videos.length,
			totalComments: allComments.length,
			comments: allComments,
			videos: videosWithData,
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
