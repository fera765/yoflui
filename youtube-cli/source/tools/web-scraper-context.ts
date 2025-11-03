import OpenAI from 'openai';
import { getConfig } from '../llm-config.js';
import { loadQwenCredentials, getValidAccessToken } from '../qwen-oauth.js';
import { executeWebScraperTool } from './web-scraper.js';
import { withTimeout, TIMEOUT_CONFIG } from '../config/timeout-config.js';

/**
 * Context-aware web scraping with intelligent early stopping
 * 
 * This system tracks research context and stops scraping when sufficient
 * information is found, preventing unnecessary token usage.
 */
export interface ScrapingContext {
	query: string;
	urls: string[];
	scrapedUrls: string[];
	collectedContent: Array<{ url: string; content: string; timestamp: number }>;
	sufficiencyChecks: Array<{ afterUrl: string; sufficient: boolean; confidence: number; summary: string }>;
}

// Global context tracker (per session)
const researchContexts = new Map<string, ScrapingContext>();

/**
 * Check if scraped content contains sufficient information to answer the query
 */
async function checkInformationSufficiency(
	query: string,
	scrapedContent: Array<{ url: string; content: string }>,
	openai: OpenAI
): Promise<{ sufficient: boolean; confidence: number; summary: string; reasoning: string }> {
	try {
		// Extract content summaries (first 2000 chars per site)
		const contentSummaries = scrapedContent
			.map((item, i) => {
				const contentPreview = item.content.length > 2000 
					? item.content.substring(0, 2000) + '...'
					: item.content;
				return `[Site ${i + 1} - ${item.url}]\n${contentPreview}`;
			})
			.join('\n\n---\n\n');

		const checkPrompt = `Analyze if the scraped web content below contains sufficient information to fully answer this query: "${query}"

Scraped Content (${scrapedContent.length} site(s)):
${contentSummaries}

Determine:
1. Is there sufficient information to answer the query completely? (true/false)
2. Confidence level (0-100) - how confident are you that the answer is complete?
3. A brief summary of what key information was found
4. Brief reasoning for your decision

Return ONLY a JSON object:
{
  "sufficient": true/false,
  "confidence": 0-100,
  "summary": "brief summary",
  "reasoning": "why sufficient or not"
}

Do not include explanations outside the JSON object.`;

		const response = await withTimeout(
			openai.chat.completions.create({
				model: getConfig().model,
				messages: [
					{ 
						role: 'system', 
						content: 'You are an information sufficiency analyzer. Analyze if scraped content fully answers a query. Return only valid JSON objects.' 
					},
					{ role: 'user', content: checkPrompt }
				],
				temperature: 0.2, // Low temperature for consistent analysis
			}),
			TIMEOUT_CONFIG.LLM_COMPLETION,
			'Check information sufficiency'
		);

		const content = response.choices[0]?.message?.content || '';
		
		// Try to extract JSON object
		const jsonMatch = content.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			try {
				const result = JSON.parse(jsonMatch[0]);
				return {
					sufficient: result.sufficient === true || result.sufficient === 'true',
					confidence: Math.min(100, Math.max(0, result.confidence || 0)),
					summary: result.summary || 'Content analyzed',
					reasoning: result.reasoning || ''
				};
			} catch (e) {
				// Fall through to default
			}
		}
		
		// Default: analyze based on content length and quality
		const hasSubstantialContent = scrapedContent.some(item => {
			const content = item.content.toLowerCase();
			// Check if content has meaningful information (not just error messages)
			const hasRealContent = content.length > 500 && 
				!content.includes('error') && 
				!content.includes('blocked') &&
				!content.includes('access denied');
			
			// Check relevance to query
			const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
			const relevanceScore = queryTerms.reduce((score, term) => {
				return score + (content.includes(term) ? 1 : 0);
			}, 0) / queryTerms.length;
			
			return hasRealContent && relevanceScore > 0.3;
		});

		return {
			sufficient: hasSubstantialContent && scrapedContent.length >= 1,
			confidence: hasSubstantialContent ? 70 : 40,
			summary: hasSubstantialContent ? 'Content found with relevant information' : 'Limited or irrelevant content',
			reasoning: hasSubstantialContent 
				? 'Content contains substantial information related to query'
				: 'Content may be insufficient or irrelevant'
		};
	} catch (error) {
		// On error, use heuristics
		const hasContent = scrapedContent.length > 0 && scrapedContent.some(c => c.content.length > 500);
		return {
			sufficient: hasContent,
			confidence: hasContent ? 60 : 30,
			summary: hasContent ? 'Content available' : 'No substantial content',
			reasoning: hasContent ? 'Content found but could not analyze sufficiency' : 'No content or analysis failed'
		};
	}
}

