/**
 * Timeline Component - Nova implementa??o limpa seguindo Doc do Ink
 * 
 * Baseado em: https://github.com/vadimdemedes/ink
 * - Usa Box com flexDirection="column" para lista vertical
 * - Keys ?nicas para cada item (usando msg.id)
 * - Text sempre dentro de Box
 * - Sem renderiza??o duplicada
 */

import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

// Tipos
export interface Message {
	role: 'user' | 'assistant' | 'tool' | 'kanban';
	content: string;
	id: string;  // ID ?nico obrigat?rio
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

// Cores consistentes
const COLORS = {
	userText: '#66d9ef',    // Azul
	userPrompt: '#f92672',  // Rosa
	assistant: '#a6e22e',   // Verde
	tool: '#fd971f',        // Laranja
	toolSuccess: '#a6e22e', // Verde
	toolError: '#f92672',   // Vermelho
	kanban: '#ae81ff',      // Roxo
	dim: '#75715e',         // Cinza
};

// === COMPONENTES INDIVIDUAIS ===

// Mensagem do usu?rio
const UserMessage: React.FC<{ text: string; id: string }> = ({ text, id }) => (
	<Box key={id} marginY={1}>
		<Text color={COLORS.userPrompt} bold>&gt; </Text>
		<Text color={COLORS.userText}>{text}</Text>
	</Box>
);

// Mensagem do assistente
const AssistantMessage: React.FC<{ text: string; id: string }> = ({ text, id }) => (
	<Box key={id} marginY={1} paddingX={1}>
		<Text color={COLORS.assistant}>{text}</Text>
	</Box>
);

// Tool em execu??o ou completo
const ToolMessage: React.FC<{
	name: string;
	status: 'running' | 'complete' | 'error';
	result?: string;
	id: string;
}> = ({ name, status, result, id }) => {
	const isRunning = status === 'running';
	const isError = status === 'error';
	const color = isError ? COLORS.toolError : isRunning ? COLORS.tool : COLORS.toolSuccess;
	
	return (
		<Box key={id} marginY={1} flexDirection="column">
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
						{isError ? '?' : '?'}{' '}
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
};

// Kanban board
const KanbanMessage: React.FC<{
	tasks: Array<{ id: string; title: string; status: string }>;
	id: string;
}> = ({ tasks, id }) => (
	<Box key={id} marginY={1} flexDirection="column" borderStyle="round" borderColor={COLORS.kanban} paddingX={2} paddingY={1}>
		<Box marginBottom={1}>
			<Text color={COLORS.kanban} bold>?? Tasks</Text>
		</Box>
		{tasks.map((task) => {
			const icon =
				task.status === 'completed' ? '?' :
				task.status === 'in-progress' ? '?' :
				'?';
			const color =
				task.status === 'completed' ? COLORS.toolSuccess :
				task.status === 'in-progress' ? COLORS.tool :
				COLORS.dim;
			
			return (
				<Box key={task.id}>
					<Text color={color}>{icon} </Text>
					<Text color={color}>{task.title}</Text>
				</Box>
			);
		})}
	</Box>
);

// === COMPONENTE PRINCIPAL DA TIMELINE ===

export const Timeline: React.FC<{ messages: Message[] }> = ({ messages }) => {
	// Se n?o h? mensagens, mostrar estado vazio
	if (messages.length === 0) {
		return (
			<Box flexDirection="column" alignItems="center" justifyContent="center" paddingY={5}>
				<Text color={COLORS.assistant} bold>[ READY ]</Text>
			</Box>
		);
	}

	// Renderizar mensagens
	// CR?TICO: Usar msg.id como key para evitar duplica??o
	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			{messages.map((msg) => {
				// IMPORTANTE: Cada tipo retorna seu pr?prio componente com key ?nica
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

				// Fallback: n?o renderizar nada se tipo desconhecido
				return null;
			})}
		</Box>
	);
};

// Input component
export const InputBox: React.FC<{
	value: string;
	onChange: (val: string) => void;
	onSubmit: () => void;
	isProcessing: boolean;
}> = ({ value, onChange, onSubmit, isProcessing }) => {
	return (
		<Box flexDirection="column" width="100%">
			<Box
				borderStyle="round"
				borderColor="#3e3d32"
				paddingX={2}
				paddingY={1}
				marginX={1}
				marginBottom={1}
				width="100%"
			>
				{isProcessing ? (
					<Box>
						<Text color={COLORS.tool}>
							<Spinner type="dots" />
						</Text>
						<Text color={COLORS.dim}> Processing...</Text>
					</Box>
				) : (
					<Box width="100%">
						<Text color={COLORS.userPrompt} bold>&gt; </Text>
						<Box flexGrow={1}>
							<Text>{value}</Text>
						</Box>
					</Box>
				)}
			</Box>
		</Box>
	);
};
