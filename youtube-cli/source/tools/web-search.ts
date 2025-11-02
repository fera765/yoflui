import { withTimeout, TIMEOUT_CONFIG } from '../config/timeout-config.js';

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
		description: 'Search the web using SearXNG metasearch engine with DuckDuckGo fallback. Returns results with title, description, and URL. SearXNG aggregates results from multiple search engines (Google, Bing, DuckDuckGo, etc.) without tracking users.',
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

// Lista de inst?ncias p?blicas do SearXNG (com fallback)
// Ordem de prioridade: inst?ncias mais confi?veis primeiro
const SEARXNG_INSTANCES = [
	'https://searx.tiekoetter.com',
	'https://searx.sp-codes.de',
	'https://search.sapti.me',
	'https://searx.prvcy.eu',
	'https://searx.xyz',
	'https://searx.be',
	'https://searx.org',
	'https://searx.neocities.org',
];

// Inst?ncia personalizada pode ser configurada via vari?vel de ambiente
const CUSTOM_SEARXNG_INSTANCE = process.env.SEARXNG_INSTANCE;

let currentInstanceIndex = 0;
let instanceFailures = new Map<string, number>();
const MAX_INSTANCE_FAILURES = 5;

/**
 * Get list of available instances (custom first, then public)
 */
function getAvailableInstances(): string[] {
	const instances = [];
	if (CUSTOM_SEARXNG_INSTANCE) {
		instances.push(CUSTOM_SEARXNG_INSTANCE);
	}
	instances.push(...SEARXNG_INSTANCES);
	return instances;
}

/**
 * Get next instance (rotate, skip failed ones)
 */
function getNextInstance(): string | null {
	const instances = getAvailableInstances();
	if (instances.length === 0) return null;
	
	// Remove instances with too many failures
	const availableInstances = instances.filter(instance => {
		const failures = instanceFailures.get(instance) || 0;
		return failures < MAX_INSTANCE_FAILURES;
	});
	
	if (availableInstances.length === 0) {
		// Reset failures if all instances failed
		instanceFailures.clear();
		return instances[0];
	}
	
	currentInstanceIndex = (currentInstanceIndex + 1) % availableInstances.length;
	return availableInstances[currentInstanceIndex];
}

/**
 * Mark instance as failed
 */
function markInstanceFailed(instance: string): void {
	const failures = instanceFailures.get(instance) || 0;
	instanceFailures.set(instance, failures + 1);
}

/**
 * Reset instance failures (periodic cleanup)
 */
function resetInstanceFailures(): void {
	if (instanceFailures.size > 15) {
		instanceFailures.clear();
	}
}

/**
 * Random delay between requests (anti-rate-limiting)
 */
