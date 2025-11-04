import { withTimeout, TIMEOUT_CONFIG } from '../config/timeout-config.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import dns from 'dns';
import { createHash, randomBytes } from 'crypto';

export const webScraperToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'web_scraper',
		description: 'Scrape a web page and extract all text content while maintaining HTML structure in markdown format. Preserves visual hierarchy and element tree for better LLM understanding. Returns complete page content without HTML tags but with structural markdown representation. Uses advanced anti-detection techniques to bypass Cloudflare and 403 blocks. NOTE: For research queries, prefer using web_scraper_with_context or intelligent_web_research which include early stopping and prevent unnecessary token usage.',
		parameters: {
			type: 'object',
			properties: {
				url: {
					type: 'string',
					description: 'URL of the webpage to scrape'
				},
				query: {
					type: 'string',
					description: 'Optional: The research query/context. If provided, helps optimize content extraction. For multi-URL scraping with early stopping, use web_scraper_with_context instead.'
				}
			},
			required: ['url'],
		},
	},
};

// Advanced User-Agents with full browser fingerprints
const USER_AGENTS = [
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
];

// Accept-Language variations (more realistic)
const ACCEPT_LANGUAGES = [
	'en-US,en;q=0.9',
	'en-US,en;q=0.9,pt-BR;q=0.8',
	'en-US,en;q=0.9,fr;q=0.8',
	'en-US,en;q=0.9,es;q=0.8',
	'en-US,en;q=0.9,de;q=0.8',
];

// Screen resolutions (for Viewport header simulation)
const SCREEN_RESOLUTIONS = [
	'1920x1080',
	'1366x768',
	'1536x864',
	'1440x900',
	'1280x720',
];

// Browser fingerprints (Canvas/WebGL evasion)
const BROWSER_FINGERPRINTS = [
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
];

// Domain-specific referrers (simulate coming from Google/search)
const REFERRERS = [
	'https://www.google.com/',
	'https://www.google.com/search?q=',
	'https://www.bing.com/',
	'https://duckduckgo.com/',
	'https://www.reddit.com/',
];

let currentProxyIndex = 0;
let requestCount = 0;
let lastRequestTime = 0;
let proxyFailures = new Map<string, number>();
const MAX_PROXY_FAILURES = 3;

// Cookie storage (simulate browser session)
const cookieStore = new Map<string, string>();

// Free proxy list (public proxies - will rotate)
const FREE_PROXIES = [
	'http://103.149.162.194:80',
	'http://45.79.159.226:8080',
	'http://138.68.60.8:8080',
	'http://51.159.24.172:3169',
	'http://47.74.152.29:8888',
	'http://165.227.71.60:8080',
];

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

const DNS_SERVERS = [
	'8.8.8.8',
	'8.8.4.4',
	'1.1.1.1',
	'1.0.0.1',
	'9.9.9.9',
	'208.67.222.222',
];

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
 * Generate browser fingerprint hash (for session consistency)
 */
function generateFingerprint(): string {
	return createHash('md5').update(randomBytes(16)).digest('hex').substring(0, 16);
}

/**
 * Get cookies for domain
 */
function getCookiesForDomain(url: string): string {
	try {
		const urlObj = new URL(url);
		const domain = urlObj.hostname;
		const cookies = cookieStore.get(domain);
		return cookies || '';
	} catch {
		return '';
	}
}

/**
 * Save cookies from response
 */
function saveCookies(url: string, response: Response): void {
	try {
		const urlObj = new URL(url);
		const domain = urlObj.hostname;
		const setCookieHeaders = response.headers.get('set-cookie');
		if (setCookieHeaders) {
			cookieStore.set(domain, setCookieHeaders);
		}
	} catch {
		// Silent fail
	}
}

/**
 * Human-like timing pattern (avoid detection)
 */
function humanLikeDelay(): Promise<void> {
	// Simulate human reading/thinking time
	const baseDelay = Math.random() * 1000 + 500;
	const variance = Math.random() * 500;
	return new Promise(resolve => setTimeout(resolve, baseDelay + variance));
}

/**
 * Get domain-specific headers (underground bypass)
 */
