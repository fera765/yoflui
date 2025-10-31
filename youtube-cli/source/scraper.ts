/**
 * DISCLAIMER: This code is provided for educational and testing purposes only.
 * The author takes no responsibility for any use of this code.
 * Scraping YouTube may violate their Terms of Service.
 */

import { youtube as scrapeYoutube } from 'scrape-youtube';
import { Innertube } from 'youtubei.js';
import PQueue from 'p-queue';
import {
	CommentSchema,
	VideoSchema,
	VideoWithCommentsSchema,
	ScraperResultSchema,
	type ScraperResult,
	type VideoWithComments,
} from './types.js';

// Maximum concurrency for scraping
const MAX_CONCURRENCY = 3;

/**
 * Searches for top 10 YouTube videos based on query
 */
export async function searchVideos(query: string, maxVideos: number = 10): Promise<any[]> {
	if (!query || query.trim().length === 0) {
		throw new Error('Query cannot be empty');
	}

	try {
		const results = await scrapeYoutube.search(query, { type: 'video' });
		
		if (!results || !results.videos || !Array.isArray(results.videos)) {
			throw new Error('Invalid response from YouTube scraper');
		}

		return results.videos.slice(0, maxVideos);
	} catch (error) {
		throw new Error(`Failed to search videos: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff
 */
async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	maxRetries = 3,
	baseDelay = 1000
): Promise<T> {
	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			if (i === maxRetries - 1) throw error;
			
			const delayMs = baseDelay * Math.pow(2, i);
			await delay(delayMs);
		}
	}
	throw new Error('Max retries exceeded');
}

/**
 * Fetches comments for a single video using YouTubeI.js with retry logic
 */
export async function fetchVideoComments(videoId: string, maxComments: number = 100): Promise<any[]> {
	if (!videoId || videoId.trim().length === 0) {
		throw new Error('Video ID cannot be empty');
	}

	try {
		// Add small delay to avoid rate limiting
		await delay(300);
		
		// Suppress parser warnings
		const originalConsoleError = console.error;
		console.error = (...args: any[]) => {
			const msg = args[0]?.toString() || '';
			if (!msg.includes('YOUTUBEJS') && !msg.includes('Parser')) {
				originalConsoleError(...args);
			}
		};
		
		const youtube = await retryWithBackoff(
			() => Innertube.create(),
			2,
			500
		);
		
		const comments: any[] = [];
		
		// Try to get comments directly using getComments with retry
		let commentsList;
		try {
			commentsList = await retryWithBackoff(
				() => youtube.getComments(videoId),
				2,
				1000
			);
		} catch (commErr) {
			// Restore console.error
			console.error = originalConsoleError;
			// Comments may be disabled or rate limited
			return [];
		}

		// Restore console.error
		console.error = originalConsoleError;

		if (!commentsList) {
			return [];
		}
		
		// Get initial comments
		for (const commentThread of commentsList.contents) {
			if (comments.length >= maxComments) break;
			
			// Extract the actual comment from the thread
			const commentObj = (commentThread as any).comment;
			if (!commentObj) continue;
			
			const author = commentObj.author?.name || 'Anonymous';
			const text = commentObj.content?.text || '';
			const likes = parseInt(String(commentObj.like_count || '0').replace(/[^0-9]/g, '')) || 0;
			const publishedAt = commentObj.published_time || '';

			if (text && text.length > 0) {
				comments.push({
					author,
					text,
					likes,
					publishedAt,
				});
			}
		}

		// Continue fetching if we need more (with rate limiting)
		while (comments.length < maxComments && commentsList.has_continuation) {
			try {
				// Add delay between pagination requests
				await delay(500);
				
				commentsList = await retryWithBackoff(
					() => commentsList.getContinuation(),
					2,
					1000
				);
				
				for (const commentThread of commentsList.contents) {
					if (comments.length >= maxComments) break;
					
					// Extract the actual comment from the thread
					const commentObj = (commentThread as any).comment;
					if (!commentObj) continue;
					
					const author = commentObj.author?.name || 'Anonymous';
					const text = commentObj.content?.text || '';
					const likes = parseInt(String(commentObj.like_count || '0').replace(/[^0-9]/g, '')) || 0;
					const publishedAt = commentObj.published_time || '';

					if (text && text.length > 0) {
						comments.push({
							author,
							text,
							likes,
							publishedAt,
						});
					}
				}
			} catch (contError) {
				// No more comments available or rate limited
				break;
			}
		}

		// Return up to maxComments
		return comments.slice(0, maxComments);
	} catch (error) {
		console.error(`Failed to fetch comments for video ${videoId}:`, error);
		return [];
	}
}

/**
 * Normalizes raw video data from scrape-youtube to match our schema
 */
function normalizeVideo(rawVideo: any): any {
	const videoUrl = rawVideo.link || `https://www.youtube.com/watch?v=${rawVideo.id}`;
	
	return {
		id: rawVideo.id,
		title: rawVideo.title || 'Untitled',
		url: videoUrl,
		views: rawVideo.views ? String(rawVideo.views) : undefined,
		uploadedAt: rawVideo.uploaded || rawVideo.uploadedAt,
	};
}

/**
 * Normalizes raw comment data to match our schema
 */
function normalizeComment(rawComment: any): any {
	return {
		author: rawComment.author || 'Anonymous',
		text: rawComment.text || '',
		likes: typeof rawComment.likes === 'number' ? rawComment.likes : 0,
		publishedAt: rawComment.publishedAt,
	};
}

/**
 * Main scraper function: searches videos and fetches comments with concurrency control
 */
export async function scrapeYouTubeData(
	query: string,
	maxVideos: number = 10,
	maxCommentsPerVideo: number = 100
): Promise<ScraperResult> {
	// Step 1: Search for videos
	const rawVideos = await searchVideos(query);

	if (rawVideos.length === 0) {
		throw new Error('No videos found for query');
	}

	// Step 2: Fetch comments with concurrency control
	const queue = new PQueue({ concurrency: MAX_CONCURRENCY });
	
	const videosWithComments: VideoWithComments[] = [];

	await queue.addAll(
		rawVideos.map(rawVideo => async () => {
			try {
				const normalizedVideo = normalizeVideo(rawVideo);
				const rawComments = await fetchVideoComments(rawVideo.id, maxCommentsPerVideo);

			// Normalize comments
			const normalizedComments = rawComments
				.map(normalizeComment)
				.filter((comment: any) => comment.text && comment.text.length > 0);

			// Only include videos that have at least 1 comment
				if (normalizedComments.length > 0) {
					// Validate with Zod
					const validatedVideo = VideoSchema.parse(normalizedVideo);
					const validatedComments = normalizedComments.map((c: any) => CommentSchema.parse(c));

					const videoWithComments = VideoWithCommentsSchema.parse({
						video: validatedVideo,
						comments: validatedComments,
					});

					videosWithComments.push(videoWithComments);
				}
		} catch (error) {
			// Silently skip videos that fail to process
		}
		})
	);

	// Step 3: Ensure we have up to maxVideos
	const finalVideos = videosWithComments.slice(0, maxVideos);

	if (finalVideos.length === 0) {
		throw new Error('No videos with comments found');
	}

	// Step 4: Validate final result
	const result: ScraperResult = {
		videos: finalVideos,
		query,
		scrapedAt: new Date().toISOString(),
	};

	return ScraperResultSchema.parse(result);
}