/**
 * Analyze search results to select most relevant URLs
 */
async function selectRelevantUrls(
	searchResults: any,
	query: string,
	openai: OpenAI,
	maxUrls: number = 3
): Promise<string[]> {
	try {
		const results = searchResults.results || [];
		const urls = results.slice(0, 10).map((r: any) => r.url).filter(Boolean);
		
		if (urls.length === 0) return [];
		
		// If 1-2 URLs, return all
		if (urls.length <= 2) return urls;
		
		// Use LLM to analyze relevance
		const analysisPrompt = `Analyze web search results to determine which URLs are MOST relevant to answer this query: "${query}"

Search Results:
${results.slice(0, 10).map((r: any, i: number) => 
	`${i + 1}. ${r.title || 'Untitled'}
   URL: ${r.url}
   Description: ${(r.description || '').substring(0, 150)}...`
).join('\n\n')}

Analyze these results and identify the TOP ${maxUrls} most relevant URLs that would best answer the query. Consider:
- Title relevance to query
- Description relevance
- Domain authority and reliability
- Likelihood of containing comprehensive information
- Complementarity (sites that provide different perspectives)

Return ONLY a JSON array of URLs, like: ["url1", "url2", "url3"]
Do not include explanations, just the URLs array.`;

		const response = await withTimeout(
			openai.chat.completions.create({
				model: getConfig().model,
				messages: [
					{ 
						role: 'system', 
						content: 'You are a relevance analyzer. Analyze search results and return only JSON arrays of the most relevant URLs.' 
					},
					{ role: 'user', content: analysisPrompt }
				],
				temperature: 0.3,
			}),
			TIMEOUT_CONFIG.LLM_COMPLETION,
			'Analyze search results'
		);

		const content = response.choices[0]?.message?.content || '';
		
		// Try to extract JSON array
		const jsonMatch = content.match(/\[[\s\S]*?\]/);
		if (jsonMatch) {
			try {
				const selectedUrls = JSON.parse(jsonMatch[0]);
				if (Array.isArray(selectedUrls) && selectedUrls.length > 0) {
					// Validate URLs are from the original results
					const validUrls = selectedUrls.filter((url: string) => 
						urls.some(u => u === url || u.includes(url) || url.includes(u))
					);
					return validUrls.slice(0, maxUrls).length > 0 
						? validUrls.slice(0, maxUrls)
						: urls.slice(0, maxUrls);
				}
			} catch (e) {
				// Fall through
			}
		}
		
		// Default: return top URLs
		return urls.slice(0, maxUrls);
	} catch (error) {
		// On error, return top URLs
		const results = searchResults.results || [];
		return results.slice(0, maxUrls).map((r: any) => r.url).filter(Boolean);
	}
}

/**
 * Scrape URLs incrementally with early stopping
 */