function getDomainSpecificHeaders(url: string, strategy: 'default' | 'aggressive' | 'stealth'): Record<string, string> {
	const urlObj = new URL(url);
	const domain = urlObj.hostname.toLowerCase();
	const baseHeaders = getAntiDetectionHeaders(url, strategy);
	
	// StackOverflow specific headers (underground bypass)
	if (domain.includes('stackoverflow.com')) {
		// Ultra-minimal headers - mimic direct browser navigation from Google
		baseHeaders['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
		baseHeaders['Referer'] = 'https://www.google.com/';
		baseHeaders['Sec-Fetch-Site'] = 'none';
		baseHeaders['Sec-Fetch-Mode'] = 'navigate';
		baseHeaders['Sec-Fetch-Dest'] = 'document';
		baseHeaders['Sec-Fetch-User'] = '?1';
		baseHeaders['Accept-Language'] = 'en-US,en;q=0.9';
		baseHeaders['Accept-Encoding'] = 'gzip, deflate, br';
		baseHeaders['Connection'] = 'keep-alive';
		// Remove ALL suspicious headers
		delete baseHeaders['Viewport-Width'];
		delete baseHeaders['Width'];
		delete baseHeaders['Sec-CH-UA'];
		delete baseHeaders['Sec-CH-UA-Mobile'];
		delete baseHeaders['Sec-CH-UA-Platform'];
		delete baseHeaders['Origin'];
		delete baseHeaders['DNT'];
		delete baseHeaders['Cache-Control'];
		delete baseHeaders['Upgrade-Insecure-Requests'];
		if (baseHeaders['X-Requested-With']) delete baseHeaders['X-Requested-With'];
	}
	
	// Reddit specific headers (underground bypass)
	if (domain.includes('reddit.com')) {
		// Ultra-minimal headers - Reddit is extremely strict
		baseHeaders['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
		baseHeaders['Referer'] = 'https://www.google.com/';
		baseHeaders['Sec-Fetch-Site'] = 'none';
		baseHeaders['Sec-Fetch-Mode'] = 'navigate';
		baseHeaders['Sec-Fetch-Dest'] = 'document';
		baseHeaders['Sec-Fetch-User'] = '?1';
		baseHeaders['Accept-Language'] = 'en-US,en;q=0.9';
		baseHeaders['Accept-Encoding'] = 'gzip, deflate, br';
		baseHeaders['Connection'] = 'keep-alive';
		// Remove ALL suspicious headers - Reddit detects everything
		delete baseHeaders['Viewport-Width'];
		delete baseHeaders['Width'];
		delete baseHeaders['Sec-CH-UA'];
		delete baseHeaders['Sec-CH-UA-Mobile'];
		delete baseHeaders['Sec-CH-UA-Platform'];
		delete baseHeaders['Origin'];
		delete baseHeaders['DNT'];
		delete baseHeaders['Cache-Control'];
		delete baseHeaders['Upgrade-Insecure-Requests'];
		// Don't send cookies initially - Reddit might detect cookie patterns
		if (!baseHeaders['Cookie'] || baseHeaders['Cookie'].length < 50) {
			delete baseHeaders['Cookie'];
		}
	}
	
	return baseHeaders;
}

/**
 * Complete navigation simulation (visit multiple pages like real user)
 * Underground bypass: simulate complete browsing session
 */
async function simulateCompleteNavigation(baseUrl: string, headers: Record<string, string>): Promise<void> {
	try {
		const urlObj = new URL(baseUrl);
		const domain = urlObj.hostname;
		const protocol = urlObj.protocol;
		
		// Step 1: Visit homepage FIRST (critical for cookie establishment)
		const homepage = `${protocol}//${domain}/`;
		const minimalHeaders = {
			'User-Agent': headers['User-Agent'],
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'Accept-Language': 'en-US,en;q=0.9',
			'Accept-Encoding': 'gzip, deflate, br',
			'Connection': 'keep-alive',
			'Referer': 'https://www.google.com/',
		};
		
		const homeResponse = await withTimeout(
			fetch(homepage, {
				method: 'GET',
				headers: minimalHeaders,
			}),
			TIMEOUT_CONFIG.HTTP_REQUEST * 2,
			`Navigation step 1: ${homepage}`
		);
		
		saveCookies(homepage, homeResponse);
		const cookies = getCookiesForDomain(homepage);
		
		// Wait longer to simulate human reading
		await randomDelay(2000, 4000);
		
		// Step 2: Visit common pages (simulate browsing) with cookies
		const commonPages = domain.includes('stackoverflow.com') 
			? ['/questions', '/tags']
			: domain.includes('reddit.com')
			? ['/r/popular', '/']
			: ['/about', '/help'];
		
		for (const page of commonPages.slice(0, 2)) {
			try {
				const pageUrl = `${protocol}//${domain}${page}`;
				const pageHeaders = {
					...minimalHeaders,
					'Referer': homepage,
					'Cookie': cookies || '',
				};
				
				const pageResponse = await withTimeout(
					fetch(pageUrl, {
						method: 'GET',
						headers: pageHeaders,
					}),
					TIMEOUT_CONFIG.HTTP_REQUEST * 2,
					`Navigation step: ${pageUrl}`
				);
				
				saveCookies(pageUrl, pageResponse);
				// Update cookies for next request
				const newCookies = getCookiesForDomain(pageUrl);
				if (newCookies && newCookies !== cookies) {
					headers['Cookie'] = newCookies;
				}
				
				// Simulate human reading time between pages
				await randomDelay(2000, 4000);
			} catch {
				// Continue - don't fail entire navigation
			}
		}
		
		// Step 3: Final delay before target request
		await randomDelay(1500, 3000);
	} catch {
		// Silent fail - continue anyway
	}
}

/**
 * Get advanced anti-detection headers with multiple strategies
 */
function getAntiDetectionHeaders(url: string, strategy: 'default' | 'aggressive' | 'stealth' = 'stealth'): Record<string, string> {
	const userAgent = getRandomUserAgent();
	const acceptLanguage = ACCEPT_LANGUAGES[Math.floor(Math.random() * ACCEPT_LANGUAGES.length)];
	const referer = REFERRERS[Math.floor(Math.random() * REFERRERS.length)];
	const screenRes = SCREEN_RESOLUTIONS[Math.floor(Math.random() * SCREEN_RESOLUTIONS.length)];
	const cookies = getCookiesForDomain(url);
	
	const baseHeaders: Record<string, string> = {
		'User-Agent': userAgent,
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
		'Accept-Language': acceptLanguage,
		'Accept-Encoding': 'gzip, deflate, br',
		'Connection': 'keep-alive',
		'Upgrade-Insecure-Requests': '1',
		'Sec-Fetch-Dest': 'document',
		'Sec-Fetch-Mode': 'navigate',
		'Sec-Fetch-Site': Math.random() > 0.5 ? 'none' : 'same-origin',
		'Sec-Fetch-User': '?1',
		'Cache-Control': 'max-age=0',
		'DNT': '1',
		'Referer': referer,
	};
	
	// For default strategy, use minimal headers (especially for blocked sites)
	if (strategy === 'default') {
		baseHeaders['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
		baseHeaders['Referer'] = 'https://www.google.com/';
		baseHeaders['Sec-Fetch-Site'] = 'none';
		delete baseHeaders['Cache-Control'];
		delete baseHeaders['DNT'];
		delete baseHeaders['Upgrade-Insecure-Requests'];
	}
	
	// Add cookies if available
	if (cookies) {
		baseHeaders['Cookie'] = cookies;
	}
	
	// Stealth mode: add more headers to mimic real browser
	if (strategy === 'stealth') {
		baseHeaders['Viewport-Width'] = screenRes.split('x')[0];
		baseHeaders['Width'] = screenRes.split('x')[0];
		baseHeaders['Sec-CH-UA'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
		baseHeaders['Sec-CH-UA-Mobile'] = '?0';
		baseHeaders['Sec-CH-UA-Platform'] = '"Windows"';
		baseHeaders['Origin'] = new URL(url).origin;
	}
	
	// Aggressive mode: try to bypass Cloudflare
	if (strategy === 'aggressive') {
		baseHeaders['CF-IPCountry'] = 'US';
		baseHeaders['CF-Visitor'] = '{"scheme":"https"}';
		const randomIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
		baseHeaders['X-Forwarded-For'] = randomIP;
		baseHeaders['X-Real-IP'] = randomIP;
		baseHeaders['X-Forwarded-Proto'] = 'https';
		baseHeaders['X-Forwarded-Host'] = new URL(url).hostname;
		baseHeaders['CF-Ray'] = Math.random().toString(36).substring(7);
		baseHeaders['CF-Connecting-IP'] = randomIP;
	}
	
	return baseHeaders;
}

/**
 * Establish session with multiple page visits (advanced bypass)
 */
async function establishAdvancedSession(baseUrl: string, headers: Record<string, string>): Promise<void> {
	try {
		const urlObj = new URL(baseUrl);
		const domain = urlObj.hostname;
		
		// Step 1: Visit homepage with timeout
		const homepage = `${urlObj.protocol}//${domain}/`;
		const homeResponse = await withTimeout(
			fetch(homepage, {
				method: 'GET',
				headers: {
					...headers,
					'Referer': 'https://www.google.com/',
				},
			}),
			TIMEOUT_CONFIG.HTTP_REQUEST,
			`Establish session: ${homepage}`
		);
		
		saveCookies(homepage, homeResponse);
		await randomDelay(800, 1500);
		
		// Step 2: Visit one common page (simulate browsing)
		try {
			const pageUrl = `${urlObj.protocol}//${domain}/about`;
			const pageResponse = await withTimeout(
				fetch(pageUrl, {
					method: 'GET',
					headers: {
						...headers,
						'Referer': homepage,
						'Cookie': getCookiesForDomain(homepage),
					},
				}),
				TIMEOUT_CONFIG.HTTP_REQUEST,
				`Establish session page: ${pageUrl}`
			);
			
			saveCookies(pageUrl, pageResponse);
			await randomDelay(500, 1000);
		} catch {
			// Continue anyway
		}
	} catch {
		// Silent fail - continue anyway
	}
}

/**
 * Create fetch with advanced anti-detection and proxy support
 */
async function createFetchWithProxy(
	url: string, 
	useProxy: boolean = false,
	strategy: 'default' | 'aggressive' | 'stealth' = 'stealth',
	establishSessionFirst: boolean = true
): Promise<Response> {
	// Get domain-specific headers
	const headers = getDomainSpecificHeaders(url, strategy);
	
		// Strategy 1: Complete navigation simulation for blocked sites
	const urlObj = new URL(url);
	const domain = urlObj.hostname.toLowerCase();
	if (establishSessionFirst && (domain.includes('stackoverflow.com') || domain.includes('reddit.com'))) {
		// Use extended timeout for navigation simulation
		const extendedTimeout = 20000; // 20 seconds for navigation
		try {
			await simulateCompleteNavigation(url, headers);
		} catch {
			// Continue anyway
		}
	} else if (establishSessionFirst && strategy === 'stealth') {
		await establishAdvancedSession(url, headers);
	}
	
	// Strategy 2: Try with proxy
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
					redirect: 'follow',
				});
				
				saveCookies(url, response);
				return response;
			} catch (error) {
				if (proxyUrl) markProxyFailed(proxyUrl);
			}
		}
	}
	
	// Strategy 3: Direct connection with advanced headers
	const response = await fetch(url, {
		method: 'GET',
		headers,
		redirect: 'follow',
	});
	
	saveCookies(url, response);
	return response;
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
 * Detect if response is a block page (not real content)
 */
