import { withTimeout, TIMEOUT_CONFIG } from '../config/timeout-config.js';
import * as cheerio from 'cheerio';
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
	maxResults?: number;
}

export const webSearchToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'web_search',
		description: 'Search the web using Google and DuckDuckGo. Returns results with title, description, and URL. Uses proxies and DNS alternatives to avoid blocking.',
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

// Free proxy list (will rotate)
const FREE_PROXIES = [
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
let proxyFailures = new Map<string, number>();
const MAX_PROXY_FAILURES = 3;

// Configure DNS
try {
	dns.setServers(DNS_SERVERS);
} catch (e) {
	// Ignore
}

/**
 * Get next proxy
 */
function getNextProxy(): string | null {
	if (FREE_PROXIES.length === 0) return null;
	
	const availableProxies = FREE_PROXIES.filter(proxy => {
		const failures = proxyFailures.get(proxy) || 0;
		return failures < MAX_PROXY_FAILURES;
	});
	
	if (availableProxies.length === 0) {
		proxyFailures.clear();
		return FREE_PROXIES[0] || null;
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
 * Random delay
 */
function randomDelay(min: number = 500, max: number = 2000): Promise<void> {
	const delay = Math.floor(Math.random() * (max - min + 1)) + min;
	return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Get random User-Agent
 */
function getRandomUserAgent(): string {
	const userAgents = [
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
		'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	];
	return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Create fetch with proxy
 */
async function fetchWithProxy(url: string, useProxy: boolean = false): Promise<Response> {
	const headers = {
		'User-Agent': getRandomUserAgent(),
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
		'Accept-Language': 'en-US,en;q=0.9',
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
		'Origin': 'https://www.google.com',
	};
	
	if (useProxy) {
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

				// @ts-ignore
				return await fetch(url, {
					method: 'GET',
					headers,
					// @ts-ignore
					agent,
				});
			} catch (error) {
				markProxyFailed(proxyUrl);
			}
		}
	}
	
	return fetch(url, {
		method: 'GET',
		headers,
	});
}

/**
 * Parse Google search results
 */
function parseGoogleResults(html: string, maxResults: number = 10): SearchResult[] {
	const results: SearchResult[] = [];
	const $ = cheerio.load(html);
	
	// Google uses various selectors for results
	$('div.g, div[data-ved]').each((_, element) => {
		if (results.length >= maxResults) return false;
		
		const $el = $(element);
		
		// Find title (h3)
		const $title = $el.find('h3');
		if ($title.length === 0) return;
		
		const title = $title.text().trim();
		if (!title || title.length < 3) return;
		
		// Skip navigation elements
		if (title.toLowerCase().includes('google') || 
		    title.toLowerCase().includes('search') ||
		    title.toLowerCase().includes('sign in')) {
			return;
		}
		
		// Find URL
		let url = '';
		const $link = $el.find('a[href]').first();
		if ($link.length > 0) {
			url = $link.attr('href') || '';
			
			// Handle Google redirect URLs
			if (url.startsWith('/url?q=')) {
				const match = url.match(/q=([^&]+)/);
				if (match) {
					try {
						url = decodeURIComponent(match[1]);
					} catch (e) {
						url = match[1];
					}
				}
			}
			
			// Handle data-ved URLs
			if (url.startsWith('/url')) {
				const match = html.match(/href="\/url\?q=([^&"]+)"/);
				if (match) {
					try {
						url = decodeURIComponent(match[1]);
					} catch (e) {
						url = match[1];
					}
				}
			}
		}
		
		// Find description/snippet
		let description = '';
		const $snippet = $el.find('span[class*="VwiC3b"], span[class*="MUxGbd"], div[class*="VwiC3b"]');
		if ($snippet.length > 0) {
			description = $snippet.first().text().trim();
		}
		
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
	});
	
	return results.slice(0, maxResults);
}

/**
 * Parse DuckDuckGo search results
 */
function parseDuckDuckGoResults(html: string, maxResults: number = 10): SearchResult[] {
	const results: SearchResult[] = [];
	const $ = cheerio.load(html);
	
	// DuckDuckGo uses .result or .results_links
	$('.result, .results_links').each((_, element) => {
		if (results.length >= maxResults) return false;
		
		const $el = $(element);
		
		// Find title - can be in h2.result__title or a.result__a
		let title = '';
		const $title = $el.find('h2.result__title, .result__title');
		if ($title.length > 0) {
			title = $title.text().trim();
		} else {
			const $link = $el.find('a.result__a');
			if ($link.length > 0) {
				title = $link.text().trim();
			}
		}
		
		if (!title || title.length < 3) return;
		
		// Skip ads
		if ($el.hasClass('result--ad') || $el.find('.result--ad').length > 0) {
			return;
		}
		
		// Find URL
		let url = '';
		const $link = $el.find('a.result__a');
		if ($link.length > 0) {
			const href = $link.attr('href') || '';
			
			// Skip ad URLs
			if (href.includes('y.js') || href.includes('aclick') || href.includes('bing.com')) {
				return;
			}
			
			if (href.includes('uddg=')) {
				const match = href.match(/uddg=([^&]+)/);
				if (match) {
					try {
						url = decodeURIComponent(match[1]);
					} catch (e) {
						url = match[1];
					}
				}
			} else if (href.startsWith('http')) {
				url = href;
			}
		}
		
		// Find description - can be in .result__snippet, .result__body, or .result__body span
		let description = '';
		const $snippet = $el.find('.result__snippet, .result__body span, .result__body');
		if ($snippet.length > 0) {
			// Get text from snippet, excluding title
			$snippet.each((_, snippetEl) => {
				const snippetText = $(snippetEl).text().trim();
				if (snippetText && !snippetText.includes(title) && snippetText.length > description.length) {
					description = snippetText;
				}
			});
		}
		
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
	});
	
	return results.slice(0, maxResults);
}

/**
 * Search Google
 */
async function searchGoogle(query: string, maxResults: number = 10): Promise<SearchResult[]> {
	const encodedQuery = encodeURIComponent(query);
	const url = `https://www.google.com/search?q=${encodedQuery}&num=${Math.min(maxResults, 20)}&hl=en`;
	
	// Try with proxy first, then direct
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const useProxy = attempt < 2;
			
			console.log(`Google attempt ${attempt + 1}: ${useProxy ? 'with proxy' : 'direct'}`);
			
			await randomDelay(500, 1500);
			
			const response = await withTimeout(
				fetchWithProxy(url, useProxy),
				TIMEOUT_CONFIG.HTTP_REQUEST,
				`Google search: ${query}`
			);
			
			if (!response.ok) {
				if (response.status === 403 || response.status === 429) {
					console.warn(`Google blocked (HTTP ${response.status}), retrying...`);
					await randomDelay(2000, 4000);
					continue;
				}
				throw new Error(`Google search failed: HTTP ${response.status}`);
			}
			
			const html = await response.text();
			
			// Check for blocking
			if (html.includes('captcha') || html.includes('CAPTCHA') || 
			    html.includes('Our systems have detected') || html.length < 5000) {
				console.warn('Google returned CAPTCHA or blocked page');
				await randomDelay(3000, 5000);
				continue;
			}
			
			const results = parseGoogleResults(html, maxResults);
			
			if (results.length > 0) {
				console.log(`? Google: extracted ${results.length} results`);
				return results;
			}
			
			console.warn('Google: no results found, retrying...');
			await randomDelay(1000, 2000);
			
		} catch (error) {
			console.warn(`Google attempt ${attempt + 1} failed: ${error instanceof Error ? error.message : String(error)}`);
			if (attempt < 2) {
				await randomDelay(1000, 2000);
			}
		}
	}
	
	throw new Error('Google search failed after all attempts');
}

/**
 * Create fetch for DuckDuckGo with specific headers
 */
async function fetchDuckDuckGo(url: string, useProxy: boolean = false): Promise<Response> {
	const headers = {
		'User-Agent': getRandomUserAgent(),
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
		'Accept-Language': 'en-US,en;q=0.9',
		'Accept-Encoding': 'gzip, deflate, br',
		'Connection': 'keep-alive',
		'Upgrade-Insecure-Requests': '1',
		'Referer': 'https://duckduckgo.com/',
	};
	
	if (useProxy) {
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

				// @ts-ignore
				return await fetch(url, {
					method: 'GET',
					headers,
					// @ts-ignore
					agent,
				});
			} catch (error) {
				markProxyFailed(proxyUrl);
			}
		}
	}
	
	return fetch(url, {
		method: 'GET',
		headers,
	});
}

