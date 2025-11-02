import { withTimeout, TIMEOUT_CONFIG } from '../config/timeout-config.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import dns from 'dns';

export interface SearchResult {
	title: string;
	description: string;
	url: string;
}

export interface WebSearchOptions {
	query: string;
	engine: 'google' | 'duckduckgo' | 'bing';
	maxResults?: number;
}

export const webSearchToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'web_search',
		description: 'Search the web using Google, DuckDuckGo, or Bing. Returns the requested number of results (up to 100) with title, description, and URL. No API keys required - uses scraping techniques. The LLM can specify how many results it wants (e.g., 20 results).',
		parameters: {
			type: 'object',
			properties: {
				query: { 
					type: 'string', 
					description: 'Search query' 
				},
				engine: {
					type: 'string',
					enum: ['google', 'duckduckgo', 'bing'],
					description: 'Search engine to use (google, duckduckgo, or bing)',
					default: 'duckduckgo'
				},
				maxResults: {
					type: 'number',
					description: 'Number of results to return (LLM can specify any number from 1 to 100, e.g., 20 results). Default: 100',
					default: 100
				}
			},
			required: ['query'],
		},
	},
};

// Rotating User-Agents pool (real browsers)
const USER_AGENTS = [
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
];

// Free proxy list (public proxies - will rotate)
const FREE_PROXIES = [
	// Note: These are example proxies - in production, fetch from a proxy API or list
	'http://103.149.162.194:80',
	'http://45.79.159.226:8080',
	'http://138.68.60.8:8080',
	'http://51.159.24.172:3169',
	'http://47.74.152.29:8888',
	'http://165.227.71.60:8080',
];

// DNS servers alternativos
const DNS_SERVERS = [
	'8.8.8.8',      // Google DNS
	'8.8.4.4',      // Google DNS
	'1.1.1.1',      // Cloudflare DNS
	'1.0.0.1',      // Cloudflare DNS
	'9.9.9.9',      // Quad9
	'208.67.222.222', // OpenDNS
];

let currentProxyIndex = 0;
let requestCount = 0;
let lastRequestTime = 0;
let proxyFailures = new Map<string, number>();
const MAX_PROXY_FAILURES = 3;

/**
 * Configure DNS resolver
 */
function configureDNS() {
	try {
		dns.setServers(DNS_SERVERS);
	} catch (error) {
		// Silent fail
	}
}

// Configure DNS on module load
configureDNS();

/**
 * Get random User-Agent
 */
