import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { ToolBox } from './ToolBox.js';
import { ToolBoxV2 } from './v2/ToolBoxV2.js';
import { getUIConfig } from '../config/ui-config.js';

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
	
	// SEMPRE usar ToolBoxV2 (UI elegante)
	return (
		<ToolBoxV2 
			name={msg.toolCall.name} 
			args={msg.toolCall.args} 
			status={msg.toolCall.status} 
			result={msg.toolCall.result}
			startTime={Date.now()}
			endTime={msg.toolCall.status !== 'running' ? Date.now() : undefined}
		/>
	);
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
	
	const todoTasks = msg.kanban.filter(t => t.status === 'todo');
	const inProgressTasks = msg.kanban.filter(t => t.status === 'in_progress');
	const doneTasks = msg.kanban.filter(t => t.status === 'done');
	
	return (
		<Box marginY={1} borderStyle="round" borderColor="#8B5CF6" paddingX={2} paddingY={1}>
			<Box flexDirection="column">
				<Text color="#A78BFA" bold>📋 KANBAN BOARD</Text>
				
				{todoTasks.length > 0 && (
					<Box flexDirection="column" marginTop={1}>
						<Text color="#E5E7EB" bold>TODO ({todoTasks.length})</Text>
						{todoTasks.map(task => (
							<Box key={task.id} marginLeft={2}>
								<Text color="#9CA3AF">  ⚪ {task.title}</Text>
							</Box>
						))}
					</Box>
				)}
				
				{inProgressTasks.length > 0 && (
					<Box flexDirection="column" marginTop={1}>
						<Text color="#FBBF24" bold>IN PROGRESS ({inProgressTasks.length})</Text>
						{inProgressTasks.map(task => (
							<Box key={task.id} marginLeft={2}>
								<Text color="#FBBF24">  🟠 {task.title}</Text>
							</Box>
						))}
					</Box>
				)}
				
				{doneTasks.length > 0 && (
					<Box flexDirection="column" marginTop={1}>
						<Text color="#10B981" bold>DONE ({doneTasks.length})</Text>
						{doneTasks.map(task => (
							<Box key={task.id} marginLeft={2}>
								<Text color="#10B981">  🟢 {task.title}</Text>
							</Box>
						))}
					</Box>
				)}
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
