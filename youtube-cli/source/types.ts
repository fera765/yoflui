import { z } from 'zod';

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
});

export const ScraperResultSchema = z.object({
	videos: z.array(VideoWithCommentsSchema).min(1).max(10),
	query: z.string(),
	scrapedAt: z.string(),
});

// TypeScript types derived from Zod schemas
export type Comment = z.infer<typeof CommentSchema>;
export type Video = z.infer<typeof VideoSchema>;
export type VideoWithComments = z.infer<typeof VideoWithCommentsSchema>;
export type ScraperResult = z.infer<typeof ScraperResultSchema>;