function getRandomUserAgent(): string {
	return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Get next proxy (rotate, skip failed ones)
 */
function getNextProxy(): string | null {
	if (FREE_PROXIES.length === 0) return null;
	
	// Remove proxies with too many failures
	const availableProxies = FREE_PROXIES.filter(proxy => {
		const failures = proxyFailures.get(proxy) || 0;
		return failures < MAX_PROXY_FAILURES;
	});
	
	if (availableProxies.length === 0) return null;
	
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
 * Reset proxy failures (periodic cleanup)
 */
function resetProxyFailures(): void {
	if (requestCount % 100 === 0) {
		proxyFailures.clear();
	}
}

/**
 * Random delay between requests (anti-detection)
 */
function randomDelay(min: number = 500, max: number = 2000): Promise<void> {
	const delay = Math.floor(Math.random() * (max - min + 1)) + min;
	return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Create fetch with anti-detection headers
 */
async function createFetchWithAntiDetection(): Promise<void> {
	// Random delay to avoid rate limiting
	const timeSinceLastRequest = Date.now() - lastRequestTime;
	if (timeSinceLastRequest < 1000) {
		await randomDelay(500, 1500);
	}
	lastRequestTime = Date.now();
}

/**
 * Get anti-detection headers
 */
function getAntiDetectionHeaders(): Record<string, string> {
	const userAgent = getRandomUserAgent();
	
	return {
		'User-Agent': userAgent,
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
		'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
		'Accept-Encoding': 'gzip, deflate, br',
		'Connection': 'keep-alive',
		'Upgrade-Insecure-Requests': '1',
		'Sec-Fetch-Dest': 'document',
		'Sec-Fetch-Mode': 'navigate',
		'Sec-Fetch-Site': 'none',
		'Sec-Fetch-User': '?1',
		'Cache-Control': 'max-age=0',
		'DNT': '1',
		'Referer': 'https://www.google.com/',
	};
}

/**
 * Create fetch with proxy support
 */
async function createFetchWithProxy(url: string, useProxy: boolean = false): Promise<Response> {
	const headers = getAntiDetectionHeaders();
	
	if (useProxy) {
		const proxyUrl = getNextProxy();
		if (proxyUrl) {
			try {
				let agent: any;
				if (proxyUrl.startsWith('socks5://')) {
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
				// Mark proxy as failed
				if (proxyUrl) markProxyFailed(proxyUrl);
				// Fallback to direct connection
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
 * Parse Google search results from HTML
 */
function parseGoogleResults(html: string, maxResults: number = 100): SearchResult[] {
	const results: SearchResult[] = [];
	
	// Try multiple patterns for Google results
	// Pattern 1: Standard Google result divs
	const resultPatterns = [
		/<div[^>]*class="[^"]*g[^"]*"[^>]*>(.*?)<\/div><\/div><\/div>/gs,
		/<div[^>]*data-ved[^>]*>(.*?)<\/div><\/div><\/div>/gs,
		/<div[^>]*class="[^"]*tF2Cxc[^"]*"[^>]*>(.*?)<\/div><\/div>/gs,
	];

	let matches: RegExpMatchArray[] = [];
	for (const pattern of resultPatterns) {
		const found = Array.from(html.matchAll(pattern));
		if (found.length > 0) {
			matches = found;
			break;
		}
	}

	const titlePattern = /<h3[^>]*>(.*?)<\/h3>/s;
	const linkPatterns = [
		/<a[^>]*href="([^"]+)"[^>]*>/s,
		/<a[^>]*data-ved[^>]*href="([^"]+)"[^>]*>/s,
	];
	const snippetPatterns = [
		/<span[^>]*class="[^"]*(?:VwiC3b|MUxGbd|yXK7lf)[^"]*"[^>]*>(.*?)<\/span>/s,
		/<div[^>]*class="[^"]*VwiC3b[^"]*"[^>]*>(.*?)<\/div>/s,
	];

	for (const match of matches) {
		if (results.length >= maxResults) break;
		
		const resultHtml = match[1] || match[0];
		
		// Extract title
		const titleMatch = resultHtml.match(titlePattern);
		const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';
		
		// Extract URL
		let url = '';
		for (const linkPattern of linkPatterns) {
			const linkMatch = resultHtml.match(linkPattern);
			if (linkMatch && linkMatch[1]) {
				url = linkMatch[1];
				break;
			}
		}
		
		// Clean Google redirect URLs
		if (url.startsWith('/url?q=')) {
			url = decodeURIComponent(url.split('q=')[1]?.split('&')[0] || '');
		}
		
		// Extract description/snippet
		let description = '';
		for (const snippetPattern of snippetPatterns) {
			const snippetMatch = resultHtml.match(snippetPattern);
			if (snippetMatch && snippetMatch[1]) {
				description = snippetMatch[1].replace(/<[^>]*>/g, '').trim();
				break;
			}
		}
		
		if (title && url && url.startsWith('http')) {
			results.push({
				title: title.substring(0, 200),
				description: description.substring(0, 500),
				url: url.substring(0, 500),
			});
		}
	}
	
	return results;
}

/**
 * Parse DuckDuckGo search results from HTML
 */
function parseDuckDuckGoResults(html: string, maxResults: number = 100): SearchResult[] {
	const results: SearchResult[] = [];
	
	// DuckDuckGo HTML structure
	const resultPatterns = [
		/<div[^>]*class="[^"]*result[^"]*"[^>]*>(.*?)<\/div><\/div>/gs,
		/<div[^>]*class="[^"]*web-result[^"]*"[^>]*>(.*?)<\/div><\/div>/gs,
	];

	let matches: RegExpMatchArray[] = [];
	for (const pattern of resultPatterns) {
		const found = Array.from(html.matchAll(pattern));
		if (found.length > 0) {
			matches = found;
			break;
		}
	}

	const titlePatterns = [
		/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/s,
		/<a[^>]*class="[^"]*result__url[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/s,
	];
	const snippetPatterns = [
		/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>(.*?)<\/a>/s,
		/<span[^>]*class="[^"]*result__snippet[^"]*"[^>]*>(.*?)<\/span>/s,
	];

	for (const match of matches) {
		if (results.length >= maxResults) break;
		
		const resultHtml = match[1] || match[0];
		
		// Extract title and URL
		let title = '';
		let url = '';
		
		for (const titlePattern of titlePatterns) {
			const titleMatch = resultHtml.match(titlePattern);
			if (titleMatch) {
				url = titleMatch[1];
				title = titleMatch[2].replace(/<[^>]*>/g, '').trim();
				break;
			}
		}
		
		// Extract description
		let description = '';
		for (const snippetPattern of snippetPatterns) {
			const snippetMatch = resultHtml.match(snippetPattern);
			if (snippetMatch && snippetMatch[1]) {
				description = snippetMatch[1].replace(/<[^>]*>/g, '').trim();
				break;
			}
		}
		
		if (title && url && (url.startsWith('http') || url.startsWith('//'))) {
			if (url.startsWith('//')) {
				url = 'https:' + url;
			}
			results.push({
				title: title.substring(0, 200),
				description: description.substring(0, 500),
				url: url.substring(0, 500),
			});
		}
	}
	
	return results;
}

/**
 * Search Google
 */
async function searchGoogle(query: string, maxResults: number = 100): Promise<SearchResult[]> {
	await createFetchWithAntiDetection();
	resetProxyFailures();
	
	const encodedQuery = encodeURIComponent(query);
	const url = `https://www.google.com/search?q=${encodedQuery}&num=100&hl=en`;
	
	// Try with proxy first, then fallback to direct
	let lastError: Error | null = null;
	
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const response = await withTimeout(
				createFetchWithProxy(url, attempt === 0),
				TIMEOUT_CONFIG.HTTP_REQUEST,
				`Google search: ${query}`
			);
			
			if (!response.ok) {
				if (response.status === 403 || response.status === 429) {
					// Blocked - try different approach
					await randomDelay(2000, 4000);
					if (attempt === 0) continue;
				}
				throw new Error(`Google search failed: HTTP ${response.status}`);
			}
			
		const html = await response.text();
		const results = parseGoogleResults(html, maxResults);
		
		// If no results, try alternative parsing
		if (results.length === 0) {
			const altResults = parseGoogleResultsAlt(html, maxResults);
			return altResults.length > 0 ? altResults : results;
		}
			
			return results;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			if (attempt === 0) {
				// Wait before retry
				await randomDelay(1000, 2000);
			}
		}
	}
	
	throw new Error(`Google search error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Alternative Google parser (fallback)
 */
function parseGoogleResultsAlt(html: string, maxResults: number = 100): SearchResult[] {
	const results: SearchResult[] = [];
	
	// Try JSON-LD structured data
	const jsonLdPattern = /<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs;
	const jsonLdMatches = Array.from(html.matchAll(jsonLdPattern));
	
	for (const match of jsonLdMatches) {
		try {
			const json = JSON.parse(match[1]);
			if (json['@type'] === 'ItemList' && Array.isArray(json.itemListElement)) {
				for (const item of json.itemListElement) {
					if (results.length >= maxResults) break;
					if (item.item && item.item.name && item.item.url) {
						results.push({
							title: item.item.name.substring(0, 200),
							description: item.item.description || '',
							url: item.item.url.substring(0, 500),
						});
					}
				}
			}
		} catch (e) {
			// Continue parsing
		}
	}
	
	return results;
}

/**
 * Search DuckDuckGo
 */
async function searchDuckDuckGo(query: string, maxResults: number = 100): Promise<SearchResult[]> {
	await createFetchWithAntiDetection();
	resetProxyFailures();
	
	const encodedQuery = encodeURIComponent(query);
	const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
	
	try {
		const response = await withTimeout(
			createFetchWithProxy(url, false), // DuckDuckGo usually doesn't need proxy
			TIMEOUT_CONFIG.HTTP_REQUEST,
			`DuckDuckGo search: ${query}`
		);
		
		if (!response.ok) {
			if (response.status === 403 || response.status === 429) {
				// Blocked - wait and retry
				await randomDelay(2000, 4000);
				const retryResponse = await withTimeout(
					createFetchWithProxy(url, false),
					TIMEOUT_CONFIG.HTTP_REQUEST,
					`DuckDuckGo search retry: ${query}`
				);
				
				if (!retryResponse.ok) {
					throw new Error(`DuckDuckGo search failed: HTTP ${retryResponse.status}`);
				}
				
				const html = await retryResponse.text();
				return parseDuckDuckGoResults(html, maxResults);
			}
			
			throw new Error(`DuckDuckGo search failed: HTTP ${response.status}`);
		}
		
		const html = await response.text();
		return parseDuckDuckGoResults(html, maxResults);
	} catch (error) {
		throw new Error(`DuckDuckGo search error: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Parse Bing search results from HTML
 */
function parseBingResults(html: string, maxResults: number = 100): SearchResult[] {
	const results: SearchResult[] = [];
	
	// Bing uses li.b_algo for results
	const resultPatterns = [
		/<li[^>]*class="[^"]*b_algo[^"]*"[^>]*>[\s\S]*?<\/li>/gi,
		/<div[^>]*class="[^"]*b_title[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
	];

	let matches: RegExpMatchArray[] = [];
	for (const pattern of resultPatterns) {
		const found = Array.from(html.matchAll(pattern));
		if (found.length > 0) {
			matches = found;
			break;
		}
	}

	// Fallback: find all h2 titles with links
	if (matches.length === 0) {
		const h2Pattern = /<h2[^>]*>[\s\S]*?<\/h2>/gi;
		const h2Matches = Array.from(html.matchAll(h2Pattern));
		
		for (const h2Match of h2Matches) {
			if (results.length >= maxResults) break;
			
			const h2Html = h2Match[0];
			const linkMatch = h2Html.match(/<a[^>]*href="([^"]+)"[^>]*>/i);
			const title = h2Html.replace(/<[^>]*>/g, '').trim();
			
			if (linkMatch && linkMatch[1] && title) {
				const url = linkMatch[1];
				if (url.startsWith('http')) {
					// Try to find description near this result
					const descriptionMatch = html.substring(h2Match.index || 0, (h2Match.index || 0) + 800).match(/<p[^>]*class="[^"]*b_caption[^"]*"[^>]*>([^<]+)<\/p>/i) ||
						html.substring(h2Match.index || 0, (h2Match.index || 0) + 800).match(/<p[^>]*>(.*?)<\/p>/i);
					const description = descriptionMatch ? descriptionMatch[1].replace(/<[^>]*>/g, '').trim() : '';
					
					results.push({
						title: title.substring(0, 200),
						description: description.substring(0, 500),
						url: url.substring(0, 500),
					});
				}
			}
		}
		return results;
	}

	// Parse matches
	for (const match of matches) {
		if (results.length >= maxResults) break;
		
		const resultHtml = match[0];
		
		// Extract title from h2
		const titleMatch = resultHtml.match(/<h2[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h2>/i) ||
			resultHtml.match(/<h2[^>]*>(.*?)<\/h2>/i);
		
		let title = '';
		let url = '';
		
		if (titleMatch) {
			if (titleMatch[1]) {
				url = titleMatch[1];
				title = titleMatch[2] ? titleMatch[2].replace(/<[^>]*>/g, '').trim() : '';
			} else {
				title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
				const linkMatch = resultHtml.match(/<a[^>]*href="([^"]+)"[^>]*>/i);
				if (linkMatch) url = linkMatch[1];
			}
		}
		
		// Extract description
		const descriptionMatch = resultHtml.match(/<p[^>]*class="[^"]*b_caption[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ||
			resultHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
		const description = descriptionMatch ? descriptionMatch[1].replace(/<[^>]*>/g, '').trim() : '';
		
		if (title && url && url.startsWith('http')) {
			// Decode HTML entities
			const decodeHtml = (str: string) => {
				return str
					.replace(/&amp;/g, '&')
					.replace(/&lt;/g, '<')
					.replace(/&gt;/g, '>')
					.replace(/&quot;/g, '"')
					.replace(/&#39;/g, "'")
					.replace(/&nbsp;/g, ' ')
					.replace(/&amp;#[0-9]+;/g, '');
			};
			
			url = decodeHtml(url);
			title = decodeHtml(title);
			description = decodeHtml(description);
			
			results.push({
				title: title.substring(0, 200),
				description: description.substring(0, 500),
				url: url.substring(0, 500),
			});
		}
	}
	
	return results;
}

/**
 * Search Bing
 */
async function searchBing(query: string, maxResults: number = 100): Promise<SearchResult[]> {
	await createFetchWithAntiDetection();
	resetProxyFailures();
	
	const encodedQuery = encodeURIComponent(query);
	const url = `https://www.bing.com/search?q=${encodedQuery}&count=${Math.min(maxResults, 100)}`;
	
	let lastError: Error | null = null;
	
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const response = await withTimeout(
				createFetchWithProxy(url, attempt === 0),
				TIMEOUT_CONFIG.HTTP_REQUEST,
				`Bing search: ${query}`
			);
			
			if (!response.ok) {
				if (response.status === 403 || response.status === 429) {
					await randomDelay(2000, 4000);
					if (attempt === 0) continue;
				}
				throw new Error(`Bing search failed: HTTP ${response.status}`);
			}
			
			const html = await response.text();
			const results = parseBingResults(html, maxResults);
			
			return results;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			if (attempt === 0) {
				await randomDelay(1000, 2000);
			}
		}
	}
	
	throw new Error(`Bing search error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Execute web search tool
 */
export async function executeWebSearchTool(
	query: string,
	engine: 'google' | 'duckduckgo' | 'bing' = 'duckduckgo',
	maxResults: number = 100
): Promise<string> {
	try {
		// Limit max results
		const limit = Math.min(maxResults, 100);
		
		// Add random delay (anti-detection)
		await randomDelay(300, 1200);
		
		let results: SearchResult[];
		
		if (engine === 'google') {
			results = await searchGoogle(query, limit);
		} else if (engine === 'bing') {
			results = await searchBing(query, limit);
		} else {
			results = await searchDuckDuckGo(query, limit);
		}
		
		requestCount++;
		
		return JSON.stringify({
			engine,
			query,
			totalResults: results.length,
			results: results,
		}, null, 2);
	} catch (error) {
		return `Error: ${error instanceof Error ? error.message : 'Search failed'}`;
	}
}
