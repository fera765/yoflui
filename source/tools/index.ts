// Export all tools and their definitions
export * from './edit.js';
export * from './read-file.js';
export * from './write-file.js';
export * from './shell.js';
export * from './find-files.js';
export * from './search-text.js';
export * from './read-folder.js';
export * from './kanban.js';
export * from './intelligent-web-research.js';
export * from './web-scraper.js';
export * from './web-scraper-with-context.js';
export * from './web-scraper-context.js';
export * from './keyword-suggestions.js';
export * from './memory.js';
export * from './agent.js';
export * from './condition.js';
export * from './trigger-webhook.js';

// Import retry logic
import { retryWithBackoff } from '../errors/retry-manager.js';
import { withTimeout, TIMEOUT_CONFIG } from '../config/timeout-config.js';

// Re-export loadKanban for external use
import { loadKanban } from './kanban.js';
export { loadKanban };

import { intelligentWebResearchToolDefinition, executeIntelligentWebResearchTool } from './intelligent-web-research.js';
import { editToolDefinition, executeEditTool } from './edit.js';
import { readFileToolDefinition, executeReadFileTool } from './read-file.js';
import { writeFileToolDefinition, executeWriteFileTool } from './write-file.js';
import { 
	shellToolDefinition, 
	executeShellTool,
	shellInputToolDefinition,
	executeShellInputTool,
	shellStatusToolDefinition,
	executeShellStatusTool
} from './shell.js';
import { findFilesToolDefinition, executeFindFilesTool } from './find-files.js';
import { searchTextToolDefinition, executeSearchTextTool } from './search-text.js';
import { readFolderToolDefinition, executeReadFolderTool } from './read-folder.js';
import { kanbanToolDefinition, executeKanbanTool, type KanbanTask } from './kanban.js';
import { webSearchToolDefinition, executeWebSearchTool } from './web-search.js';
import { webScraperToolDefinition, executeWebScraperTool } from './web-scraper.js';
import { webScraperWithContextToolDefinition, executeWebScraperWithContextTool } from './web-scraper-with-context.js';
import { keywordSuggestionsToolDefinition, executeKeywordSuggestionsTool } from './keyword-suggestions.js';
import { youtubeToolDefinition, executeYouTubeTool } from '../youtube-tool.js';
import { memoryToolDefinition, executeSaveMemoryTool, loadMemories } from './memory.js';
import { delegateAgentToolDefinition, executeDelegateAgent } from './agent.js';
import { conditionToolDefinition, executeConditionTool } from './condition.js';
import { triggerWebhookToolDefinition, executeTriggerWebhookTool } from './trigger-webhook.js';
import { getMCPToolDefinitions, executeMCPTool, isMCPTool } from '../mcp/mcp-tools-adapter.js';
import { 
	generateMarketingCampaignTool, 
	getCopyTemplateTool, 
	validateMarketingContentTool,
	executeMarketingTool,
	initializeMarketingTools
} from '../marketing/marketing-tools.js';
import { slidePDFToolDefinition, executeSlidePDFTool } from './slide-pdf-tool.js';
import { getConfig } from '../llm-config.js';
import OpenAI from 'openai';

export function getAllToolDefinitions() {
	const baseTools = [
		editToolDefinition,
		readFileToolDefinition,
		writeFileToolDefinition,
		shellToolDefinition,
		shellInputToolDefinition,
		shellStatusToolDefinition,
		findFilesToolDefinition,
		searchTextToolDefinition,
		readFolderToolDefinition,
		kanbanToolDefinition,
		webSearchToolDefinition,
		webScraperToolDefinition,
		webScraperWithContextToolDefinition,
		intelligentWebResearchToolDefinition,
		keywordSuggestionsToolDefinition,
		youtubeToolDefinition,
		memoryToolDefinition,
		delegateAgentToolDefinition,
		conditionToolDefinition,
		triggerWebhookToolDefinition,
		// Marketing tools
		generateMarketingCampaignTool,
		getCopyTemplateTool,
		validateMarketingContentTool,
		// Slide PDF tool
		slidePDFToolDefinition,
	];

	const mcpTools = getMCPToolDefinitions();
	
	return [...baseTools, ...mcpTools];
}

export const ALL_TOOL_DEFINITIONS = getAllToolDefinitions();

