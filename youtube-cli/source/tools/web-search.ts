import { withTimeout, TIMEOUT_CONFIG } from '../config/timeout-config.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

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

// Lista atualizada de inst?ncias p?blicas do SearXNG (prioridade: mais confi?veis primeiro)
const SEARXNG_INSTANCES = [
	'https://searx.be',
	'https://searx.prvcy.eu',
	'https://search.sapti.me',
	'https://searx.tiekoetter.com',
	'https://searx.sp-codes.de',
	'https://searx.xyz',
	'https://searx.org',
	'https://searx.privacytools.io',
	'https://searx.tuxcloud.net',
	'https://searx.neocities.org',
	'https://searx.info',
	'https://searx.dresden.network',
];

// Inst?ncia personalizada pode ser configurada via vari?vel de ambiente
const CUSTOM_SEARXNG_INSTANCE = process.env.SEARXNG_INSTANCE;

// Lista de proxies para distribuir requisi??es e evitar rate limiting
const PROXY_LIST: string[] = process.env.SEARXNG_PROXIES 
	? process.env.SEARXNG_PROXIES.split(',').map(p => p.trim()).filter(Boolean)
	: [];

let currentInstanceIndex = 0;
let currentProxyIndex = 0;
let instanceFailures = new Map<string, number>();
let proxyFailures = new Map<string, number>();
let instanceSuccesses = new Map<string, number>();
const MAX_INSTANCE_FAILURES = 3;
const MAX_PROXY_FAILURES = 3;

/**
 * Get list of available instances (custom first, then public, prioritizing successful ones)
 */
