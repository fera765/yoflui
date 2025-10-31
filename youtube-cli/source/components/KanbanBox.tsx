import React from 'react';
import { Box, Text } from 'ink';
import type { KanbanTask } from '../tools/kanban.js';

interface Props {
	tasks: KanbanTask[];
}

export const KanbanBox: React.FC<Props> = ({ tasks }) => {
	const todoTasks = tasks.filter(t => t.status === 'todo');
	const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
	const doneTasks = tasks.filter(t => t.status === 'done');

	return (
		<Box borderStyle="round" borderColor="#8B5CF6" paddingX={2} paddingY={1} flexDirection="column" width="100%">
			<Box marginBottom={1}>
				<Text bold color="#A78BFA">?? KANBAN BOARD</Text>
			</Box>
			
			{/* Todo */}
			{todoTasks.length > 0 && (
				<Box flexDirection="column" marginBottom={1}>
					<Text color="#60A5FA" bold>? TODO ({todoTasks.length})</Text>
					{todoTasks.map(task => (
						<Box key={task.id} marginLeft={2}>
							<Text color="#9CA3AF">  ? {task.title}</Text>
						</Box>
					))}
				</Box>
			)}

			{/* In Progress */}
			{inProgressTasks.length > 0 && (
				<Box flexDirection="column" marginBottom={1}>
					<Text color="#FBBF24" bold>?? IN PROGRESS ({inProgressTasks.length})</Text>
					{inProgressTasks.map(task => (
						<Box key={task.id} marginLeft={2}>
							<Text color="#FBBF24">  ? {task.title}</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Done */}
			{doneTasks.length > 0 && (
				<Box flexDirection="column">
					<Text color="#10B981" bold>? DONE ({doneTasks.length})</Text>
					{doneTasks.map(task => (
						<Box key={task.id} marginLeft={2}>
							<Text color="#10B981">  ? {task.title}</Text>
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
};
