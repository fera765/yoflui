import { withTimeout, TIMEOUT_CONFIG } from '../config/timeout-config.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import dns from 'dns';

// Free proxy list (public proxies - will rotate)
const FREE_PROXIES = [
	'http://103.149.162.194:80',
	'http://45.79.159.226:8080',
	'http://138.68.60.8:8080',
	'http://51.159.24.172:3169',
	'http://47.74.152.29:8888',
	'http://165.227.71.60:8080',
];

const DNS_SERVERS = [
	'8.8.8.8',
	'8.8.4.4',
	'1.1.1.1',
	'1.0.0.1',
	'9.9.9.9',
	'208.67.222.222',
];

// User agents pool
const USER_AGENTS = [
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

let proxyIndex = 0;
const failedProxies = new Set<string>();

function configureDNS() {
	try {
		dns.setServers(DNS_SERVERS);
	} catch (error) {
		// Silent fail
	}
}

function getRandomUserAgent(): string {
	return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getNextProxy(): string | null {
	if (FREE_PROXIES.length === 0) return null;
	
	const availableProxies = FREE_PROXIES.filter(p => !failedProxies.has(p));
	if (availableProxies.length === 0) {
		failedProxies.clear();
		return FREE_PROXIES[proxyIndex % FREE_PROXIES.length];
	}
	
	return availableProxies[proxyIndex % availableProxies.length];
}

function markProxyFailed(proxy: string) {
	failedProxies.add(proxy);
}

function resetProxyFailures() {
	failedProxies.clear();
}

function randomDelay(min: number, max: number): Promise<void> {
	const delay = Math.floor(Math.random() * (max - min + 1)) + min;
	return new Promise(resolve => setTimeout(resolve, delay));
}

async function createFetchWithAntiDetection() {
	configureDNS();
	await randomDelay(100, 500);
}

function getAntiDetectionHeaders(): Record<string, string> {
	const userAgent = getRandomUserAgent();
	return {
		'User-Agent': userAgent,
		'Accept': 'application/json, text/javascript, */*; q=0.01',
		'Accept-Language': 'en-US,en;q=0.9',
		'Accept-Encoding': 'gzip, deflate, br',
		'Connection': 'keep-alive',
		'Referer': 'https://www.google.com/',
		'Origin': 'https://www.google.com',
		'Sec-Fetch-Dest': 'empty',
		'Sec-Fetch-Mode': 'cors',
		'Sec-Fetch-Site': 'same-origin',
	};
}

async function createFetchWithProxy(
	url: string,
	useProxy: boolean = false
): Promise<Response> {
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
					redirect: 'follow',
				});
				
				return response;
			} catch (error) {
				if (proxyUrl) markProxyFailed(proxyUrl);
			}
		}
	}
	
	const response = await fetch(url, {
		method: 'GET',
		headers,
		redirect: 'follow',
	});
	
	return response;
}

/**
 * Extract Google search suggestions
 */
