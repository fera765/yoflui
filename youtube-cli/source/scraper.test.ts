/**
 * Integration tests for YouTube scraper
 * These tests hit the real YouTube website - no mocks!
 */

import { describe, it, expect } from 'vitest';
import {
	searchVideos,
	fetchVideoComments,
	scrapeYouTubeData,
} from './scraper.js';
import { VideoSchema, CommentSchema, ScraperResultSchema } from './types.js';

describe('YouTube Scraper - Real Tests', () => {
	describe('searchVideos', () => {
		it('should throw error for empty query', async () => {
			await expect(searchVideos('')).rejects.toThrow('Query cannot be empty');
		});

		it('should return array of videos for valid query', async () => {
			const results = await searchVideos('javascript tutorial');
			
			expect(results).toBeDefined();
			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBeGreaterThan(0);
			expect(results.length).toBeLessThanOrEqual(10);
			
			// Check first result has expected properties
			const firstResult = results[0];
			expect(firstResult).toHaveProperty('id');
			expect(firstResult).toHaveProperty('title');
			expect(typeof firstResult.id).toBe('string');
			expect(typeof firstResult.title).toBe('string');
		}, 30000); // 30 second timeout for real API call
	});

	describe('fetchVideoComments', () => {
		it('should throw error for empty video ID', async () => {
			await expect(fetchVideoComments('')).rejects.toThrow(
				'Video ID cannot be empty'
			);
		});

		it('should return array of comments for valid video ID', async () => {
			// Using a well-known video ID (YouTube's first video)
			const comments = await fetchVideoComments('jNQXAC9IVRw');
			
			expect(comments).toBeDefined();
			expect(Array.isArray(comments)).toBe(true);
			
			if (comments.length > 0) {
				expect(comments.length).toBeGreaterThanOrEqual(200);
				expect(comments.length).toBeLessThanOrEqual(500);
			}
		}, 30000);
	});

	describe('scrapeYouTubeData - Full Integration', () => {
		it('should scrape videos and comments with Zod validation', async () => {
			const query = 'typescript tutorial';
			const result = await scrapeYouTubeData(query);

			// Validate with Zod schema
			expect(() => ScraperResultSchema.parse(result)).not.toThrow();

			// Check structure
			expect(result.query).toBe(query);
			expect(result.scrapedAt).toBeDefined();
			expect(new Date(result.scrapedAt).getTime()).toBeGreaterThan(0);

			// Check videos
			expect(result.videos).toBeDefined();
			expect(Array.isArray(result.videos)).toBe(true);
			expect(result.videos.length).toBeGreaterThan(0);
			expect(result.videos.length).toBeLessThanOrEqual(10);

			// Check first video
			const firstVideo = result.videos[0];
			expect(() => VideoSchema.parse(firstVideo.video)).not.toThrow();
			expect(firstVideo.video.id).toBeDefined();
			expect(firstVideo.video.title).toBeDefined();
			expect(firstVideo.video.url).toMatch(/^https:\/\//);

			// Check comments
			expect(firstVideo.comments).toBeDefined();
			expect(Array.isArray(firstVideo.comments)).toBe(true);
			expect(firstVideo.comments.length).toBeGreaterThanOrEqual(1);
			expect(firstVideo.comments.length).toBeLessThanOrEqual(500);

			// Check first comment
			const firstComment = firstVideo.comments[0];
			expect(() => CommentSchema.parse(firstComment)).not.toThrow();
			expect(firstComment.author).toBeDefined();
			expect(firstComment.text).toBeDefined();
			expect(typeof firstComment.author).toBe('string');
			expect(typeof firstComment.text).toBe('string');
			expect(firstComment.text.length).toBeGreaterThan(0);
		}, 60000); // 60 second timeout for full scrape

		it('should handle edge cases gracefully', async () => {
			await expect(scrapeYouTubeData('')).rejects.toThrow();
		});
	});

	describe('Data Validation', () => {
		it('should validate comment schema', () => {
			const validComment = {
				author: 'John Doe',
				text: 'Great video!',
				likes: 10,
				publishedAt: '2024-01-01',
			};

			expect(() => CommentSchema.parse(validComment)).not.toThrow();
		});

		it('should validate video schema', () => {
			const validVideo = {
				id: 'abc123',
				title: 'Test Video',
				url: 'https://youtube.com/watch?v=abc123',
				views: '1000',
				uploadedAt: '2024-01-01',
			};

			expect(() => VideoSchema.parse(validVideo)).not.toThrow();
		});

		it('should reject invalid URLs', () => {
			const invalidVideo = {
				id: 'abc123',
				title: 'Test Video',
				url: 'not-a-url',
			};

			expect(() => VideoSchema.parse(invalidVideo)).toThrow();
		});
	});
});
