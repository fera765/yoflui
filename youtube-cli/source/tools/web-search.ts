import { withTimeout, TIMEOUT_CONFIG } from '../config/timeout-config.js';
import puppeteer from 'puppeteer';

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
		description: 'Search the web using Google. Returns results with title, description, and URL. Uses Puppeteer to render JavaScript and extract results.',
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

// Keep browser instance for reuse
let browserInstance: any = null;

/**
 * Get or create browser instance
 */
async function getBrowser() {
	if (!browserInstance) {
		browserInstance = await puppeteer.launch({
			headless: true,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-blink-features=AutomationControlled',
			],
		});
	}
	return browserInstance;
}

/**
 * Parse Google search results from rendered HTML
 */
function parseGoogleResults(html: string, maxResults: number = 10): SearchResult[] {
	const results: SearchResult[] = [];
	
	// Strategy: Find all h3 tags (Google uses h3 for titles)
	const h3Pattern = /<h3[^>]*>(.*?)<\/h3>/gi;
	const h3Matches = Array.from(html.matchAll(h3Pattern));
	
	if (h3Matches.length > 0) {
		for (const h3Match of h3Matches) {
			if (results.length >= maxResults) break;
			
			const h3Index = h3Match.index || 0;
			const contextStart = Math.max(0, h3Index - 1000);
			const contextEnd = Math.min(html.length, h3Index + 2000);
			const context = html.substring(contextStart, contextEnd);
			
			// Extract title from h3
			const title = h3Match[1].replace(/<[^>]*>/g, '').trim();
			if (!title || title.length < 3) continue;
			
			// Skip navigation/header h3s
			if (title.toLowerCase().includes('google') || title.toLowerCase().includes('search')) {
				continue;
			}
			
			// Find URL near this h3 - multiple patterns
			let url = '';
			
			// Pattern 1: /url?q= (Google redirect URLs)
			const urlQMatch = context.match(/href="\/url\?q=([^&"]+)"/i);
			if (urlQMatch) {
				url = decodeURIComponent(urlQMatch[1]);
			}
			
			// Pattern 2: Direct http/https URLs
			if (!url || !url.startsWith('http')) {
				const directUrlMatch = context.match(/href="(https?:\/\/[^"]+)"/i);
				if (directUrlMatch) {
					url = directUrlMatch[1];
				}
			}
			
			// Pattern 3: data-ved with href
			if (!url || !url.startsWith('http')) {
				const dataVedMatch = context.match(/data-ved[^>]*href="([^"]+)"/i);
				if (dataVedMatch) {
					const potentialUrl = dataVedMatch[1];
					if (potentialUrl.startsWith('/url?q=')) {
						url = decodeURIComponent(potentialUrl.split('q=')[1]?.split('&')[0] || '');
					} else if (potentialUrl.startsWith('http')) {
						url = potentialUrl;
					}
				}
			}
			
			// Find description/snippet - multiple patterns
			let description = '';
			
			// Look for snippet after the h3
			const snippetAfterH3 = html.substring(h3Index, h3Index + 1500);
			
			const snippetPatterns = [
				/<span[^>]*class="[^"]*VwiC3b[^"]*"[^>]*>(.*?)<\/span>/is,
				/<span[^>]*class="[^"]*MUxGbd[^"]*"[^>]*>(.*?)<\/span>/is,
				/<div[^>]*class="[^"]*VwiC3b[^"]*"[^>]*>(.*?)<\/div>/is,
				/<span[^>]*class="[^"]*yXK7lf[^"]*"[^>]*>(.*?)<\/span>/is,
				/<span[^>]*class="[^"]*st[^"]*"[^>]*>(.*?)<\/span>/is,
				/<div[^>]*class="[^"]*[Ss]nippet[^"]*"[^>]*>(.*?)<\/div>/is,
			];
			
			for (const snippetPattern of snippetPatterns) {
				const snippetMatch = snippetAfterH3.match(snippetPattern);
				if (snippetMatch && snippetMatch[1]) {
					description = snippetMatch[1].replace(/<[^>]*>/g, '').trim();
					if (description.length > 10) {
						break;
					}
				}
			}
			
			// Validate and add result
			if (title && url && url.startsWith('http')) {
				// Avoid duplicates
				const isDuplicate = results.some(r => r.url === url || r.title === title);
				if (!isDuplicate) {
					results.push({
						title: title.substring(0, 200),
						description: description.substring(0, 500),
						url: url.substring(0, 500),
					});
				}
			}
		}
	}
	
	return results.slice(0, maxResults);
}

/**
 * Search Google using Puppeteer (renders JavaScript)
 */
async function searchGoogle(query: string, maxResults: number = 10): Promise<SearchResult[]> {
	let browser: any = null;
	let page: any = null;
	
	try {
		browser = await getBrowser();
		page = await browser.newPage();
		
		// Set realistic viewport
		await page.setViewport({ width: 1920, height: 1080 });
		
		// Set user agent
		await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
		
		// Navigate to Google search
		const encodedQuery = encodeURIComponent(query);
		const url = `https://www.google.com/search?q=${encodedQuery}&num=${Math.min(maxResults, 20)}&hl=en`;
		
		await page.goto(url, { 
			waitUntil: 'networkidle2',
			timeout: 30000 
		});
		
		// Wait for results to load
		await page.waitForSelector('h3', { timeout: 10000 }).catch(() => {
			// If h3 not found, try waiting a bit more
		});
		
		// Get HTML content
		const html = await page.content();
		
		// Parse results
		const results = parseGoogleResults(html, maxResults);
		
		// Close page
		await page.close();
		
		return results;
		
	} catch (error) {
		if (page) {
			try {
				await page.close();
			} catch (e) {
				// Ignore
			}
		}
		throw error;
	}
}

/**
 * Execute web search tool - Google only with Puppeteer
 */
export async function executeWebSearchTool(
	query: string,
	maxResults: number = 10
): Promise<string> {
	try {
		// Validate maxResults
		const limit = Math.min(Math.max(1, maxResults), 20);
		
		const results = await withTimeout(
			searchGoogle(query, limit),
			TIMEOUT_CONFIG.HTTP_REQUEST * 3, // Puppeteer needs more time
			`Google search: ${query}`
		);
		
		return JSON.stringify({
			query,
			engine: 'google',
			totalResults: results.length,
			results: results,
		}, null, 2);
	} catch (error) {
		const errorMessage = `Error during web search for query "${query}": ${error instanceof Error ? error.message : String(error)}`;
		console.error(errorMessage, error);
		
		return JSON.stringify({
			error: 'Web search failed',
			message: errorMessage,
			query,
			totalResults: 0,
			results: [],
		}, null, 2);
	}
}

// Cleanup browser on exit
process.on('exit', async () => {
	if (browserInstance) {
		try {
			await browserInstance.close();
		} catch (e) {
			// Ignore
		}
	}
});