async function getGoogleSuggestions(query: string): Promise<string[]> {
	await createFetchWithAntiDetection();
	resetProxyFailures();
	
	const suggestions: string[] = [];
	let lastError: Error | null = null;
	
	const strategies = [
		{ useProxy: false },
		{ useProxy: true },
	];
	
	for (const strategy of strategies) {
		try {
			// Google Suggest API endpoint
			const url = `https://www.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
			
			await randomDelay(500, 1500);
			
			const response = await withTimeout(
				createFetchWithProxy(url, strategy.useProxy),
				TIMEOUT_CONFIG.HTTP_REQUEST,
				`Google suggestions: ${query}`
			);
			
			const text = await response.text();
			
			// Google returns JSONP: callback([["query",["suggestion1","suggestion2",...]]])
			const jsonpMatch = text.match(/\[\["([^"]+)",\[(.*?)\]\]/);
			if (jsonpMatch) {
				const suggestionsStr = jsonpMatch[2];
				const matches = suggestionsStr.match(/"([^"]+)"/g);
				if (matches) {
					matches.forEach(match => {
						const suggestion = match.replace(/"/g, '');
						if (suggestion && suggestion !== query && !suggestions.includes(suggestion)) {
							suggestions.push(suggestion);
						}
					});
				}
			}
			
			// Alternative: Try parsing full JSON response
			try {
				const jsonStr = text.replace(/^[^(]+\(/, '').replace(/\);?$/, '');
				const json = JSON.parse(jsonStr);
				if (Array.isArray(json) && json.length > 1 && Array.isArray(json[1])) {
					json[1].forEach((suggestion: string) => {
						if (suggestion && suggestion !== query && !suggestions.includes(suggestion)) {
							suggestions.push(suggestion);
						}
					});
				}
			} catch {
				// Not JSON format, continue
			}
			
			if (suggestions.length > 0) {
				return suggestions.slice(0, 10); // Limit to 10 suggestions
			}
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			if (strategy === strategies[strategies.length - 1]) {
				break;
			}
		}
	}
	
	if (lastError) {
		throw new Error(`Google suggestions error: ${lastError.message}`);
	}
	
	return suggestions;
}

/**
 * Extract DuckDuckGo search suggestions
 */
async function getDuckDuckGoSuggestions(query: string): Promise<string[]> {
	await createFetchWithAntiDetection();
	resetProxyFailures();
	
	const suggestions: string[] = [];
	let lastError: Error | null = null;
	
	const strategies = [
		{ useProxy: false },
		{ useProxy: true },
	];
	
	for (const strategy of strategies) {
		try {
			const url = `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&kl=wt-wt`;
			
			await randomDelay(500, 1500);
			
			const response = await withTimeout(
				createFetchWithProxy(url, strategy.useProxy),
				TIMEOUT_CONFIG.HTTP_REQUEST,
				`DuckDuckGo suggestions: ${query}`
			);
			
			const json = await response.json();
			
			if (Array.isArray(json)) {
				json.forEach((item: any) => {
					if (item && item.phrase) {
						const suggestion = item.phrase;
						if (suggestion && suggestion !== query && !suggestions.includes(suggestion)) {
							suggestions.push(suggestion);
						}
					}
				});
			}
			
			if (suggestions.length > 0) {
				return suggestions.slice(0, 10);
			}
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			if (strategy === strategies[strategies.length - 1]) {
				break;
			}
		}
	}
	
	if (lastError) {
		throw new Error(`DuckDuckGo suggestions error: ${lastError.message}`);
	}
	
	return suggestions;
}

/**
 * Extract Bing search suggestions
 */
async function getBingSuggestions(query: string): Promise<string[]> {
	await createFetchWithAntiDetection();
	resetProxyFailures();
	
	const suggestions: string[] = [];
	let lastError: Error | null = null;
	
	const strategies = [
		{ useProxy: false },
		{ useProxy: true },
	];
	
	for (const strategy of strategies) {
		try {
			const url = `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(query)}`;
			
			await randomDelay(500, 1500);
			
			const response = await withTimeout(
				createFetchWithProxy(url, strategy.useProxy),
				TIMEOUT_CONFIG.HTTP_REQUEST,
				`Bing suggestions: ${query}`
			);
			
			const json = await response.json();
			
			if (Array.isArray(json) && json.length > 1 && Array.isArray(json[1])) {
				json[1].forEach((suggestion: string) => {
					if (suggestion && suggestion !== query && !suggestions.includes(suggestion)) {
						suggestions.push(suggestion);
					}
				});
			}
			
			if (suggestions.length > 0) {
				return suggestions.slice(0, 10);
			}
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			if (strategy === strategies[strategies.length - 1]) {
				break;
			}
		}
	}
	
	if (lastError) {
		throw new Error(`Bing suggestions error: ${lastError.message}`);
	}
	
	return suggestions;
}

export const keywordSuggestionsToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'keyword_suggestions',
		description: 'Extract search suggestions (autocomplete keywords) from Google, DuckDuckGo, and Bing for a given query. Returns trending keywords that are currently popular and in high demand.',
		parameters: {
			type: 'object',
			properties: {
				query: {
					type: 'string',
					description: 'The search query to get suggestions for (e.g., "emagrecer", "python tutorial")',
				},
				engines: {
					type: 'array',
					items: {
						type: 'string',
						enum: ['google', 'duckduckgo', 'bing', 'all'],
					},
					description: 'Which search engines to use. Default: ["all"]',
					default: ['all'],
				},
			},
			required: ['query'],
		},
	},
};

export async function executeKeywordSuggestionsTool(
	query: string,
	engines: string[] = ['all']
): Promise<string> {
	if (!query || query.trim().length === 0) {
		return JSON.stringify({
			success: false,
			error: 'Query is required',
		});
	}
	
	const selectedEngines = engines.includes('all') 
		? ['google', 'duckduckgo', 'bing']
		: engines;
	
	const allSuggestions: Record<string, string[]> = {};
	const errors: Record<string, string> = {};
	
	// Fetch suggestions from each engine
	const promises = selectedEngines.map(async (engine) => {
		try {
			let suggestions: string[] = [];
			
			switch (engine) {
				case 'google':
					suggestions = await getGoogleSuggestions(query);
					break;
				case 'duckduckgo':
					suggestions = await getDuckDuckGoSuggestions(query);
					break;
				case 'bing':
					suggestions = await getBingSuggestions(query);
					break;
			}
			
			if (suggestions.length > 0) {
				allSuggestions[engine] = suggestions;
			}
		} catch (error) {
			errors[engine] = error instanceof Error ? error.message : String(error);
		}
	});
	
	await Promise.all(promises);
	
	// Combine all suggestions and remove duplicates
	const combinedSuggestions = new Set<string>();
	Object.values(allSuggestions).forEach(suggestions => {
		suggestions.forEach(s => combinedSuggestions.add(s));
	});
	
	return JSON.stringify({
		success: true,
		query,
		engines: selectedEngines,
		suggestionsByEngine: allSuggestions,
		allSuggestions: Array.from(combinedSuggestions),
		totalSuggestions: combinedSuggestions.size,
		errors: Object.keys(errors).length > 0 ? errors : undefined,
	}, null, 2);
}