function getAvailableInstances(): string[] {
	const instances = [];
	if (CUSTOM_SEARXNG_INSTANCE) {
		instances.push(CUSTOM_SEARXNG_INSTANCE);
	}
	
	// Sort instances by success rate (most successful first)
	const sortedInstances = [...SEARXNG_INSTANCES].sort((a, b) => {
		const aSuccesses = instanceSuccesses.get(a) || 0;
		const bSuccesses = instanceSuccesses.get(b) || 0;
		return bSuccesses - aSuccesses;
	});
	
	instances.push(...sortedInstances);
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
 * Mark instance as successful
 */
function markInstanceSuccessful(instance: string): void {
	const successes = instanceSuccesses.get(instance) || 0;
	instanceSuccesses.set(instance, successes + 1);
}

/**
 * Reset instance failures (periodic cleanup)
 */
function resetInstanceFailures(): void {
	if (instanceFailures.size > 20) {
		instanceFailures.clear();
	}
}

/**
 * Get next proxy (rotate, skip failed ones)
 */
function getNextProxy(): string | null {
	if (PROXY_LIST.length === 0) return null;
	
	const availableProxies = PROXY_LIST.filter(proxy => {
		const failures = proxyFailures.get(proxy) || 0;
		return failures < MAX_PROXY_FAILURES;
	});
	
	if (availableProxies.length === 0) {
		proxyFailures.clear();
		return PROXY_LIST[0] || null;
	}
	
	currentProxyIndex = (currentProxyIndex + 1) % availableProxies.length;
	return availableProxies[currentProxyIndex];
}

/**
 * Mark proxy as failed
 */
function markProxyFailed(proxy: string): void {
	const failures = proxyFailures.get(proxy) || 0;
	proxyFailures.set(proxy, failures + 1);
}

/**
 * Create fetch with proxy support and better headers
 */
async function createFetchWithProxy(url: string, useProxy: boolean = true): Promise<Response> {
	const headers = {
		'Accept': 'application/json, text/html, */*',
		'Accept-Language': 'en-US,en;q=0.9',
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Referer': 'https://www.google.com/',
		'Origin': 'https://www.google.com',
		'Cache-Control': 'no-cache',
	};
	
	if (useProxy && PROXY_LIST.length > 0) {
		const proxyUrl = getNextProxy();
		if (proxyUrl) {
			try {
				let agent: any;
				if (proxyUrl.startsWith('socks5://') || proxyUrl.startsWith('socks4://')) {
					agent = new SocksProxyAgent(proxyUrl);
				} else if (proxyUrl.startsWith('https://')) {
					agent = new HttpsProxyAgent(proxyUrl);
				} else {
					agent = new HttpProxyAgent(proxyUrl);
				}

				// @ts-ignore - Node.js fetch with agent
				const response = await fetch(url, {
					method: 'GET',
					headers,
					// @ts-ignore
					agent,
				});
				
				return response;
			} catch (error) {
				markProxyFailed(proxyUrl);
				console.warn(`Proxy ${proxyUrl} failed, using direct connection`);
			}
		}
	}
	
	// Direct connection
	return fetch(url, {
		method: 'GET',
		headers,
	});
}

/**
 * Random delay between requests (anti-rate-limiting)
 */
function randomDelay(min: number = 300, max: number = 1000): Promise<void> {
	const delay = Math.floor(Math.random() * (max - min + 1)) + min;
	return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Parse SearXNG JSON response - improved
 */
function parseSearXNGResults(response: any, maxResults: number = 10): SearchResult[] {
	const results: SearchResult[] = [];
	
	if (!response || typeof response !== 'object') {
		return [];
	}
	
	// Handle different response formats
	let resultsArray: any[] = [];
	
	if (Array.isArray(response.results)) {
		resultsArray = response.results;
	} else if (response.results && typeof response.results === 'object') {
		// Sometimes results is an object with nested arrays
		if (Array.isArray(response.results.general)) {
			resultsArray = response.results.general;
		} else if (Array.isArray(response.results.web)) {
			resultsArray = response.results.web;
		}
	}
	
	for (const result of resultsArray) {
		if (results.length >= maxResults) break;
		
		// SearXNG returns results with: title, url, content (description)
		const title = result.title || result.Title || '';
		const url = result.url || result.Url || result.url || '';
		const description = result.content || result.Content || result.snippet || result.Snippet || '';
		
		if (title && url && (url.startsWith('http') || url.startsWith('/'))) {
			// Handle relative URLs
			let finalUrl = url;
			if (url.startsWith('/')) {
				finalUrl = `https://${new URL(url).hostname}${url}`;
			}
			
			// Avoid duplicates
			const isDuplicate = results.some(r => r.url === finalUrl || r.title === title);
			if (!isDuplicate) {
				results.push({
					title: title.substring(0, 200),
					description: description.substring(0, 500),
					url: finalUrl.substring(0, 500),
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
 * Parse DuckDuckGo HTML results
 */
function parseDuckDuckGoResults(html: string, maxResults: number = 10): SearchResult[] {
	const results: SearchResult[] = [];
	
	const resultPattern = /<div[^>]*class="[^"]*result[^"]*"[^>]*>(.*?)<\/div>/gis;
	const matches = Array.from(html.matchAll(resultPattern));
	
	for (const match of matches) {
		if (results.length >= maxResults) break;
		
		const resultHtml = match[1];
		
		const titleMatch = resultHtml.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*>(.*?)<\/a>/is);
		if (!titleMatch) continue;
		
		const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
		if (!title || title.length < 3) continue;
		
		let url = '';
		const urlMatch = resultHtml.match(/href="[^"]*uddg=([^&"]+)"/i);
		if (urlMatch) {
			try {
				url = decodeURIComponent(urlMatch[1]);
			} catch (e) {
				url = urlMatch[1];
			}
		}
		
		if (!url || !url.startsWith('http')) {
			const directUrlMatch = resultHtml.match(/href="(https?:\/\/[^"]+)"/i);
			if (directUrlMatch) {
				url = directUrlMatch[1];
			}
		}
		
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
 * Search using SearXNG API - improved version
 */
async function searchWithSearXNG(query: string, maxResults: number = 10): Promise<SearchResult[]> {
	await randomDelay();
	resetInstanceFailures();
	
	const encodedQuery = encodeURIComponent(query);
	// Try different engine combinations - start without engines (use defaults)
	const engineCombinations = [
		null, // Try without engines first (use instance defaults)
		'duckduckgo',
		'google',
		'bing',
		'google,duckduckgo,bing',
	];
	
	let lastError: Error | null = null;
	const instances = getAvailableInstances();
	
	// Try multiple instances with different engine combinations
	for (let attempt = 0; attempt < instances.length * 3; attempt++) {
		const instance = getNextInstance();
		if (!instance) {
			break;
		}
		
		// Try different engine combinations
		const engines = engineCombinations[attempt % engineCombinations.length];
		
		try {
			const enginesStr = engines || 'default';
			console.log(`Attempt ${attempt + 1}: Using SearXNG instance ${instance} with engines: ${enginesStr}`);
			
			// Build search URL - try without engines parameter first
			let searchUrl = `${instance}/search?q=${encodedQuery}&format=json&pageno=1`;
			if (engines) {
				searchUrl += `&engines=${engines}`;
			}
			
			// Use proxy occasionally
			const useProxy = PROXY_LIST.length > 0 && attempt % 3 === 0;
			
			const response = await withTimeout(
				createFetchWithProxy(searchUrl, useProxy),
				TIMEOUT_CONFIG.HTTP_REQUEST,
				`SearXNG search: ${query}`
			);
			
			if (!response.ok) {
				if (response.status === 429 || response.status === 503) {
					console.warn(`Instance ${instance} rate limited (HTTP ${response.status})`);
					markInstanceFailed(instance);
					await randomDelay(2000, 3000);
					continue;
				}
				if (response.status === 403) {
					console.warn(`Instance ${instance} forbidden (HTTP ${response.status})`);
					markInstanceFailed(instance);
					continue;
				}
				throw new Error(`SearXNG search failed: HTTP ${response.status}`);
			}
			
			const contentType = response.headers.get('content-type') || '';
			let data: any;
			let text = '';
			
			// Always read as text first to check for errors
			text = await response.text();
			
			// Check for blocking/rate limiting indicators
			if (text.includes('Too Many Requests') || text.includes('403 Forbidden') || 
			    text.includes('Rate limit') || text.includes('blocked') ||
			    text.includes('<title>403') || text.includes('Access Denied')) {
				console.warn(`Instance ${instance} blocked or rate limited`);
				markInstanceFailed(instance);
				await randomDelay(2000, 3000);
				continue;
			}
			
			// Try to parse as JSON
			if (contentType.includes('application/json')) {
				try {
					data = JSON.parse(text);
				} catch (e) {
					// Content-type says JSON but parsing failed - might be HTML error page
					if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
						// Looks like JSON, try harder
						const jsonMatch = text.match(/\{[\s\S]*\}/);
						if (jsonMatch) {
							try {
								data = JSON.parse(jsonMatch[0]);
							} catch (e2) {
								throw new Error(`Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`);
							}
						} else {
							throw new Error(`Expected JSON but got ${contentType}`);
						}
					} else {
						throw new Error(`Expected JSON but got ${contentType}`);
					}
				}
			} else {
				// Content-type not JSON, but try to parse anyway
				if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
					try {
						data = JSON.parse(text);
					} catch (e) {
						// Try to extract JSON from HTML
						const jsonMatch = text.match(/\{[\s\S]*\}/);
						if (jsonMatch) {
							try {
								data = JSON.parse(jsonMatch[0]);
							} catch (e2) {
								throw new Error(`Expected JSON but got ${contentType}`);
							}
						} else {
							throw new Error(`Expected JSON but got ${contentType}`);
						}
					}
				} else {
					throw new Error(`Expected JSON but got ${contentType}`);
				}
			}
			
			const results = parseSearXNGResults(data, maxResults);
			
			if (results.length > 0) {
				console.log(`? Successfully extracted ${results.length} results from ${instance}`);
				markInstanceSuccessful(instance);
				return results;
			}
			
			// If no results, try next instance
			if (attempt < instances.length * 2 - 1) {
				console.warn(`No results from ${instance}, trying next instance...`);
				await randomDelay(800, 1500);
				continue;
			}
			
			return [];
			
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			const errorMsg = lastError.message;
			
			if (!errorMsg.includes('fetch failed') && !errorMsg.includes('timeout')) {
				console.warn(`Attempt ${attempt + 1} failed (${instance}): ${errorMsg}`);
			}
			
			markInstanceFailed(instance);
			
			if (attempt < instances.length * 2 - 1) {
				await randomDelay(1000, 2000);
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
		const limit = Math.min(Math.max(1, maxResults), 20);
		
		let results: SearchResult[] = [];
		let engine = 'unknown';
		
		// Try SearXNG first
		try {
			results = await searchWithSearXNG(query, limit);
			engine = 'searxng';
		} catch (searxError) {
			console.warn('SearXNG failed, trying DuckDuckGo fallback...');
			try {
				results = await searchWithDuckDuckGo(query, limit);
				engine = 'duckduckgo';
			} catch (ddgError) {
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
