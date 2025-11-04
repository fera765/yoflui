/**
 * Kanban Message Component
 * Renders kanban board with tasks
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { KanbanTask } from '../../types.js';

export interface KanbanMessageProps {
	tasks: KanbanTask[];
}

export const KanbanMessage: React.FC<KanbanMessageProps> = ({ tasks }) => {
	if (tasks.length === 0) return null;
	
	return (
		<Box marginY={1} borderStyle="round" borderColor="magenta" paddingX={2} paddingY={1}>
			<Box flexDirection="column">
				<Text color="magenta" bold>[TASKS]</Text>
				{tasks.map(task => {
					const color = task.status === 'done' ? 'green' : task.status === 'in_progress' ? 'yellow' : 'gray';
					const icon = task.status === 'done' ? '[?]' : task.status === 'in_progress' ? '[?]' : '[ ]';
					
					return (
						<Box key={task.id} marginTop={1}>
							<Text color={color}>
								{icon} {task.title}
							</Text>
						</Box>
					);
				})}
			</Box>
		</Box>
	);
};
