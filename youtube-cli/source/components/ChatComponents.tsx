import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
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
));

export const AssistantMsg: React.FC<{ msg: ChatMessage }> = React.memo(({ msg }) => (
	<Box marginY={1} paddingLeft={2}>
		<Text color="green">{msg.content}</Text>
	</Box>
));

export const ToolMsg: React.FC<{ msg: ChatMessage }> = React.memo(({ msg }) => {
	if (!msg.toolCall) return null;
	
	return <ToolBox name={msg.toolCall.name} args={msg.toolCall.args} status={msg.toolCall.status} result={msg.toolCall.result} />;
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
});

export const ChatTimeline: React.FC<{ messages: ChatMessage[] }> = React.memo(({ messages }) => {
	if (messages.length === 0) {
		return (
			<Box paddingY={5} justifyContent="center">
				<Text color="cyan" bold>[ READY ]</Text>
			</Box>
		);
	}
	
	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			{messages.map(msg => {
				if (msg.role === 'user') return <UserMsg key={msg.id} msg={msg} />;
				if (msg.role === 'assistant') return <AssistantMsg key={msg.id} msg={msg} />;
				if (msg.role === 'tool') return <ToolMsg key={msg.id} msg={msg} />;
				if (msg.role === 'kanban') return <KanbanMsg key={msg.id} msg={msg} />;
				
				return null;
			})}
		</Box>
	);
});

export const ChatInput: React.FC<{
	value: string;
	onChange: (val: string) => void;
	onSubmit: () => void;
	disabled: boolean;
}> = React.memo(({ value, onChange, onSubmit, disabled }) => {
	return (
		<Box width="98%" borderStyle="round" borderColor="gray" paddingX={2} paddingY={1} marginX={1} marginBottom={1}>
			{disabled ? (
				<Box>
					<Text color="yellow">[...]</Text>
					<Text color="gray"> Processing...</Text>
				</Box>
			) : (
				<Box width="100%">
					<Text color="magenta" bold>&gt; </Text>
					<Box flexGrow={1}>
						<TextInput value={value} onChange={onChange} onSubmit={onSubmit} />
					</Box>
				</Box>
			)}
		</Box>
	);
});