function randomDelay(min: number = 200, max: number = 800): Promise<void> {
	const delay = Math.floor(Math.random() * (max - min + 1)) + min;
	return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Parse SearXNG JSON response
 */
function parseSearXNGResults(response: any, maxResults: number = 10): SearchResult[] {
	const results: SearchResult[] = [];
	
	if (!response || !response.results || !Array.isArray(response.results)) {
		return [];
	}
	
	for (const result of response.results) {
		if (results.length >= maxResults) break;
		
		// SearXNG returns results with: title, url, content (description)
		const title = result.title || '';
		const url = result.url || '';
		const description = result.content || '';
		
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
	
	return results.slice(0, maxResults);
}

/**
 * Parse DuckDuckGo HTML results (fallback)
 */
function parseDuckDuckGoResults(html: string, maxResults: number = 10): SearchResult[] {
	const results: SearchResult[] = [];
	
	// DuckDuckGo uses result__title for titles
	const resultPattern = /<div[^>]*class="[^"]*result[^"]*"[^>]*>(.*?)<\/div>/gis;
	const matches = Array.from(html.matchAll(resultPattern));
	
	for (const match of matches) {
		if (results.length >= maxResults) break;
		
		const resultHtml = match[1];
		
		// Extract title
		const titleMatch = resultHtml.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*>(.*?)<\/a>/is);
		if (!titleMatch) continue;
		
		const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
		if (!title || title.length < 3) continue;
		
		// Extract URL (DuckDuckGo uses uddg= redirects)
		const urlMatch = resultHtml.match(/href="[^"]*uddg=([^&"]+)"/i);
		let url = '';
		if (urlMatch) {
			try {
				url = decodeURIComponent(urlMatch[1]);
			} catch (e) {
				url = urlMatch[1];
			}
		}
		
		// Try direct URL
		if (!url || !url.startsWith('http')) {
			const directUrlMatch = resultHtml.match(/href="(https?:\/\/[^"]+)"/i);
			if (directUrlMatch) {
				url = directUrlMatch[1];
			}
		}
		
		// Extract description/snippet
		const snippetMatch = resultHtml.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>(.*?)<\/a>/is) ||
			resultHtml.match(/<span[^>]*class="[^"]*result__snippet[^"]*"[^>]*>(.*?)<\/span>/is);
		const description = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : '';
		
		if (title && url && url.startsWith('http')) {
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
	
	return results.slice(0, maxResults);
}

/**
 * Search using DuckDuckGo API (fallback)
 */
async function searchWithDuckDuckGo(query: string, maxResults: number = 10): Promise<SearchResult[]> {
	try {
		const encodedQuery = encodeURIComponent(query);
		// Use DuckDuckGo Instant Answer API first
		const apiUrl = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;
		
		const apiResponse = await withTimeout(
			fetch(apiUrl, {
				method: 'GET',
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
					'Accept': 'application/json',
				},
			}),
			TIMEOUT_CONFIG.HTTP_REQUEST,
			`DuckDuckGo API search: ${query}`
		);
		
		if (apiResponse.ok) {
			const data = await apiResponse.json();
			const results: SearchResult[] = [];
			
			// Parse RelatedTopics
			if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
				for (const topic of data.RelatedTopics) {
					if (results.length >= maxResults) break;
					
					if (topic.FirstURL && topic.Text) {
						const title = topic.Text.split(' - ')[0] || topic.Text.substring(0, 100);
						const description = topic.Text.split(' - ').slice(1).join(' - ') || topic.Text;
						
						results.push({
							title: title.substring(0, 200),
							description: description.substring(0, 500),
							url: topic.FirstURL.substring(0, 500),
						});
					}
				}
			}
			
			// Parse Results
			if (data.Results && Array.isArray(data.Results)) {
				for (const result of data.Results) {
					if (results.length >= maxResults) break;
					
					if (result.FirstURL && result.Text) {
						results.push({
							title: result.Text.substring(0, 200),
							description: '',
							url: result.FirstURL.substring(0, 500),
						});
					}
				}
			}
			
			if (results.length > 0) {
				console.log(`? Successfully extracted ${results.length} results from DuckDuckGo API`);
				return results.slice(0, maxResults);
			}
		}
		
		// If API didn't return results, try HTML fallback
		console.warn('DuckDuckGo API returned no results, trying HTML fallback...');
		return await searchWithDuckDuckGoHTML(query, maxResults);
		
	} catch (error) {
		// Try HTML fallback if API fails
		try {
			return await searchWithDuckDuckGoHTML(query, maxResults);
		} catch (htmlError) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			console.warn(`DuckDuckGo fallback failed: ${errorMsg}`);
			throw error;
		}
	}
}

/**
 * Search using DuckDuckGo HTML (fallback)
 */
async function searchWithDuckDuckGoHTML(query: string, maxResults: number = 10): Promise<SearchResult[]> {
	const encodedQuery = encodeURIComponent(query);
	const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
	
	const response = await withTimeout(
		fetch(url, {
			method: 'GET',
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.9',
			},
		}),
		TIMEOUT_CONFIG.HTTP_REQUEST,
		`DuckDuckGo HTML search: ${query}`
	);
	
	if (!response.ok) {
		throw new Error(`DuckDuckGo HTML search failed: HTTP ${response.status}`);
	}
	
	const html = await response.text();
	const results = parseDuckDuckGoResults(html, maxResults);
	
	if (results.length > 0) {
		console.log(`? Successfully extracted ${results.length} results from DuckDuckGo HTML`);
		return results;
	}
	
	return [];
}

/**
 * Search using SearXNG API
 */
