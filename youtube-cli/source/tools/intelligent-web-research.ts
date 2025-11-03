import OpenAI from 'openai';
import { getConfig } from '../llm-config.js';
import { loadQwenCredentials, getValidAccessToken } from '../qwen-oauth.js';
import { executeWebSearchTool } from './web-search.js';
import { executeWebScraperTool } from './web-scraper.js';
import { withTimeout, TIMEOUT_CONFIG } from '../config/timeout-config.js';

export interface IntelligentResearchOptions {
	query: string;
	maxSites?: number;
	minSites?: number;
}

/**
 * Intelligent Web Research Tool
 * 
 * This tool intelligently manages web research by:
 * 1. Performing web search
 * 2. Analyzing results to determine relevance
 * 3. Scraping sites incrementally (1-2 at a time)
 * 4. Checking if sufficient information was found
 * 5. Stopping when enough information is available
 * 
 * This prevents unnecessary token usage by not scraping all sites.
 */
export const intelligentWebResearchToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'intelligent_web_research',
		description: 'Intelligently research a topic by searching the web and scraping only the most relevant sites. Stops when sufficient information is found. This is more efficient than scraping all sites - it analyzes results first, then scrapes incrementally until enough information is gathered.',
		parameters: {
			type: 'object',
			properties: {
				query: {
					type: 'string',
					description: 'Research query or question'
				},
				maxSites: {
					type: 'number',
					description: 'Maximum sites to scrape (default: 3, enough for most queries)',
					default: 3,
					minimum: 1,
					maximum: 5
				},
				minSites: {
					type: 'number',
					description: 'Minimum sites to scrape before stopping (default: 1)',
					default: 1,
					minimum: 1,
					maximum: 3
				}
			},
			required: ['query'],
		},
	},
};

/**
 * Analyze search results to determine which URLs are most relevant
 */
async function analyzeSearchResults(
	searchResults: any,
	query: string,
	openai: OpenAI
): Promise<string[]> {
	try {
		// Extract URLs from search results
		const results = searchResults.results || [];
		const urls = results.slice(0, 5).map((r: any) => r.url).filter(Boolean);
		
		if (urls.length === 0) return [];
		
		// If only 1-2 URLs, return all
		if (urls.length <= 2) return urls;
		
		// Use LLM to analyze relevance and select top 2-3 most relevant
		const analysisPrompt = `You are analyzing web search results to determine which URLs are most relevant to answer this query: "${query}"

Search Results:
${results.map((r: any, i: number) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   Description: ${r.description?.substring(0, 150)}...`).join('\n\n')}

Analyze these results and identify the TOP 2-3 most relevant URLs that would best answer the query. Consider:
- Title relevance
- Description relevance  
- Domain authority
- Likelihood of containing comprehensive information

Return ONLY a JSON array of URLs, like: ["url1", "url2", "url3"]
Do not include explanations, just the URLs array.`;

		const response = await withTimeout(
			openai.chat.completions.create({
				model: getConfig().model,
				messages: [
					{ role: 'system', content: 'You are a relevance analyzer. Return only JSON arrays of URLs.' },
					{ role: 'user', content: analysisPrompt }
				],
				temperature: 0.3,
			}),
			TIMEOUT_CONFIG.LLM_COMPLETION,
			'Analyze search results'
		);

		const content = response.choices[0]?.message?.content || '';
		
		// Try to extract JSON array from response
		const jsonMatch = content.match(/\[[\s\S]*?\]/);
		if (jsonMatch) {
			try {
				const selectedUrls = JSON.parse(jsonMatch[0]);
				if (Array.isArray(selectedUrls) && selectedUrls.length > 0) {
					return selectedUrls.slice(0, 3);
				}
			} catch (e) {
				// Fall through to default
			}
		}
		
		// Default: return top 2 URLs
		return urls.slice(0, 2);
	} catch (error) {
		// On error, return top 2 URLs
		const results = searchResults.results || [];
		return results.slice(0, 2).map((r: any) => r.url).filter(Boolean);
	}
}

/**
 * Check if scraped content contains sufficient information to answer the query
 */
async function checkIfSufficient(
	query: string,
	scrapedContent: string[],
	openai: OpenAI
): Promise<{ sufficient: boolean; confidence: number; summary: string }> {
	try {
		const combinedContent = scrapedContent
			.map((content, i) => `[Site ${i + 1}]\n${content.substring(0, 2000)}`)
			.join('\n\n---\n\n');
		
		const checkPrompt = `Analyze if the scraped web content below contains sufficient information to fully answer this query: "${query}"

Scraped Content:
${combinedContent}

Determine:
1. Is there sufficient information to answer the query completely? (true/false)
2. Confidence level (0-100)
3. A brief summary of what information was found

