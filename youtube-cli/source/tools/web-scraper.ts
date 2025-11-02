import { withTimeout, TIMEOUT_CONFIG } from '../config/timeout-config.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import dns from 'dns';

export const webScraperToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'web_scraper',
		description: 'Scrape a web page and extract all text content while maintaining HTML structure in markdown format. Preserves visual hierarchy and element tree for better LLM understanding. Returns complete page content without HTML tags but with structural markdown representation.',
		parameters: {
			type: 'object',
			properties: {
				url: {
					type: 'string',
					description: 'URL of the webpage to scrape'
				}
			},
			required: ['url'],
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
	'http://103.149.162.194:80',
	'http://45.79.159.226:8080',
	'http://138.68.60.8:8080',
	'http://51.159.24.172:3169',
	'http://47.74.152.29:8888',
	'http://165.227.71.60:8080',
];

// DNS servers alternativos
const DNS_SERVERS = [
	'8.8.8.8',
	'8.8.4.4',
	'1.1.1.1',
	'1.0.0.1',
	'9.9.9.9',
	'208.67.222.222',
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
				if (proxyUrl) markProxyFailed(proxyUrl);
			}
		}
	}
	
	return fetch(url, {
		method: 'GET',
		headers,
	});
}

/**
 * Convert HTML to structured markdown maintaining element tree
 */
function htmlToMarkdown(html: string): string {
	// Remove script and style tags
	html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
	html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
	html = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
	
	// Convert headings
	html = html.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
	html = html.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
	html = html.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
	html = html.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');
	html = html.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n##### $1\n');
	html = html.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n###### $1\n');
	
	// Convert strong/bold
	html = html.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
	html = html.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
	
	// Convert emphasis/italic
	html = html.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
	html = html.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
	
	// Convert links
	html = html.replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
	
	// Convert lists
	html = html.replace(/<ul[^>]*>/gi, '\n');
	html = html.replace(/<\/ul>/gi, '\n');
	html = html.replace(/<ol[^>]*>/gi, '\n');
	html = html.replace(/<\/ol>/gi, '\n');
	html = html.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
	
	// Convert paragraphs
	html = html.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');
	
	// Convert line breaks
	html = html.replace(/<br[^>]*>/gi, '\n');
	html = html.replace(/<hr[^>]*>/gi, '\n---\n');
	
	// Convert code blocks
	html = html.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n');
	html = html.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
	
	// Convert blockquotes
	html = html.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n');
	
	// Convert tables
	html = html.replace(/<table[^>]*>/gi, '\n');
	html = html.replace(/<\/table>/gi, '\n');
	html = html.replace(/<thead[^>]*>/gi, '');
	html = html.replace(/<\/thead>/gi, '');
	html = html.replace(/<tbody[^>]*>/gi, '');
	html = html.replace(/<\/tbody>/gi, '');
	html = html.replace(/<tr[^>]*>/gi, '\n');
	html = html.replace(/<\/tr>/gi, '');
	html = html.replace(/<th[^>]*>([\s\S]*?)<\/th>/gi, '| $1 ');
	html = html.replace(/<td[^>]*>([\s\S]*?)<\/td>/gi, '| $1 ');
	
	// Remove remaining HTML tags
	html = html.replace(/<[^>]+>/g, '');
	
	// Decode HTML entities
	html = html
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/&copy;/g, '?')
		.replace(/&reg;/g, '?')
		.replace(/&trade;/g, '?')
		.replace(/&#8211;/g, '?')
		.replace(/&#8212;/g, '?')
		.replace(/&#8220;/g, '"')
		.replace(/&#8221;/g, '"')
		.replace(/&#8216;/g, "'")
		.replace(/&#8217;/g, "'");
	
	// Clean up whitespace
	html = html.replace(/\n{3,}/g, '\n\n');
	html = html.replace(/[ \t]+/g, ' ');
	html = html.trim();
	
	return html;
}

/**
 * Extract structured content from HTML
 */
function extractStructuredContent(html: string): string {
	// Remove head, script, style, meta, etc.
	const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
	if (bodyMatch) {
		html = bodyMatch[1];
	}
	
	// Convert to markdown
	const markdown = htmlToMarkdown(html);
	
	// Limit size to prevent token overflow (keep first 50000 chars)
	const maxLength = 50000;
	if (markdown.length > maxLength) {
		return markdown.substring(0, maxLength) + '\n\n... (content truncated)';
	}
	
	return markdown;
}

/**
 * Scrape webpage
 */
async function scrapeWebPage(url: string): Promise<string> {
	await createFetchWithAntiDetection();
	resetProxyFailures();
	
	let lastError: Error | null = null;
	
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const response = await withTimeout(
				createFetchWithProxy(url, attempt === 0),
				TIMEOUT_CONFIG.HTTP_REQUEST,
				`Web scrape: ${url}`
			);
			
			if (!response.ok) {
				if (response.status === 403 || response.status === 429) {
					await randomDelay(2000, 4000);
					if (attempt === 0) continue;
				}
				throw new Error(`Web scrape failed: HTTP ${response.status}`);
			}
			
			const html = await response.text();
			const content = extractStructuredContent(html);
			
			return content;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			if (attempt === 0) {
				await randomDelay(1000, 2000);
			}
		}
	}
	
	throw new Error(`Web scrape error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Execute web scraper tool
 */
export async function executeWebScraperTool(url: string): Promise<string> {
	try {
		// Validate URL
		if (!url.startsWith('http://') && !url.startsWith('https://')) {
			throw new Error('Invalid URL: must start with http:// or https://');
		}
		
		// Add random delay (anti-detection)
		await randomDelay(300, 1200);
		
		const content = await scrapeWebPage(url);
		
		requestCount++;
		
		return JSON.stringify({
			url,
			contentLength: content.length,
			content: content,
		}, null, 2);
	} catch (error) {
		return `Error: ${error instanceof Error ? error.message : 'Scraping failed'}`;
	}
}