async function searchWithSearXNG(query: string, maxResults: number = 10): Promise<SearchResult[]> {
	await randomDelay(); // Anti-rate-limiting
	resetInstanceFailures();
	
	const encodedQuery = encodeURIComponent(query);
	const engines = 'google,duckduckgo,bing'; // Use multiple engines for better results
	
	let lastError: Error | null = null;
	const instances = getAvailableInstances();
	const maxAttempts = Math.min(instances.length * 2, 8); // Limit attempts
	
	// Try multiple instances
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const instance = getNextInstance();
		if (!instance) {
			break;
		}
		
		try {
			console.log(`Attempt ${attempt + 1}: Using SearXNG instance ${instance}`);
			
			// Build search URL
			const searchUrl = `${instance}/search?q=${encodedQuery}&format=json&engines=${engines}&pageno=1`;
			
			const response = await withTimeout(
				fetch(searchUrl, {
					method: 'GET',
					headers: {
						'Accept': 'application/json',
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
					},
				}),
				TIMEOUT_CONFIG.HTTP_REQUEST,
				`SearXNG search: ${query}`
			);
			
			if (!response.ok) {
				if (response.status === 429 || response.status === 503) {
					// Rate limited or service unavailable
					console.warn(`Instance ${instance} rate limited (HTTP ${response.status})`);
					markInstanceFailed(instance);
					await randomDelay(1000, 2000);
					continue;
				}
				if (response.status === 403) {
					// Forbidden - probably blocking automated requests
					console.warn(`Instance ${instance} forbidden (HTTP ${response.status})`);
					markInstanceFailed(instance);
					continue;
				}
				throw new Error(`SearXNG search failed: HTTP ${response.status}`);
			}
			
			const contentType = response.headers.get('content-type') || '';
			if (!contentType.includes('application/json')) {
				// Some instances return HTML instead of JSON
				const text = await response.text();
				if (text.includes('Too Many Requests') || text.includes('403') || text.includes('Rate limit')) {
					console.warn(`Instance ${instance} blocked or rate limited`);
					markInstanceFailed(instance);
					await randomDelay(1000, 2000);
					continue;
				}
				throw new Error(`Expected JSON but got ${contentType}`);
			}
			
			const data = await response.json();
			const results = parseSearXNGResults(data, maxResults);
			
			if (results.length > 0) {
				console.log(`? Successfully extracted ${results.length} results from ${instance}`);
				return results;
			}
			
			// If no results, try next instance
			if (attempt < maxAttempts - 1) {
				console.warn(`No results from ${instance}, trying next instance...`);
				await randomDelay(500, 1000);
				continue;
			}
			
			// Last attempt - return empty results
			return [];
			
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			const errorMsg = lastError.message;
			
			// Don't log connection errors for every attempt
			if (!errorMsg.includes('fetch failed') && !errorMsg.includes('timeout')) {
				console.warn(`Attempt ${attempt + 1} failed (${instance}): ${errorMsg}`);
			}
			
			markInstanceFailed(instance);
			
			if (attempt < maxAttempts - 1) {
				await randomDelay(500, 1000);
			}
		}
	}
	
	throw new Error(`SearXNG search error: ${lastError?.message || 'All instances failed'}`);
}

/**
 * Execute web search tool using SearXNG with DuckDuckGo fallback
 */
export async function executeWebSearchTool(
	query: string,
	maxResults: number = 10
): Promise<string> {
	try {
		// Validate maxResults
		const limit = Math.min(Math.max(1, maxResults), 20);
		
		let results: SearchResult[] = [];
		let engine = 'unknown';
		
		// Try SearXNG first
		try {
			results = await searchWithSearXNG(query, limit);
			engine = 'searxng';
		} catch (searxError) {
			console.warn('SearXNG failed, trying DuckDuckGo fallback...');
			// Fallback to DuckDuckGo
			try {
				results = await searchWithDuckDuckGo(query, limit);
				engine = 'duckduckgo';
			} catch (ddgError) {
				// Both failed
				throw new Error(`Both SearXNG and DuckDuckGo failed. SearXNG: ${searxError instanceof Error ? searxError.message : String(searxError)}. DuckDuckGo: ${ddgError instanceof Error ? ddgError.message : String(ddgError)}`);
			}
		}
		
		return JSON.stringify({
			query,
			engine,
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
