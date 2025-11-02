/**
 * ChatComponents.tsx - IMPLEMENTA??O LIMPA E SIMPLES
 * 
 * Componentes ultra-simples sem complexidade desnecess?ria
 * Foco em: estabilidade, sem duplica??o, sem re-renders
 */

import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';

// Tipos
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

// Componente de mensagem do usu?rio - Ultra simples
export const UserMsg: React.FC<{ msg: ChatMessage }> = React.memo(({ msg }) => (
	<Box marginY={1}>
		<Text color="cyan" bold>&gt; </Text>
		<Text color="white">{msg.content}</Text>
	</Box>
));

// Componente de resposta do assistente - Ultra simples
export const AssistantMsg: React.FC<{ msg: ChatMessage }> = React.memo(({ msg }) => (
	<Box marginY={1} paddingLeft={2}>
		<Text color="green">{msg.content}</Text>
	</Box>
));

// Componente de ferramenta - Ultra simples
export const ToolMsg: React.FC<{ msg: ChatMessage }> = React.memo(({ msg }) => {
	if (!msg.toolCall) return null;
	
	const { name, status, result } = msg.toolCall;
	const isRunning = status === 'running';
	
	return (
		<Box marginY={1} flexDirection="column">
			<Box>
				{isRunning ? (
					<>
						<Text color="yellow"><Spinner type="dots" /></Text>
						<Text color="yellow"> {name}</Text>
					</>
				) : (
					<>
						<Text color={status === 'error' ? 'red' : 'green'}>
							{status === 'error' ? '[ERR]' : '[OK]'}
						</Text>
						<Text color="gray"> {name}</Text>
					</>
				)}
			</Box>
			{result && (
				<Box paddingLeft={2}>
					<Text color="gray" dimColor>{result.substring(0, 80)}</Text>
				</Box>
			)}
		</Box>
	);
});

// Componente Kanban - Ultra simples
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

// Timeline - EXTREMAMENTE SIMPLES
export const ChatTimeline: React.FC<{ messages: ChatMessage[] }> = ({ messages }) => {
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
				const key = msg.id;
				
				if (msg.role === 'user') return <UserMsg key={key} msg={msg} />;
				if (msg.role === 'assistant') return <AssistantMsg key={key} msg={msg} />;
				if (msg.role === 'tool') return <ToolMsg key={key} msg={msg} />;
				if (msg.role === 'kanban') return <KanbanMsg key={key} msg={msg} />;
				
				return null;
			})}
		</Box>
	);
};

// Input - EXTREMAMENTE SIMPLES
export const ChatInput: React.FC<{
	value: string;
	onChange: (val: string) => void;
	onSubmit: () => void;
	disabled: boolean;
}> = ({ value, onChange, onSubmit, disabled }) => {
	return (
		<Box borderStyle="round" borderColor="gray" paddingX={2} paddingY={1} marginX={1} marginBottom={1}>
			{disabled ? (
				<Box>
					<Text color="yellow">[...]</Text>
					<Text color="gray"> Processing...</Text>
				</Box>
			) : (
				<Box>
					<Text color="magenta" bold>&gt; </Text>
					<TextInput value={value} onChange={onChange} onSubmit={onSubmit} />
				</Box>
			)}
		</Box>
	);
};