Return ONLY a JSON object: {"sufficient": true/false, "confidence": 0-100, "summary": "brief summary"}
Do not include explanations, just the JSON object.`;

		const response = await withTimeout(
			openai.chat.completions.create({
				model: getConfig().model,
				messages: [
					{ role: 'system', content: 'You are an information sufficiency checker. Return only JSON objects.' },
					{ role: 'user', content: checkPrompt }
				],
				temperature: 0.2,
			}),
			TIMEOUT_CONFIG.LLM_COMPLETION,
			'Check information sufficiency'
		);

		const content = response.choices[0]?.message?.content || '';
		
		// Try to extract JSON object
		const jsonMatch = content.match(/\{[\s\S]*?\}/);
		if (jsonMatch) {
			try {
				const result = JSON.parse(jsonMatch[0]);
				return {
					sufficient: result.sufficient === true || result.sufficient === 'true',
					confidence: result.confidence || 0,
					summary: result.summary || '',
				};
			} catch (e) {
				// Fall through
			}
		}
		
		// Default: if we have content, assume sufficient
		return {
			sufficient: scrapedContent.length > 0 && scrapedContent.some(c => c.length > 500),
			confidence: 70,
			summary: 'Content scraped successfully',
		};
	} catch (error) {
		// On error, assume sufficient if we have content
		return {
			sufficient: scrapedContent.length > 0 && scrapedContent.some(c => c.length > 500),
			confidence: 60,
			summary: 'Content available',
		};
	}
}

/**
 * Execute intelligent web research
 */
export async function executeIntelligentWebResearchTool(
	query: string,
	maxSites: number = 3,
	minSites: number = 1
): Promise<string> {
	try {
		const config = getConfig();
		const qwenCreds = loadQwenCredentials();
		let endpoint = config.endpoint;
		let apiKey = config.apiKey || 'not-needed';

		if (qwenCreds?.access_token) {
			const validToken = await getValidAccessToken();
			if (validToken) {
				apiKey = validToken;
				const resourceUrl = qwenCreds.resource_url || 'portal.qwen.ai';
				endpoint = `https://${resourceUrl}/v1`;
			}
		}

		const openai = new OpenAI({ baseURL: endpoint, apiKey });

		// Step 1: Perform web search
		console.log(`?? Searching web for: "${query}"`);
		const searchResultsJson = await executeWebSearchTool(query, 5);
		const searchResults = JSON.parse(searchResultsJson);
		
		if (!searchResults.results || searchResults.results.length === 0) {
			return JSON.stringify({
				query,
				status: 'no_results',
				message: 'No search results found',
				sites_scraped: 0,
				content: [],
			}, null, 2);
		}

		// Step 2: Analyze and select most relevant URLs
		console.log(`?? Analyzing ${searchResults.results.length} search results...`);
		const relevantUrls = await analyzeSearchResults(searchResults, query, openai);
		
		if (relevantUrls.length === 0) {
			return JSON.stringify({
				query,
				status: 'no_relevant_urls',
				search_results: searchResults,
				message: 'No relevant URLs found after analysis',
				sites_scraped: 0,
				content: [],
			}, null, 2);
		}

		// Step 3: Scrape incrementally and check sufficiency
		const scrapedContent: Array<{ url: string; content: string }> = [];
		let sitesScraped = 0;
		
		// Scrape sites incrementally (1-2 at a time)
		for (let i = 0; i < Math.min(relevantUrls.length, maxSites); i++) {
			const url = relevantUrls[i];
			
			console.log(`?? Scraping site ${i + 1}/${Math.min(relevantUrls.length, maxSites)}: ${url}`);
			
			try {
				const content = await executeWebScraperTool(url);
				scrapedContent.push({ url, content });
				sitesScraped++;
				
				// Check if we have enough information (after minimum sites)
				if (sitesScraped >= minSites) {
					const sufficiencyCheck = await checkIfSufficient(
						query,
						scrapedContent.map(s => s.content),
						openai
					);
					
					if (sufficiencyCheck.sufficient && sufficiencyCheck.confidence >= 75) {
						console.log(`? Sufficient information found after ${sitesScraped} sites (confidence: ${sufficiencyCheck.confidence}%)`);
						return JSON.stringify({
							query,
							status: 'complete',
							sites_scraped: sitesScraped,
							total_results: searchResults.results.length,
							confidence: sufficiencyCheck.confidence,
							summary: sufficiencyCheck.summary,
							scraped_content: scrapedContent,
							search_results: searchResults,
						}, null, 2);
					}
				}
			} catch (error) {
				console.warn(`?? Failed to scrape ${url}: ${error instanceof Error ? error.message : String(error)}`);
				// Continue with next URL
			}
		}

		// Return all scraped content
		return JSON.stringify({
			query,
			status: 'complete',
			sites_scraped: sitesScraped,
			total_results: searchResults.results.length,
			scraped_content: scrapedContent,
			search_results: searchResults,
		}, null, 2);

	} catch (error) {
		return JSON.stringify({
			query,
			status: 'error',
			error: error instanceof Error ? error.message : String(error),
			sites_scraped: 0,
			content: [],
		}, null, 2);
	}
}
