import React from 'react';
import { Box, Text } from 'ink';
import type { KanbanTask } from '../tools/kanban.js';

interface Props {
	tasks: KanbanTask[];
}

export const KanbanBox: React.FC<Props> = ({ tasks }) => {
	// Agrupar tasks por coluna do Kanban
	const columns = {
		received: tasks.filter(t => t.column === 'received'),
		planning: tasks.filter(t => t.column === 'planning'),
		execution_queue: tasks.filter(t => t.column === 'execution_queue'),
		in_progress: tasks.filter(t => t.column === 'in_progress'),
		review: tasks.filter(t => t.column === 'review'),
		completed: tasks.filter(t => t.column === 'completed'),
		delivery: tasks.filter(t => t.column === 'delivery'),
	};

	const totalTasks = tasks.length;
	const completedCount = columns.completed.length + columns.delivery.length;
	const progressPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

	return (
		<Box borderStyle="round" borderColor="#8B5CF6" paddingX={2} paddingY={1} flexDirection="column" width="100%" marginY={1}>
			<Box marginBottom={1} justifyContent="space-between">
				<Text bold color="#A78BFA">📋 KANBAN - EXECUÇÃO EM TEMPO REAL</Text>
				<Text color="#10B981">{progressPercentage}% Concluído ({completedCount}/{totalTasks})</Text>
			</Box>
			
			{/* Execution Queue */}
			{columns.execution_queue.length > 0 && (
				<Box flexDirection="column" marginBottom={1}>
					<Text color="#6B7280" bold>⏳ FILA DE EXECUÇÃO ({columns.execution_queue.length})</Text>
					{columns.execution_queue.map(task => (
						<Box key={task.id} marginLeft={2}>
							<Text color="#6B7280">  ⚪ {task.title}</Text>
						</Box>
					))}
				</Box>
			)}

			{/* In Progress */}
			{columns.in_progress.length > 0 && (
				<Box flexDirection="column" marginBottom={1}>
					<Text color="#FBBF24" bold>🔧 EM EXECUÇÃO ({columns.in_progress.length})</Text>
					{columns.in_progress.map(task => (
						<Box key={task.id} marginLeft={2}>
							<Text color="#FBBF24">  🟠 {task.title}</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Review */}
			{columns.review.length > 0 && (
				<Box flexDirection="column" marginBottom={1}>
					<Text color="#3B82F6" bold>🔍 REVISANDO ({columns.review.length})</Text>
					{columns.review.map(task => (
						<Box key={task.id} marginLeft={2}>
							<Text color="#3B82F6">  🔵 {task.title}</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Completed */}
			{(columns.completed.length > 0 || columns.delivery.length > 0) && (
				<Box flexDirection="column">
					<Text color="#10B981" bold>✅ CONCLUÍDAS ({completedCount})</Text>
					{[...columns.completed, ...columns.delivery].map(task => (
						<Box key={task.id} marginLeft={2}>
							<Text color="#10B981">  ✓ {task.title}</Text>
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
};