export async function executeToolCall(toolName: string, args: any, workDir: string): Promise<string> {
	// Wrap tool execution with retry logic
	return retryWithBackoff(
		async () => {
			if (isMCPTool(toolName)) {
				return executeMCPTool(toolName, args);
			}

			return executeToolSwitch(toolName, args, workDir);
		},
		`Tool: ${toolName}`,
		{
			maxAttempts: 3,
			baseDelayMs: 1000,
			retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'timeout', '503', '504'],
		}
	);
}

// Internal function without retry (called by executeToolCall)
async function executeToolSwitch(toolName: string, args: any, workDir: string): Promise<string> {
	// Inicializar marketing tools se necessário
	if (toolName.startsWith('generate_marketing') || toolName.startsWith('get_copy') || toolName.startsWith('validate_marketing')) {
		const config = getConfig();
		const qwenCreds = await import('../qwen-oauth.js').then(m => m.loadQwenCredentials());
		let endpoint = config.endpoint;
		let apiKey = config.apiKey || 'not-needed';
		
		if (qwenCreds?.access_token) {
			const validToken = await import('../qwen-oauth.js').then(m => m.getValidAccessToken());
			if (validToken) {
				apiKey = validToken;
				const resourceUrl = qwenCreds.resource_url || 'portal.qwen.ai';
				endpoint = `https://${resourceUrl}/v1`;
			}
		}
		
		const openai = new OpenAI({ baseURL: endpoint, apiKey });
		initializeMarketingTools(openai);
	}

	switch (toolName) {
		case 'edit_file':
			return executeEditTool(args.file_path, args.old_string, args.new_string);
		case 'read_file':
			return executeReadFileTool(args.file_path);
	case 'write_file':
		// CORRIGIDO: Passar workDir para a função que já resolve paths corretamente
		return executeWriteFileTool(args.file_path, args.content, workDir);
		case 'execute_shell':
			return executeShellTool(args.command, args.timeout, args.interactive);
		case 'shell_input':
			return executeShellInputTool(args.processId, args.input);
		case 'shell_status':
			return executeShellStatusTool(args.processId);
		case 'find_files':
			return executeFindFilesTool(args.pattern, args.directory);
		case 'search_text':
			return executeSearchTextTool(args.pattern, args.directory);
		case 'read_folder':
			return executeReadFolderTool(args.path);
		case 'update_kanban':
			return executeKanbanTool(args.tasks, workDir);
		case 'web_scraper':
			return executeWebScraperTool(args.url, args.query);
		case 'web_scraper_with_context':
			return executeWebScraperWithContextTool(
				args.query,
				args.searchResults,
				args.maxSites || 3,
				args.minSites || 1,
				args.confidenceThreshold || 75
			);
		case 'keyword_suggestions':
			return executeKeywordSuggestionsTool(args.query, args.engines || ['all']);
		case 'intelligent_web_research':
			return executeIntelligentWebResearchTool(
				args.query,
				args.maxSites || 3,
				args.minSites || 1
			);
		case 'web_search':
			return executeWebSearchTool(args.query, args.maxResults || 10);
		case 'search_youtube_comments': {
			const result = await executeYouTubeTool(args.query);
			if (!result.success) {
				return `Error: ${result.error}`;
			}
			return JSON.stringify({
				query: result.query,
				totalVideos: result.totalVideos,
				totalComments: result.totalComments,
				comments: result.comments.slice(0, 50), // Limit to first 50 for response
				videos: result.videos.map(v => ({
					videoTitle: v.videoTitle,
					videoUrl: v.videoUrl,
					videoId: v.videoId,
					commentsCount: v.comments.length,
					hasTranscript: !!v.transcript,
					transcript: v.transcript ? {
						language: v.transcript.language,
						fullText: v.transcript.fullText.substring(0, 2000), // Limit transcript preview
						segmentsCount: v.transcript.segmentsCount,
					} : undefined,
					comments: v.comments.slice(0, 10), // Limit comments per video
				})),
			}, null, 2);
		}
		case 'save_memory':
			return executeSaveMemoryTool(args.content, args.category, workDir);
		case 'delegate_to_agent':
			return executeDelegateAgent(args.task, workDir, args.kanban_task_id);
		case 'condition':
			return executeConditionTool(args);
		case 'trigger_webhook':
			return executeTriggerWebhookTool(args);
		case 'generate_marketing_campaign':
		case 'get_copy_template':
		case 'validate_marketing_content':
			return JSON.stringify(await executeMarketingTool(toolName, args, workDir));
		case 'slide_pdf':
			return JSON.stringify(await executeSlidePDFTool(args, workDir));
		default:
			return `Unknown tool: ${toolName}`;
	}
}

// Export memory loading for use in autonomous agent
export { loadMemories };
