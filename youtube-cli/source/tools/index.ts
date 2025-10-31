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

import { editToolDefinition, executeEditTool } from './edit.js';
import { readFileToolDefinition, executeReadFileTool } from './read-file.js';
import { writeFileToolDefinition, executeWriteFileTool } from './write-file.js';
import { shellToolDefinition, executeShellTool } from './shell.js';
import { findFilesToolDefinition, executeFindFilesTool } from './find-files.js';
import { searchTextToolDefinition, executeSearchTextTool } from './search-text.js';
import { readFolderToolDefinition, executeReadFolderTool } from './read-folder.js';
import { kanbanToolDefinition, executeKanbanTool, type KanbanTask } from './kanban.js';
import { webFetchToolDefinition, executeWebFetchTool } from './web-fetch.js';

export const ALL_TOOL_DEFINITIONS = [
	editToolDefinition,
	readFileToolDefinition,
	writeFileToolDefinition,
	shellToolDefinition,
	findFilesToolDefinition,
	searchTextToolDefinition,
	readFolderToolDefinition,
	kanbanToolDefinition,
	webFetchToolDefinition,
];

export async function executeToolCall(toolName: string, args: any, workDir: string): Promise<string> {
	switch (toolName) {
		case 'edit_file':
			return executeEditTool(args.file_path, args.old_string, args.new_string);
		case 'read_file':
			return executeReadFileTool(args.file_path);
		case 'write_file':
			return executeWriteFileTool(args.file_path, args.content);
		case 'execute_shell':
			return executeShellTool(args.command);
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
		default:
			return `Unknown tool: ${toolName}`;
	}
}
