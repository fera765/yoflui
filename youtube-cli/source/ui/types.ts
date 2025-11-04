/**
 * UI Types - Message History System
 * Based on qwen-code types.ts
 */

export interface ToolCall {
	name: string;
	args: any;
	status: 'running' | 'complete' | 'error';
	result?: string;
}

export interface KanbanTask {
	id: string;
	title: string;
	status: 'todo' | 'in_progress' | 'done';
}

// Base history item type
interface BaseHistoryItem {
	id: number | string;
	timestamp?: Date;
}

// User message
export interface UserHistoryItem extends BaseHistoryItem {
	type: 'user';
	text: string;
}

// Assistant message
export interface AssistantHistoryItem extends BaseHistoryItem {
	type: 'assistant';
	text: string;
	isPending?: boolean;
}

// Tool execution message
export interface ToolHistoryItem extends BaseHistoryItem {
	type: 'tool';
	tool: ToolCall;
}

// Tool group message (multiple tools)
export interface ToolGroupHistoryItem extends BaseHistoryItem {
	type: 'tool_group';
	tools: ToolCall[];
}

// Kanban board
export interface KanbanHistoryItem extends BaseHistoryItem {
	type: 'kanban';
	tasks: KanbanTask[];
}

// Info message
export interface InfoHistoryItem extends BaseHistoryItem {
	type: 'info';
	text: string;
}

// Error message
export interface ErrorHistoryItem extends BaseHistoryItem {
	type: 'error';
	text: string;
}

// Warning message
export interface WarningHistoryItem extends BaseHistoryItem {
	type: 'warning';
	text: string;
}

// Union type of all possible history items
export type HistoryItem =
	| UserHistoryItem
	| AssistantHistoryItem
	| ToolHistoryItem
	| ToolGroupHistoryItem
	| KanbanHistoryItem
	| InfoHistoryItem
	| ErrorHistoryItem
	| WarningHistoryItem;

// Console message types (for debug/logs)
export interface ConsoleMessageItem {
	type: 'log' | 'warn' | 'error' | 'debug';
	content: string;
	count?: number;
	timestamp?: number;
}

// UI State
export interface UIState {
	history: HistoryItem[];
	pendingHistoryItems: HistoryItem[];
	historyRemountKey: number;
	mainAreaWidth: number;
	availableTerminalHeight: number;
	staticAreaMaxItemHeight: number;
	constrainHeight: boolean;
}
