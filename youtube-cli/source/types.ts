import { z } from 'zod';

// Transcript schema
export const TranscriptSegmentSchema = z.object({
	text: z.string(),
	start: z.number(),
	duration: z.number(),
});

export const TranscriptSchema = z.object({
	language: z.string(),
	segments: z.array(TranscriptSegmentSchema),
	fullText: z.string(),
}).nullable().optional();

// Zod schemas for validation
export const CommentSchema = z.object({
	author: z.string(),
	text: z.string(),
	likes: z.number().optional(),
	publishedAt: z.string().optional(),
});

export const VideoSchema = z.object({
	id: z.string(),
	title: z.string(),
	url: z.string().url(),
	views: z.string().optional(),
	uploadedAt: z.string().optional(),
});

export const VideoWithCommentsSchema = z.object({
	video: VideoSchema,
	comments: z.array(CommentSchema).min(1).max(500),
	transcript: TranscriptSchema, // Add transcript support
});

export const ScraperResultSchema = z.object({
	videos: z.array(VideoWithCommentsSchema).min(1).max(10),
	query: z.string(),
	scrapedAt: z.string(),
});

// TypeScript types derived from Zod schemas
export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;
export type Transcript = z.infer<typeof TranscriptSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type Video = z.infer<typeof VideoSchema>;
export type VideoWithComments = z.infer<typeof VideoWithCommentsSchema>;
export type ScraperResult = z.infer<typeof ScraperResultSchema>;

// Storage type for scraped data
export interface ScrapedSession {
	query: string;
	scrapedAt: string;
	totalVideos: number;
	totalComments: number;
	data: VideoWithComments[];
}
