/**
 * OptimizedTimeline - Timeline otimizada com memoiza??o
 * 
 * Resolve:
 * - Piscagem constante
 * - Renderiza??es excessivas
 * - Tremor durante execu??o de ferramentas
 */

import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

export interface Message {
	role: 'user' | 'assistant' | 'tool' | 'kanban';
	content: string;
	id: string;
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

const COLORS = {
	userText: '#66d9ef',
	userPrompt: '#f92672',
	assistant: '#a6e22e',
	tool: '#fd971f',
	toolSuccess: '#a6e22e',
	toolError: '#f92672',
	kanban: '#ae81ff',
	dim: '#75715e',
};

// Componentes memoizados para evitar re-renderiza??es
const UserMessage = React.memo<{ text: string; id: string }>(({ text }) => (
	<Box marginY={1}>
		<Text color={COLORS.userPrompt} bold>&gt; </Text>
		<Text color={COLORS.userText}>{text}</Text>
	</Box>
));
UserMessage.displayName = 'UserMessage';

const AssistantMessage = React.memo<{ text: string; id: string }>(({ text }) => (
	<Box marginY={1} paddingX={1}>
		<Text color={COLORS.assistant}>{text}</Text>
	</Box>
));
AssistantMessage.displayName = 'AssistantMessage';

const ToolMessage = React.memo<{
	name: string;
	status: 'running' | 'complete' | 'error';
	result?: string;
	id: string;
}>(({ name, status, result }) => {
	const isRunning = status === 'running';
	const isError = status === 'error';
	const color = isError ? COLORS.toolError : isRunning ? COLORS.tool : COLORS.toolSuccess;
	
	return (
		<Box marginY={1} flexDirection="column">
			<Box>
				{isRunning && (
					<Box marginRight={1}>
						<Text color={color}>
							<Spinner type="dots" />
						</Text>
					</Box>
				)}
				{!isRunning && (
					<Text color={color} bold>
						{isError ? '[X]' : '[OK]'}{' '}
					</Text>
				)}
				<Text color={color} bold>{name}</Text>
			</Box>
			{result && (
				<Box paddingLeft={2} marginTop={1}>
					<Text color={COLORS.dim} dimColor>{result.substring(0, 100)}</Text>
				</Box>
			)}
		</Box>
	);
});
ToolMessage.displayName = 'ToolMessage';

const KanbanMessage = React.memo<{
	tasks: Array<{ id: string; title: string; status: string }>;
	id: string;
}>(({ tasks }) => (
	<Box marginY={1} flexDirection="column" borderStyle="round" borderColor={COLORS.kanban} paddingX={2} paddingY={1}>
		<Box marginBottom={1}>
			<Text color={COLORS.kanban} bold>[TASKS]</Text>
		</Box>
		{tasks.map((task) => {
			const icon =
				task.status === 'done' ? '[V]' :
				task.status === 'in_progress' ? '[>]' :
				'[ ]';
			const color =
				task.status === 'done' ? COLORS.toolSuccess :
				task.status === 'in_progress' ? COLORS.tool :
				COLORS.dim;
			
			return (
				<Box key={task.id}>
					<Text color={color}>{icon} </Text>
					<Text color={color}>{task.title}</Text>
				</Box>
			);
		})}
	</Box>
));
KanbanMessage.displayName = 'KanbanMessage';

// Timeline principal otimizada
export const OptimizedTimeline: React.FC<{ messages: Message[] }> = React.memo(({ messages }) => {
	if (messages.length === 0) {
		return (
			<Box flexDirection="column" alignItems="center" justifyContent="center" paddingY={5}>
				<Text color={COLORS.assistant} bold>[ READY ]</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			{messages.map((msg) => {
				if (msg.role === 'user') {
					return <UserMessage key={msg.id} id={msg.id} text={msg.content} />;
				}

				if (msg.role === 'assistant') {
					return <AssistantMessage key={msg.id} id={msg.id} text={msg.content} />;
				}

				if (msg.role === 'tool' && msg.toolCall) {
					return (
						<ToolMessage
							key={msg.id}
							id={msg.id}
							name={msg.toolCall.name}
							status={msg.toolCall.status}
							result={msg.toolCall.result}
						/>
					);
				}

				if (msg.role === 'kanban' && msg.kanban) {
					return <KanbanMessage key={msg.id} id={msg.id} tasks={msg.kanban} />;
				}

				return null;
			})}
		</Box>
	);
}, (prevProps, nextProps) => {
	// Compara??o otimizada: apenas re-renderiza se o array mudou
	if (prevProps.messages.length !== nextProps.messages.length) {
		return false;
	}
	
	// Verificar se alguma mensagem mudou
	for (let i = 0; i < prevProps.messages.length; i++) {
		if (prevProps.messages[i].id !== nextProps.messages[i].id) {
			return false;
		}
		// Verificar se o status de tool mudou
		if (prevProps.messages[i].toolCall?.status !== nextProps.messages[i].toolCall?.status) {
			return false;
		}
	}
	
	return true; // N?o re-renderizar
});

OptimizedTimeline.displayName = 'OptimizedTimeline';