export async function scrapeUrlsWithEarlyStopping(
	query: string,
	urls: string[],
	options: {
		minSites?: number;
		maxSites?: number;
		confidenceThreshold?: number;
		contextId?: string;
	} = {}
): Promise<{
	query: string;
	status: 'complete' | 'sufficient' | 'partial' | 'error';
	sitesScraped: number;
	totalUrls: number;
	sufficient: boolean;
	confidence: number;
	summary: string;
	reasoning: string;
	scrapedContent: Array<{ url: string; content: string }>;
	stoppedEarly: boolean;
}> {
	const {
		minSites = 1,
		maxSites = 5,
		confidenceThreshold = 75,
		contextId = `ctx_${Date.now()}`
	} = options;

	try {
		// Initialize OpenAI client
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

		// Initialize or get context
		let context: ScrapingContext;
		if (researchContexts.has(contextId)) {
			context = researchContexts.get(contextId)!;
		} else {
			context = {
				query,
				urls,
				scrapedUrls: [],
				collectedContent: [],
				sufficiencyChecks: []
			};
			researchContexts.set(contextId, context);
		}

		const scrapedContent: Array<{ url: string; content: string }> = [];
		let sitesScraped = 0;
		let stoppedEarly = false;

		// Scrape incrementally
		for (let i = 0; i < Math.min(urls.length, maxSites); i++) {
			const url = urls[i];

			// Skip if already scraped
			if (context.scrapedUrls.includes(url)) {
				console.log(`?? Skipping already scraped URL: ${url}`);
				continue;
			}

			console.log(`?? Scraping site ${i + 1}/${Math.min(urls.length, maxSites)}: ${url}`);

			try {
				const contentResult = await executeWebScraperTool(url);
				
				// Parse content (web_scraper returns JSON)
				let content: string;
				try {
					const parsed = JSON.parse(contentResult);
					content = parsed.content || contentResult;
				} catch {
					content = contentResult;
				}

				scrapedContent.push({ url, content });
				context.scrapedUrls.push(url);
				context.collectedContent.push({
					url,
					content,
					timestamp: Date.now()
				});
				sitesScraped++;

				// Check sufficiency after minimum sites scraped
				if (sitesScraped >= minSites) {
					const sufficiencyCheck = await checkInformationSufficiency(
						query,
						scrapedContent,
						openai
					);

					context.sufficiencyChecks.push({
						afterUrl: url,
						sufficient: sufficiencyCheck.sufficient,
						confidence: sufficiencyCheck.confidence,
						summary: sufficiencyCheck.summary
					});

					// Stop if sufficient information found
					if (sufficiencyCheck.sufficient && sufficiencyCheck.confidence >= confidenceThreshold) {
						console.log(`? Sufficient information found after ${sitesScraped} sites (confidence: ${sufficiencyCheck.confidence}%)`);
						stoppedEarly = true;
						
						// Clean up context after delay (for potential follow-up queries)
						setTimeout(() => {
							researchContexts.delete(contextId);
						}, 300000); // 5 minutes

						return {
							query,
							status: 'sufficient',
							sitesScraped,
							totalUrls: urls.length,
							sufficient: true,
							confidence: sufficiencyCheck.confidence,
							summary: sufficiencyCheck.summary,
							reasoning: sufficiencyCheck.reasoning,
							scrapedContent,
							stoppedEarly: true
						};
					}
				}
			} catch (error) {
				console.warn(`?? Failed to scrape ${url}: ${error instanceof Error ? error.message : String(error)}`);
				// Continue with next URL
			}
		}

		// Final sufficiency check
		let finalCheck = { sufficient: false, confidence: 0, summary: '', reasoning: '' };
		if (scrapedContent.length > 0) {
			finalCheck = await checkInformationSufficiency(query, scrapedContent, openai);
		}

		// Clean up context
		setTimeout(() => {
			researchContexts.delete(contextId);
		}, 300000);

		return {
			query,
			status: finalCheck.sufficient ? 'complete' : 'partial',
			sitesScraped,
			totalUrls: urls.length,
			sufficient: finalCheck.sufficient,
			confidence: finalCheck.confidence,
			summary: finalCheck.summary,
			reasoning: finalCheck.reasoning,
			scrapedContent,
			stoppedEarly: false
		};
	} catch (error) {
		// Clean up context on error
		if (contextId) {
			researchContexts.delete(contextId);
		}

		return {
			query,
			status: 'error',
			sitesScraped: 0,
			totalUrls: urls.length,
			sufficient: false,
			confidence: 0,
			summary: 'Error occurred during scraping',
			reasoning: error instanceof Error ? error.message : String(error),
			scrapedContent: [],
			stoppedEarly: false
		};
	}
}

/**
 * Clear old research contexts (cleanup)
 */
export function clearOldContexts(maxAge: number = 600000): void {
	const now = Date.now();
	for (const [id, context] of researchContexts.entries()) {
		const oldestTimestamp = context.collectedContent.length > 0
			? Math.min(...context.collectedContent.map(c => c.timestamp))
			: now;
		
		if (now - oldestTimestamp > maxAge) {
			researchContexts.delete(id);
		}
	}
}
