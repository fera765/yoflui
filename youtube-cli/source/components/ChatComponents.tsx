import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { ToolBox } from './ToolBox.js';

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant' | 'tool' | 'kanban';
	content: string;
	toolCall?: {
		name: string;
		args: any;
		status: 'running' | 'complete' | 'error';
		result?: string;
	};
	kanban?: Array<{
		id: string;
		title: string;
		status: 'todo' | 'in_progress' | 'done';
	}>;
}

export const UserMsg: React.FC<{ msg: ChatMessage }> = React.memo(({ msg }) => (
	<Box marginY={1}>
		<Text color="cyan" bold>&gt; </Text>
		<Text color="white">{msg.content}</Text>
	</Box>
), (prev, next) => prev.msg.id === next.msg.id && prev.msg.content === next.msg.content);

export const AssistantMsg: React.FC<{ msg: ChatMessage }> = React.memo(({ msg }) => (
	<Box marginY={1} paddingLeft={2}>
		<Text color="green">{msg.content}</Text>
	</Box>
), (prev, next) => prev.msg.id === next.msg.id && prev.msg.content === next.msg.content);

export const ToolMsg: React.FC<{ msg: ChatMessage }> = React.memo(({ msg }) => {
	if (!msg.toolCall) return null;
	
	return <ToolBox name={msg.toolCall.name} args={msg.toolCall.args} status={msg.toolCall.status} result={msg.toolCall.result} />;
}, (prev, next) => {
	if (!prev.msg.toolCall || !next.msg.toolCall) return false;
	return (
		prev.msg.id === next.msg.id &&
		prev.msg.toolCall.status === next.msg.toolCall.status &&
		prev.msg.toolCall.result === next.msg.toolCall.result
	);
});

export const KanbanMsg: React.FC<{ msg: ChatMessage }> = React.memo(({ msg }) => {
	if (!msg.kanban) return null;
	
	return (
		<Box marginY={1} borderStyle="round" borderColor="magenta" paddingX={2} paddingY={1}>
			<Box flexDirection="column">
				<Text color="magenta" bold>[TASKS]</Text>
				{msg.kanban.map(task => (
					<Box key={task.id} marginTop={1}>
						<Text color={task.status === 'done' ? 'green' : task.status === 'in_progress' ? 'yellow' : 'gray'}>
							{task.status === 'done' ? '[V]' : task.status === 'in_progress' ? '[>]' : '[ ]'} {task.title}
						</Text>
					</Box>
				))}
			</Box>
		</Box>
	);
}, (prev, next) => {
	if (!prev.msg.kanban || !next.msg.kanban) return false;
	if (prev.msg.id !== next.msg.id) return false;
	if (prev.msg.kanban.length !== next.msg.kanban.length) return false;
	return prev.msg.kanban.every((task, idx) => 
		task.id === next.msg.kanban![idx].id && 
		task.status === next.msg.kanban![idx].status
	);
});

// ChatTimeline moved to ui/components/ChatTimeline.tsx (new implementation)
// Using Static/Dynamic separation for better performance
export { ChatTimeline } from '../ui/components/ChatTimeline.js';

// ChatInput moved to input/components/ChatInput.tsx
