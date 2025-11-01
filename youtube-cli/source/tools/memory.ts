import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface MemoryEntry {
	timestamp: number;
	role: 'user' | 'assistant';
	content: string;
	metadata?: {
		toolsUsed?: string[];
		tasksCompleted?: number;
		workDir?: string;
	};
}

export interface ConversationMemory {
	sessionId: string;
	created: number;
	updated: number;
	entries: MemoryEntry[];
}

export const memoryToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'save_memory',
		description: 'Save important context or learnings to memory for future reference. Use this to remember user preferences, project details, or important decisions.',
		parameters: {
			type: 'object',
			properties: {
				content: {
					type: 'string',
					description: 'The information to save to memory (e.g., "User prefers TypeScript over JavaScript")',
				},
				category: {
					type: 'string',
					description: 'Category of the memory (e.g., "preference", "project_info", "decision")',
					enum: ['preference', 'project_info', 'decision', 'learning', 'context'],
				},
			},
			required: ['content', 'category'],
		},
	},
};

export async function executeSaveMemoryTool(
	content: string,
	category: string,
	workDir: string
): Promise<string> {
	try {
		// Save to PROJECT ROOT, not task workDir
		const memoryPath = join(process.cwd(), '.flui-memory.json');
		let memories: Array<{ content: string; category: string; timestamp: number }> = [];

		// Load existing memories
		if (existsSync(memoryPath)) {
			const data = readFileSync(memoryPath, 'utf-8');
			memories = JSON.parse(data);
		}

		// Add new memory
		memories.push({
			content,
			category,
			timestamp: Date.now(),
		});

		// Save to file
		writeFileSync(memoryPath, JSON.stringify(memories, null, 2), 'utf-8');

		return `[+] Memory saved: ${content.substring(0, 50)}... (category: ${category})`;
	} catch (error) {
		return `Error saving memory: ${error instanceof Error ? error.message : 'Unknown error'}`;
	}
}

export function loadMemories(workDir: string): Array<{ content: string; category: string; timestamp: number }> {
	try {
		// Load from PROJECT ROOT, not task workDir
		const memoryPath = join(process.cwd(), '.flui-memory.json');
		if (!existsSync(memoryPath)) return [];
		const data = readFileSync(memoryPath, 'utf-8');
		return JSON.parse(data);
	} catch {
		return [];
	}
}

// Conversation history management
export function saveConversationHistory(
	sessionId: string,
	entries: MemoryEntry[],
	workDir: string
): void {
	try {
		// Save to PROJECT ROOT, not task workDir
		const historyPath = join(process.cwd(), '.flui-history.json');
		
		const memory: ConversationMemory = {
			sessionId,
			created: existsSync(historyPath) ? 
				JSON.parse(readFileSync(historyPath, 'utf-8')).created : 
				Date.now(),
			updated: Date.now(),
			entries,
		};

		writeFileSync(historyPath, JSON.stringify(memory, null, 2), 'utf-8');
	} catch (error) {
		console.error('Failed to save conversation history:', error);
	}
}

export function loadConversationHistory(workDir: string): MemoryEntry[] {
	try {
		// Load from PROJECT ROOT, not task workDir
		const historyPath = join(process.cwd(), '.flui-history.json');
		if (!existsSync(historyPath)) return [];
		
		const data = readFileSync(historyPath, 'utf-8');
		const memory: ConversationMemory = JSON.parse(data);
		
		return memory.entries || [];
	} catch {
		return [];
	}
}
