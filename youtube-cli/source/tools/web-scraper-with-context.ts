import { scrapeUrlsWithEarlyStopping, selectRelevantUrls } from './web-scraper-context.js';
import { executeWebSearchTool } from './web-search.js';
import OpenAI from 'openai';
import { getConfig } from '../llm-config.js';
import { loadQwenCredentials, getValidAccessToken } from '../qwen-oauth.js';

/**
 * Enhanced Web Scraper with Context and Early Stopping
 * 
 * This tool intelligently scrapes websites after a web search, stopping
 * when sufficient information is found to answer the query.
 */
export const webScraperWithContextToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'web_scraper_with_context',
		description: 'Scrape web pages with intelligent early stopping. After performing a web search, this tool scrapes the most relevant URLs incrementally and stops when sufficient information is found to answer the query. This prevents wasting tokens scraping unnecessary sites. Use this when you need to research a topic and want efficient, context-aware scraping.',
		parameters: {
			type: 'object',
			properties: {
				query: {
					type: 'string',
					description: 'The research query or question that needs to be answered'
				},
				searchResults: {
					type: 'string',
					description: 'Optional: JSON string from web_search results. If not provided, will perform web search automatically.'
				},
				maxSites: {
					type: 'number',
					description: 'Maximum number of sites to scrape (default: 3, enough for most queries). Tool will stop earlier if sufficient information is found.',
					default: 3,
					minimum: 1,
					maximum: 5
				},
				minSites: {
					type: 'number',
					description: 'Minimum number of sites to scrape before checking sufficiency (default: 1)',
					default: 1,
					minimum: 1,
					maximum: 3
				},
				confidenceThreshold: {
					type: 'number',
					description: 'Confidence threshold to stop early (0-100, default: 75). Tool stops when confidence >= threshold.',
					default: 75,
					minimum: 50,
					maximum: 100
				}
			},
			required: ['query'],
		},
	},
};

/**
 * Execute web scraper with context and early stopping
 */
export async function executeWebScraperWithContextTool(
	query: string,
	searchResults?: string,
	maxSites: number = 3,
	minSites: number = 1,
	confidenceThreshold: number = 75
): Promise<string> {
	try {
		let searchResultsData: any;

		// Step 1: Get search results if not provided
		if (!searchResults) {
			// Performing search
			const searchResultsJson = await executeWebSearchTool(query, 10);
			searchResultsData = JSON.parse(searchResultsJson);
		} else {
			searchResultsData = JSON.parse(searchResults);
		}

		if (!searchResultsData.results || searchResultsData.results.length === 0) {
			return JSON.stringify({
				query,
				status: 'no_results',
				message: 'No search results found',
				sites_scraped: 0,
				content: [],
			}, null, 2);
		}

		// Step 2: Select most relevant URLs
		// Analyzing results
		
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
		const relevantUrls = await selectRelevantUrls(searchResultsData, query, openai, maxSites);

		if (relevantUrls.length === 0) {
			return JSON.stringify({
				query,
				status: 'no_relevant_urls',
				search_results: searchResultsData,
				message: 'No relevant URLs found after analysis',
				sites_scraped: 0,
				content: [],
			}, null, 2);
		}

		// URLs selected

		// Step 3: Scrape with early stopping
		const result = await scrapeUrlsWithEarlyStopping(query, relevantUrls, {
			minSites,
			maxSites,
			confidenceThreshold
		});

		// Format response
		return JSON.stringify({
			query,
			status: result.status,
			sites_scraped: result.sitesScraped,
			total_urls_available: result.totalUrls,
			stopped_early: result.stoppedEarly,
			sufficient: result.sufficient,
			confidence: result.confidence,
			summary: result.summary,
			reasoning: result.reasoning,
			scraped_content: result.scrapedContent.map(item => ({
				url: item.url,
				content_length: item.content.length,
				content_preview: item.content.substring(0, 500) + '...',
				content: item.content // Full content included
			})),
			search_results: searchResultsData,
			efficiency_note: result.stoppedEarly 
				? `⚡ Stopped early after ${result.sitesScraped} sites - sufficient information found (confidence: ${result.confidence}%)`
				: `📊 Scraped ${result.sitesScraped} sites (${result.sufficient ? 'sufficient' : 'partial'} information)`
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
