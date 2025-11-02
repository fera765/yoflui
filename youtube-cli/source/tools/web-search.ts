import { withTimeout, TIMEOUT_CONFIG } from '../config/timeout-config.js';

export interface SearchResult {
	title: string;
	description: string;
	url: string;
	content?: string;
	score?: number;
	published_date?: string;
}

export interface WebSearchOptions {
	query: string;
	maxResults?: number;
}

interface TavilyResultItem {
	title: string;
	url: string;
	content?: string;
	score?: number;
	published_date?: string;
}

interface TavilySearchResponse {
	query: string;
	answer?: string;
	results: TavilyResultItem[];
}

export const webSearchToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'web_search',
		description: 'Search the web using the Tavily API. Returns a concise answer with sources. Requires TAVILY_API_KEY environment variable. The API automatically generates a summary answer based on the search results.',
		parameters: {
			type: 'object',
			properties: {
				query: { 
					type: 'string', 
					description: 'The search query to find information on the web.' 
				},
				maxResults: {
					type: 'number',
					description: 'Number of results to return (1-10). Default: 5',
					default: 5,
					minimum: 1,
					maximum: 10
				}
			},
			required: ['query'],
		},
	},
};

/**
 * Get Tavily API key from environment
 */
function getTavilyApiKey(): string | null {
	return process.env.TAVILY_API_KEY || null;
}

/**
 * Execute web search using Tavily API (same approach as Qwen Code)
 */
export async function executeWebSearchTool(
	query: string,
	maxResults: number = 5
): Promise<string> {
	try {
		const apiKey = getTavilyApiKey();
		
		if (!apiKey) {
			return JSON.stringify({
				error: 'TAVILY_API_KEY not configured',
				message: 'Web search is disabled because TAVILY_API_KEY is not configured. Please set it in your environment variables or .env file to enable web search.',
				query,
				totalResults: 0,
				results: [],
			}, null, 2);
		}

		// Validate maxResults
		const limit = Math.min(Math.max(1, maxResults), 10);

		const response = await withTimeout(
			fetch('https://api.tavily.com/search', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					api_key: apiKey,
					query: query,
					search_depth: 'advanced',
					max_results: limit,
					include_answer: true, // Tavily generates a summary answer automatically
				}),
			}),
			TIMEOUT_CONFIG.HTTP_REQUEST,
			`Tavily search: ${query}`
		);

		if (!response.ok) {
			const text = await response.text().catch(() => '');
			throw new Error(
				`Tavily API error: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`
			);
		}

		const data = (await response.json()) as TavilySearchResponse;

		// Format results similar to old format for compatibility
		const results: SearchResult[] = (data.results || []).map((r) => ({
			title: r.title || 'Untitled',
			description: r.content || '', // Use content as description
			url: r.url,
			content: r.content,
			score: r.score,
			published_date: r.published_date,
		}));

		// Format sources list
		const sourceListFormatted = results.map(
			(s, i) => `[${i + 1}] ${s.title} (${s.url})`
		);

		// Build response content
		let content = data.answer?.trim() || '';
		if (!content) {
			// Fallback: build a concise summary from top results
			content = results
				.slice(0, 3)
				.map((s, i) => `${i + 1}. ${s.title} - ${s.url}`)
				.join('\n');
		}

		// Add sources if available
		if (sourceListFormatted.length > 0) {
			content += `\n\nSources:\n${sourceListFormatted.join('\n')}`;
		}

		if (!content.trim()) {
			return JSON.stringify({
				query,
				answer: `No search results or information found for query: "${query}"`,
				totalResults: 0,
				results: [],
			}, null, 2);
		}

		// Return formatted response
		return JSON.stringify({
			query,
			answer: data.answer || content,
			totalResults: results.length,
			results: results,
			sources: results.map(r => ({ title: r.title, url: r.url })),
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
