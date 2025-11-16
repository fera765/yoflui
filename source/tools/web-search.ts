import { withTimeout, TIMEOUT_CONFIG } from '../config/timeout-config.js';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page } from 'puppeteer';

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

export interface SearchResult {
	title: string;
	description: string;
	url: string;
}

export interface WebSearchOptions {
	query: string;
	maxResults?: number;
}

export const webSearchToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'web_search',
		description: 'Search the web using Google search engine. Returns results with title, description, and URL. Uses advanced stealth techniques and fallback APIs to bypass blocking.',
		parameters: {
			type: 'object',
			properties: {
				query: { 
					type: 'string', 
					description: 'Search query' 
				},
				maxResults: {
					type: 'number',
					description: 'Number of results to return (1-20). Default: 10',
					default: 10,
					minimum: 1,
					maximum: 20
				}
			},
			required: ['query'],
		},
	},
};

/**
 * Random delay to simulate human behavior
 */
function randomDelay(min: number = 500, max: number = 2000): Promise<void> {
	const delay = Math.floor(Math.random() * (max - min + 1)) + min;
	return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Parse Google search results from HTML
 */
function parseGoogleResults(html: string, maxResults: number = 10): SearchResult[] {
	const results: SearchResult[] = [];
	const $ = cheerio.load(html);
	
	// Multiple selectors for different Google layouts
	const containers = [
		'div.g',
		'div[data-sokoban-container]',
		'#rso > div > div',
		'#search div.g',
		'.hlcw0c',
	];
	
	for (const containerSelector of containers) {
		$(containerSelector).each((_, element) => {
			if (results.length >= maxResults) return false;
			
			const $el = $(element);
			
			// Skip ads
			if ($el.hasClass('commercial-unit-desktop-top') || 
			    $el.find('.ads-ad').length > 0 ||
			    $el.attr('data-text-ad') !== undefined) {
				return;
			}
			
			// Extract title
			const $title = $el.find('h3, h2').first();
			const title = $title.text().trim();
			
			if (!title || title.length < 3) return;
			
			// Extract URL
			let url = '';
			const $link = $title.closest('a');
			if ($link.length > 0) {
				url = $link.attr('href') || '';
			} else {
				const $anyLink = $el.find('a[href]').first();
				url = $anyLink.attr('href') || '';
			}
			
			// Clean URL
			if (url.startsWith('/url?q=')) {
				const match = url.match(/\/url\?q=([^&]+)/);
				if (match) {
					try {
						url = decodeURIComponent(match[1]);
					} catch (e) {
						url = match[1];
					}
				}
			}
			
			// Validate URL
			if (!url || !url.match(/^https?:\/\//)) {
				return;
			}
			
			// Skip Google's own URLs
			if (url.includes('google.com/search') || 
			    url.includes('google.com/url') ||
			    url.includes('accounts.google.com') ||
			    url.includes('support.google.com')) {
				return;
			}
			
			// Extract description
			let description = '';
			const descSelectors = [
				'.VwiC3b',
				'.yXK7lf',
				'div[data-sncf]',
				'.IsZvec',
				'span[data-dobid="hdw"]',
				'.s',
				'.st',
			];
			
			for (const descSelector of descSelectors) {
				const $desc = $el.find(descSelector).first();
				if ($desc.length > 0) {
					description = $desc.text().trim();
					if (description.length > 20) break;
				}
			}
			
			// Fallback description
			if (!description || description.length < 20) {
				$el.find('div, span').each((_, div) => {
					const text = $(div).text().trim();
					if (text.length > 50 && text.length < 500 && !text.includes(title)) {
						description = text;
						return false;
					}
				});
			}
			
			// Check for duplicates
			const isDuplicate = results.some(r => r.url === url || r.title === title);
			if (!isDuplicate && title && url) {
				results.push({
					title: title.substring(0, 200),
					description: description.substring(0, 500),
					url: url.substring(0, 500),
				});
			}
		});
		
		if (results.length > 0) break;
	}
	
	return results.slice(0, maxResults);
}

/**
 * Search using free SERP API as fallback
 */
async function searchWithFallbackAPI(query: string, maxResults: number = 10): Promise<SearchResult[]> {
	try {
		// Using Google's own search API endpoint (no key required for basic searches)
		const encodedQuery = encodeURIComponent(query);
		const url = `https://www.google.com/complete/search?q=${encodedQuery}&cp=0&client=gws-wiz&xssi=t&hl=en`;
		
		// This is a simple fallback - in production, use a proper SERP API
		// For now, return empty array to indicate fallback didn't work
		return [];
	} catch (error) {
		return [];
	}
}

/**
 * Search Google using Puppeteer with stealth plugin
 */
async function searchGoogleWithStealth(query: string, maxResults: number = 10): Promise<SearchResult[]> {
	let browser: Browser | null = null;
	let page: Page | null = null;
	
	try {
		const encodedQuery = encodeURIComponent(query);
		const url = `https://www.google.com/search?q=${encodedQuery}&hl=en&num=${Math.min(maxResults, 20)}`;
		
		// Launch browser with stealth
		browser = await puppeteer.launch({
			headless: true,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-accelerated-2d-canvas',
				'--disable-gpu',
				'--window-size=1920,1080',
				'--disable-blink-features=AutomationControlled',
				'--disable-features=IsolateOrigins,site-per-process',
			],
		});
		
		page = await browser.newPage();
		
		// Set realistic viewport
		await page.setViewport({ width: 1920, height: 1080 });
		
		// Set extra headers
		await page.setExtraHTTPHeaders({
			'Accept-Language': 'en-US,en;q=0.9',
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
		});
		
		// Navigate with realistic behavior
		await page.goto(url, {
			waitUntil: 'domcontentloaded',
			timeout: 30000,
		});
		
		// Wait for results to load
		await randomDelay(2000, 3000);
		
		// Try to wait for search results container
		try {
			await page.waitForSelector('#search, #rso, div.g', { timeout: 5000 });
		} catch (e) {
			// Continue anyway
		}
		
		// Get HTML content
		const html = await page.content();
		
		// Check for blocking
		if (html.includes('unusual traffic') || 
		    html.includes('detected unusual') ||
		    html.length < 10000) {
			throw new Error('Google blocking detected');
		}
		
		// Parse results
		const results = parseGoogleResults(html, maxResults);
		
		return results;
		
	} finally {
		if (page) {
			try {
				await page.close();
			} catch (e) {
				// Ignore
			}
		}
		if (browser) {
			try {
				await browser.close();
			} catch (e) {
				// Ignore
			}
		}
	}
}

/**
 * Search Google with retry and fallback logic
 */
async function searchGoogle(query: string, maxResults: number = 10): Promise<SearchResult[]> {
	const maxAttempts = 2; // Reduced attempts to avoid long waits
	let lastError: Error | null = null;
	
	// Try with stealth Puppeteer first
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			if (attempt > 0) {
				await randomDelay(3000, 5000);
			}
			
			const results = await searchGoogleWithStealth(query, maxResults);
			
			if (results.length > 0) {
				return results;
			}
			
			// No results but no error
			if (attempt === maxAttempts - 1) {
				// Try fallback API
				const fallbackResults = await searchWithFallbackAPI(query, maxResults);
				if (fallbackResults.length > 0) {
					return fallbackResults;
				}
				return [];
			}
			
			lastError = new Error('No results found');
			
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			
			if (attempt < maxAttempts - 1) {
				continue;
			}
		}
	}
	
	// If all attempts failed, try fallback API one last time
	try {
		const fallbackResults = await searchWithFallbackAPI(query, maxResults);
		if (fallbackResults.length > 0) {
			return fallbackResults;
		}
	} catch (e) {
		// Ignore fallback errors
	}
	
	throw lastError || new Error('Google search failed after all attempts');
}

/**
 * Execute web search tool - Google with stealth and fallback
 */
export async function executeWebSearchTool(
	query: string,
	maxResults: number = 10
): Promise<string> {
	try {
		const limit = Math.min(Math.max(1, maxResults), 20);
		
		const results = await searchGoogle(query, limit);
		
		return JSON.stringify({
			query,
			engine: 'google',
			totalResults: results.length,
			results: results,
		}, null, 2);
	} catch (error) {
		const errorMessage = `Error during web search for query "${query}": ${error instanceof Error ? error.message : String(error)}`;
		console.error(errorMessage);
		
		return JSON.stringify({
			error: 'Web search failed',
			message: errorMessage,
			query,
			totalResults: 0,
			results: [],
		}, null, 2);
	}
}