/**
 * Search DuckDuckGo
 */
async function searchDuckDuckGo(query: string, maxResults: number = 10): Promise<SearchResult[]> {
	const encodedQuery = encodeURIComponent(query);
	const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
	
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const useProxy = attempt < 2;
			
			console.log(`DuckDuckGo attempt ${attempt + 1}: ${useProxy ? 'with proxy' : 'direct'}`);
			
			await randomDelay(1000, 2000);
			
			const response = await withTimeout(
				fetchDuckDuckGo(url, useProxy),
				TIMEOUT_CONFIG.HTTP_REQUEST,
				`DuckDuckGo search: ${query}`
			);
			
			if (!response.ok) {
				if (response.status === 403) {
					console.warn(`DuckDuckGo blocked (HTTP ${response.status}), retrying direct...`);
					await randomDelay(3000, 5000);
					continue;
				}
				throw new Error(`DuckDuckGo search failed: HTTP ${response.status}`);
			}
			
			const html = await response.text();
			
			// Check for blocking
			if (html.includes('403') || html.includes('blocked') || html.length < 5000) {
				console.warn('DuckDuckGo returned blocked page, retrying...');
				await randomDelay(3000, 5000);
				continue;
			}
			const results = parseDuckDuckGoResults(html, maxResults);
			
			if (results.length > 0) {
				console.log(`? DuckDuckGo: extracted ${results.length} results`);
				return results;
			}
			
			console.warn('DuckDuckGo: no results found, retrying...');
			await randomDelay(1000, 2000);
			
		} catch (error) {
			console.warn(`DuckDuckGo attempt ${attempt + 1} failed: ${error instanceof Error ? error.message : String(error)}`);
			if (attempt < 2) {
				await randomDelay(1000, 2000);
			}
		}
	}
	
	throw new Error('DuckDuckGo search failed after all attempts');
}

/**
 * Execute web search tool
 */
export async function executeWebSearchTool(
	query: string,
	maxResults: number = 10
): Promise<string> {
	try {
		const limit = Math.min(Math.max(1, maxResults), 20);
		
		let results: SearchResult[] = [];
		let engine = 'unknown';
		
		// Try Google first
		try {
			results = await searchGoogle(query, limit);
			engine = 'google';
		} catch (googleError) {
			console.warn('Google failed, trying DuckDuckGo...');
			// Try DuckDuckGo
			try {
				results = await searchDuckDuckGo(query, limit);
				engine = 'duckduckgo';
			} catch (ddgError) {
				throw new Error(`Both Google and DuckDuckGo failed. Google: ${googleError instanceof Error ? googleError.message : String(googleError)}. DuckDuckGo: ${ddgError instanceof Error ? ddgError.message : String(ddgError)}`);
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
