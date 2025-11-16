import { CheerioCrawler, Request } from 'crawlee';
import * as cheerio from 'cheerio';



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
		description: 'Search the web using Google search engine. Returns results with title, description, and URL. Uses Crawlee CheerioCrawler with proxy and session management to avoid blocking.',
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
 * Free proxy list - will be rotated by Crawlee's ProxyConfiguration
 * Note: Free proxies may be unreliable. For production, use paid proxy services.
 */


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
 * Search Google using Crawlee CheerioCrawler
 */
async function searchGoogleWithCrawlee(query: string, maxResults: number = 10): Promise<SearchResult[]> {
	const encodedQuery = encodeURIComponent(query);
	const url = `https://www.google.com/search?q=${encodedQuery}&hl=en&num=${Math.min(maxResults, 20)}`;
	
	const results: SearchResult[] = [];
	// 1. Configure CheerioCrawler
	const crawler = new CheerioCrawler({
		// Set max requests per crawl to 1 (we only need the first page)
		maxRequestsPerCrawl: 1,
		requestHandlerTimeoutSecs: 30,
		
		// Handle successful requests
		async requestHandler({ $, request, response, session }) {
			// Check for blocking indicators
			const html = $.html();
			if (html.includes('unusual traffic') || 
			    html.includes('captcha') ||
			    html.length < 10000) {
			throw new Error('Google blocking detected (CheerioCrawler)');
			}
			
			// Parse results
			const parsedResults = parseGoogleResults(html, maxResults);
			results.push(...parsedResults);
		},
		
			// Handle failed requests (e.g., 403, 429, network errors)
			async failedRequestHandler({ request, error }) {
				// Crawlee automatically retries based on maxRequestRetries
				console.error(`Request failed for ${request.url}: ${error.message}`);
			},
		
		// Set max retries for a single request
		maxRequestRetries: 3,
		
		// Set max concurrency to 1 to avoid overwhelming the sandbox or Google
		maxConcurrency: 1,
	});
	
	// 4. Run the crawler
	await crawler.run([
		new Request({ url, uniqueKey: query }),
	]);
	
	return results;
}

/**
 * Execute web search tool - Google with Crawlee
 */
export async function executeWebSearchTool(
	query: string,
	maxResults: number = 10
): Promise<string> {
	try {
		const limit = Math.min(Math.max(1, maxResults), 20);
		
		const results = await searchGoogleWithCrawlee(query, limit);
		
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
