// Export all tools and their definitions
export * from './edit.js';
export * from './read-file.js';
export * from './write-file.js';
export * from './shell.js';
export * from './find-files.js';
export * from './search-text.js';
export * from './read-folder.js';
export * from './kanban.js';
export * from './web-fetch.js';
export * from './memory.js';
export * from './agent.js';

// Import retry logic
import { retryWithBackoff } from '../errors/retry-manager.js';
import { withTimeout, TIMEOUT_CONFIG } from '../config/timeout-config.js';

// Re-export loadKanban for external use
import { loadKanban } from './kanban.js';
export { loadKanban };

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
import { webFetchToolDefinition, executeWebFetchTool } from './web-fetch.js';
import { youtubeToolDefinition, executeYouTubeTool } from '../youtube-tool.js';
import { memoryToolDefinition, executeSaveMemoryTool, loadMemories } from './memory.js';
import { delegateAgentToolDefinition, executeDelegateAgent } from './agent.js';
import { getMCPToolDefinitions, executeMCPTool, isMCPTool } from '../mcp/mcp-tools-adapter.js';

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
		webFetchToolDefinition,
		youtubeToolDefinition,
		memoryToolDefinition,
		delegateAgentToolDefinition,
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
	switch (toolName) {
		case 'edit_file':
			return executeEditTool(args.file_path, args.old_string, args.new_string);
		case 'read_file':
			return executeReadFileTool(args.file_path);
		case 'write_file':
			return executeWriteFileTool(args.file_path, args.content);
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
		case 'web_fetch':
			return executeWebFetchTool(args.url);
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
			}, null, 2);
		}
		case 'save_memory':
			return executeSaveMemoryTool(args.content, args.category, workDir);
		case 'delegate_to_agent':
			return executeDelegateAgent(args.task, workDir, args.kanban_task_id);
		default:
			return `Unknown tool: ${toolName}`;
	}
}

// Export memory loading for use in autonomous agent
export { loadMemories };
