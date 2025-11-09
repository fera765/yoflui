import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { ToolBoxV3 } from './v2/ToolBoxV3.js';
import { KanbanBoxV2 } from './v2/KanbanBoxV2.js';

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant' | 'tool' | 'kanban' | 'user-input-request';
	content: string;
	toolCall?: {
		name: string;
		args: any;
		status: 'running' | 'complete' | 'error';
		result?: string;
		startTime?: number;
		endTime?: number;
	};
	kanban?: Array<{
		id: string;
		title: string;
		status: 'todo' | 'in_progress' | 'done';
		column?: string;
	}>;
	userInputRequest?: {
		question: string;
		context?: string;
	};
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
	
	// Usar ToolBoxV3 (UI dinâmica e elegante)
	return (
		<ToolBoxV3 
			name={msg.toolCall.name} 
			args={msg.toolCall.args} 
			status={msg.toolCall.status} 
			result={msg.toolCall.result}
			startTime={msg.toolCall.startTime}
			endTime={msg.toolCall.endTime}
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
	if (!msg.kanban || msg.kanban.length === 0) return null;
	
	// Usar KanbanBoxV2 (dinâmico)
	return <KanbanBoxV2 tasks={msg.kanban} />;
}, (prev, next) => {
	if (!prev.msg.kanban || !next.msg.kanban) return false;
	if (prev.msg.id !== next.msg.id) return false;
	if (prev.msg.kanban.length !== next.msg.kanban.length) return false;
	return prev.msg.kanban.every((task, idx) => 
		task.id === next.msg.kanban![idx].id && 
		task.status === next.msg.kanban![idx].status &&
		task.column === next.msg.kanban![idx].column
	);
});

export const UserInputRequestMsg: React.FC<{ msg: ChatMessage }> = React.memo(({ msg }) => {
	if (!msg.userInputRequest) return null;
	
	return (
		<Box 
			flexDirection="column" 
			borderStyle="round" 
			borderColor="yellow" 
			paddingX={2} 
			paddingY={1} 
			marginY={1}
		>
			<Text color="yellow" bold>❓ PRECISO DE INFORMAÇÃO</Text>
			<Box marginTop={1}>
				<Text color="white">{msg.userInputRequest.question}</Text>
			</Box>
			{msg.userInputRequest.context && (
				<Box marginTop={1}>
					<Text color="gray" dimColor>{msg.userInputRequest.context}</Text>
				</Box>
			)}
		</Box>
	);
}, (prev, next) => prev.msg.id === next.msg.id);

// ChatTimeline moved to ui/components/ChatTimeline.tsx (new implementation)
// Using Static/Dynamic separation for better performance
export { ChatTimeline } from '../ui/components/ChatTimeline.js';

// ChatInput moved to input/components/ChatInput.tsx