function isBlockPage(html: string, url: string): boolean {
	const urlObj = new URL(url);
	const domain = urlObj.hostname.toLowerCase();
	
	// Domain-specific block detection
	if (domain.includes('stackoverflow.com')) {
		// StackOverflow block pages are usually very short or contain specific text
		if (html.length < 1000) {
			return true; // Definitely blocked
		}
		if (html.length < 3000) {
			const lowerHtml = html.toLowerCase();
			return lowerHtml.includes('blocked') || lowerHtml.includes('access denied') || lowerHtml.includes('forbidden');
		}
		// If HTML is substantial (>3000 chars), it's likely real content even with block keywords
		return false;
	}
	
	if (domain.includes('reddit.com')) {
		// Reddit block pages contain specific text
		const lowerHtml = html.toLowerCase();
		const hasBlockText = lowerHtml.includes('you\'ve been blocked') || 
			lowerHtml.includes('blocked by network security') ||
			lowerHtml.includes('log in to your reddit account');
		
		if (hasBlockText) {
			return true; // Definitely blocked
		}
		
		// Very short responses are likely blocks
		if (html.length < 1000) {
			return true;
		}
		
		// Reddit can serve content even with keywords if it's substantial
		if (html.length > 5000 && !hasBlockText) {
			return false; // Likely real content
		}
		return false;
	}
	
	const blockIndicators = [
		'access denied',
		'blocked',
		'forbidden',
		'cloudflare',
		'checking your browser',
		'please enable cookies',
		'you have been blocked',
		'rate limit',
		'too many requests',
	];
	
	const htmlLower = html.toLowerCase();
	const hasBlockIndicator = blockIndicators.some(indicator => htmlLower.includes(indicator));
	
	// Check if content is suspiciously short (likely a block page)
	const isShort = html.length < 2000 && hasBlockIndicator;
	
	return isShort || (hasBlockIndicator && html.length < 5000);
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
 * Scrape webpage with multiple fallback strategies
 */
async function scrapeWebPage(url: string): Promise<string> {
	await createFetchWithAntiDetection();
	resetProxyFailures();
	
	const urlObj = new URL(url);
	const domain = urlObj.hostname.toLowerCase();
	const isBlockedSite = domain.includes('stackoverflow.com') || domain.includes('reddit.com');
	
	let lastError: Error | null = null;
	
	// Enhanced strategies for blocked sites - ultra-minimal approach first
	const strategies: Array<{ strategy: 'default' | 'aggressive' | 'stealth', useProxy: boolean, establishSession: boolean }> = isBlockedSite
		? [
			// For blocked sites: start with ultra-minimal, no navigation (direct approach)
			{ strategy: 'default', useProxy: false, establishSession: false }, // First: minimal headers, no navigation
			{ strategy: 'default', useProxy: false, establishSession: true },  // Second: minimal headers + navigation
			{ strategy: 'default', useProxy: true, establishSession: false },  // Third: minimal + proxy
			{ strategy: 'stealth', useProxy: false, establishSession: false }, // Fourth: stealth, no navigation
			{ strategy: 'aggressive', useProxy: false, establishSession: false }, // Fifth: aggressive headers
		]
		: [
			// For normal sites: standard approach
			{ strategy: 'stealth', useProxy: false, establishSession: true },
			{ strategy: 'stealth', useProxy: false, establishSession: false },
			{ strategy: 'aggressive', useProxy: false, establishSession: false },
			{ strategy: 'aggressive', useProxy: true, establishSession: false },
			{ strategy: 'default', useProxy: false, establishSession: false },
		];
	
	for (let attempt = 0; attempt < strategies.length; attempt++) {
		const { strategy, useProxy, establishSession } = strategies[attempt];
		
		try {
			// Human-like delay between attempts (reduced to avoid timeouts)
			if (attempt > 0) {
				await randomDelay(1000, 2000);
			}
			
			const response = await withTimeout(
				createFetchWithProxy(url, useProxy, strategy, establishSession),
				TIMEOUT_CONFIG.HTTP_REQUEST * 1.5,
				`Web scrape (${strategy}): ${url}`
			);
			
			const html = await response.text();
			
			// Check for Cloudflare challenge or block page
			if (isBlockPage(html, url)) {
				// Wait longer and retry with different strategy
				if (attempt < strategies.length - 1) {
					await randomDelay(2000, 4000);
					continue;
				}
			}
			
			if (!response.ok) {
				if (response.status === 403 || response.status === 429) {
					// Try next strategy
					if (attempt < strategies.length - 1) {
						await randomDelay(2000, 4000);
						continue;
					}
				}
				
				// Last attempt - return partial content if available
				if (html.length > 100) {
					const content = extractStructuredContent(html);
					if (content.length > 100) {
						return content + '\n\nℹ️ Note: Received HTTP ' + response.status + ' but content was extracted.';
					}
				}
				
				throw new Error(`Web scrape failed: HTTP ${response.status}`);
			}
			
			const content = extractStructuredContent(html);
			
			if (content.length === 0 && html.length > 1000) {
				// Content extraction failed but HTML is present - return raw processed HTML
				return htmlToMarkdown(html).substring(0, 50000);
			}
			
			return content;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			
			// If it's a timeout or connection error, try next strategy
			if (error instanceof Error && (
				error.message.includes('timeout') || 
				error.message.includes('ECONNREFUSED') ||
				error.message.includes('ENOTFOUND')
			)) {
				if (attempt < strategies.length - 1) {
					continue;
				}
			}
			
			// Last attempt
			if (attempt === strategies.length - 1) {
				break;
			}
		}
	}
	
	throw new Error(`Web scrape error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Execute web scraper tool
 */
export async function executeWebScraperTool(url: string, query?: string): Promise<string> {
	try {
		// Validate URL
		if (!url.startsWith('http://') && !url.startsWith('https://')) {
			throw new Error('Invalid URL: must start with http:// or https://');
		}
		
		// Add random delay (anti-detection)
		await randomDelay(300, 1200);
		
		const content = await scrapeWebPage(url);
		
		requestCount++;
		
		// If query provided, could optimize content extraction (future enhancement)
		// For now, just include query in metadata
		return JSON.stringify({
			url,
			query: query || null,
			contentLength: content.length,
			content: content,
		}, null, 2);
	} catch (error) {
		return `Error: ${error instanceof Error ? error.message : 'Scraping failed'}`;
	}
}
