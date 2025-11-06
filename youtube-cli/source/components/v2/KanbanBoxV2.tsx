/**
 * KanbanBox Dinâmico V2
 * Box dinâmico estilo kanban que atualiza em tempo real sem piscar
 * Mostra tarefas por coluna com cores dinâmicas
 */

import React from 'react';
import { Box, Text, useStdout } from 'ink';

export interface KanbanTask {
	id: string;
	title: string;
	status: 'todo' | 'in_progress' | 'done';
	description?: string;
	column?: string;
}

interface KanbanBoxV2Props {
	tasks: KanbanTask[];
}

const COLUMN_COLORS = {
	todo: { border: 'gray', icon: '⚪', text: 'gray' },
	in_progress: { border: 'yellow', icon: '🟠', text: 'yellow' },
	done: { border: 'green', icon: '✓', text: 'green' },
	received: { border: 'cyan', icon: '📥', text: 'cyan' },
	planning: { border: 'blue', icon: '📋', text: 'blue' },
	execution_queue: { border: 'magenta', icon: '⏳', text: 'magenta' },
	review: { border: 'blue', icon: '🔍', text: 'blue' },
	completed: { border: 'green', icon: '✓', text: 'green' },
	delivery: { border: 'green', icon: '🚀', text: 'green' },
};

export const KanbanBoxV2: React.FC<KanbanBoxV2Props> = React.memo(({ tasks }) => {
	const { stdout } = useStdout();
	const terminalWidth = stdout?.columns || 80;
	
	// Agrupar tarefas por status/coluna
	const tasksByStatus = tasks.reduce((acc, task) => {
		const status = task.column || task.status;
		if (!acc[status]) acc[status] = [];
		acc[status].push(task);
		return acc;
	}, {} as Record<string, KanbanTask[]>);
	
	// Calcular progresso
	const totalTasks = tasks.length;
	const doneTasks = tasks.filter(t => t.status === 'done' || t.column === 'completed' || t.column === 'delivery').length;
	const progressPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
	
	return (
		<Box 
			flexDirection="column" 
			borderStyle="round" 
			borderColor="#8B5CF6" 
			paddingX={1} 
			paddingY={1} 
			marginY={1}
			width="100%"
		>
			{/* HEADER */}
			<Box justifyContent="space-between" alignItems="center">
				<Text color="#A78BFA" bold>📋 KANBAN</Text>
				<Text color="#10B981">{progressPercentage}% ({doneTasks}/{totalTasks})</Text>
			</Box>
			
			{/* TAREFAS POR COLUNA */}
			{Object.entries(tasksByStatus).map(([status, statusTasks]) => {
				const colors = COLUMN_COLORS[status as keyof typeof COLUMN_COLORS] || COLUMN_COLORS.todo;
				
				return (
					<Box key={status} flexDirection="column" marginTop={1}>
						<Text color={colors.text} bold>
							{colors.icon} {status.toUpperCase().replace(/_/g, ' ')} ({statusTasks.length})
						</Text>
						{statusTasks.map(task => (
							<Box key={task.id} marginLeft={2}>
								<Text color={colors.text}>
									{colors.icon} {task.title}
								</Text>
							</Box>
						))}
					</Box>
				);
			})}
		</Box>
	);
}, (prevProps, nextProps) => {
	// Re-renderizar apenas se tasks mudarem
	if (prevProps.tasks.length !== nextProps.tasks.length) return false;
	return prevProps.tasks.every((task, idx) => 
		task.id === nextProps.tasks[idx]?.id && 
		task.status === nextProps.tasks[idx]?.status &&
		task.column === nextProps.tasks[idx]?.column
	);
});
