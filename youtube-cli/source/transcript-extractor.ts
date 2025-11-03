/**
 * Extract video transcript/captions using youtubei.js
 * 
 * This function uses the same Innertube instance pattern as comments extraction
 */
import { Innertube } from 'youtubei.js';

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

export interface TranscriptSegment {
	text: string;
	start: number; // Start time in seconds
	duration: number; // Duration in seconds
}

export interface Transcript {
	language: string;
	segments: TranscriptSegment[];
	fullText: string; // Full transcript as single text
}

/**
 * Fetches transcript/captions for a single video using YouTubeI.js
 * 
 * @param videoId - YouTube video ID
 * @returns Transcript object with segments and full text, or null if not available
 */
export async function fetchVideoTranscript(videoId: string): Promise<Transcript | null> {
	if (!videoId || videoId.trim().length === 0) {
		throw new Error('Video ID cannot be empty');
	}

	try {
		// Add small delay to avoid rate limiting
		await delay(300);
		
		// Suppress parser warnings (they're handled by youtubei.js)
		const originalConsoleError = console.error;
		console.error = () => {};
		
		const youtube = await retryWithBackoff(
			() => Innertube.create(),
			2,
			500
		);
		
		// Get video info
		const videoInfo = await retryWithBackoff(
			() => youtube.getInfo(videoId),
			2,
			1000
		);
		
		// Restore console.error
		console.error = originalConsoleError;

		// Check if captions are available
		if (!videoInfo.captions || !videoInfo.captions.caption_tracks || videoInfo.captions.caption_tracks.length === 0) {
			return null; // No captions available
		}

		// Try to get transcript using the caption tracks
		try {
			// Get the first available caption track (prefer auto-generated if available)
			const captionTracks = videoInfo.captions.caption_tracks;
			
			// Prefer auto-generated transcripts (kind === 'asr')
			let captionTrack = captionTracks.find((track: any) => track.kind === 'asr');
			
			// Fallback to first available track
			if (!captionTrack) {
				captionTrack = captionTracks[0];
			}
			
			if (!captionTrack) {
				return null;
			}
			
			// Get the URL for fetching captions
			// The base_url might need query parameters
			const baseUrlValue: any = captionTrack.base_url;
			let captionUrl: string | undefined;
			
			// If base_url is a function, call it
			if (typeof baseUrlValue === 'function') {
				captionUrl = baseUrlValue();
			} else if (typeof baseUrlValue === 'string') {
				captionUrl = baseUrlValue;
			}
			
			// Ensure it's a string URL
			if (!captionUrl || typeof captionUrl !== 'string' || !captionUrl.startsWith('http')) {
				// Try alternative: use the track's URL property
				captionUrl = (captionTrack as any).url;
			}
			
			if (!captionUrl || typeof captionUrl !== 'string') {
				return null;
			}
			
			// Fetch caption XML/TXT from the URL
			const response = await fetch(captionUrl);
			
			if (!response.ok) {
				return null;
			}
			
			const captionText = await response.text();
			
			// Parse transcript (YouTube returns XML format)
			const segments = parseTranscriptXML(captionText);
			
			if (segments.length === 0) {
				return null;
			}
			
			const fullText = segments.map(s => s.text).join(' ');
			
			return {
				language: captionTrack.language_code || 'en',
				segments,
				fullText,
			};
			
		} catch (transcriptError) {
			// Transcript extraction failed, but video might still have captions
			// Silently return null - transcript is optional
			return null;
		}
	} catch (error) {
		// Silently fail - transcript is optional
		return null;
	}
}

/**
 * Parse YouTube caption XML format
 * 
 * YouTube captions are typically in XML format like:
 * <transcript>
 *   <text start="0.0" dur="2.5">Hello world</text>
 *   <text start="2.5" dur="3.2">How are you?</text>
 * </transcript>
 */
function parseTranscriptXML(xmlText: string): TranscriptSegment[] {
	const segments: TranscriptSegment[] = [];
	
	try {
		// Simple XML parsing (could use a proper XML parser if needed)
		// Handle both XML format and plain text format
		
		// Try XML format first
		const xmlRegex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([^<]+)<\/text>/g;
		let match;
		let foundXML = false;
		
		while ((match = xmlRegex.exec(xmlText)) !== null) {
			foundXML = true;
			const start = parseFloat(match[1]);
			const duration = parseFloat(match[2]);
			const text = match[3].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
			
			if (text) {
				segments.push({
					text,
					start,
					duration,
				});
			}
		}
		
		// If XML parsing found nothing, try plain text format (some videos use this)
		if (!foundXML && segments.length === 0) {
			// Try to extract text blocks with timestamps
			const lines = xmlText.split('\n').filter(line => line.trim());
			for (const line of lines) {
				// Simple heuristic: if line doesn't look like XML, it might be plain text
				if (!line.includes('<') && line.trim().length > 10) {
					segments.push({
						text: line.trim(),
						start: 0,
						duration: 0,
					});
				}
			}
		}
		
	} catch (error) {
		// Parsing failed - return empty array
		return [];
	}
	
	return segments;
}
