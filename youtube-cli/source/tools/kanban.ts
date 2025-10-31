import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface KanbanTask {
	id: string;
	title: string;
	status: 'todo' | 'in_progress' | 'done';
	description?: string;
}

export const kanbanToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'update_kanban',
		description: 'Update kanban board with tasks',
		parameters: {
			type: 'object',
			properties: {
				tasks: {
					type: 'array',
					description: 'Array of tasks',
					items: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							title: { type: 'string' },
							status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
							description: { type: 'string' },
						},
						required: ['id', 'title', 'status'],
					},
				},
			},
			required: ['tasks'],
		},
	},
};

export async function executeKanbanTool(tasks: KanbanTask[], workDir: string): Promise<string> {
	try {
		const kanbanPath = join(workDir, 'kanban.json');
		writeFileSync(kanbanPath, JSON.stringify(tasks, null, 2), 'utf-8');
		
		const summary = tasks.reduce((acc, t) => {
			acc[t.status] = (acc[t.status] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
		
		return `? Kanban updated: ${summary.todo || 0} todo, ${summary.in_progress || 0} in progress, ${summary.done || 0} done`;
	} catch (error) {
		return `Error: ${error instanceof Error ? error.message : 'Failed to update kanban'}`;
	}
}

export function loadKanban(workDir: string): KanbanTask[] {
	try {
		const kanbanPath = join(workDir, 'kanban.json');
		if (!existsSync(kanbanPath)) return [];
		const data = readFileSync(kanbanPath, 'utf-8');
		return JSON.parse(data);
	} catch {
		return [];
	}
}
