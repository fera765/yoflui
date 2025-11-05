/**
 * ConversationUI - UI Elegante para Conversas Normais (Não-Automação)
 * Designer 100% novo com boxes elegantes
 */

import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface Message {
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
}

interface ToolExecution {
	id: string;
	name: string;
	args: any;
	status: 'running' | 'complete' | 'error';
	result?: string;
	startTime: number;
	endTime?: number;
}

interface ConversationUIProps {
	messages: Message[];
	tools: ToolExecution[];
}

const TOOL_ICONS: Record<string, string> = {
	find_files: '🔍',
	write_file: '📝',
	read_file: '📖',
	edit_file: '✏️',
	delete_file: '🗑️',
	execute_shell: '🔧',
	list_files: '📋',
	web_scraper: '🌐',
	default: '⚙️'
};

const getIcon = (name: string) => {
	const key = Object.keys(TOOL_ICONS).find(k => name.includes(k));
	return key ? TOOL_ICONS[key] : TOOL_ICONS.default;
};

const formatDuration = (start: number, end?: number) => {
	if (!end) return '...';
	const ms = end - start;
	const s = ms / 1000;
	return s < 1 ? `${Math.round(ms)}ms` : `${s.toFixed(1)}s`;
};

const MessageBox: React.FC<{ message: Message }> = ({ message }) => {
	if (message.role === 'user') {
		return (
			<Box marginY={1} paddingX={2} paddingY={1} borderStyle="round" borderColor="cyan">
				<Box flexDirection="column">
					<Box>
						<Text color="cyan" bold>👤 VOCÊ</Text>
					</Box>
					<Box marginTop={1}>
						<Text color="white">{message.content}</Text>
					</Box>
				</Box>
			</Box>
		);
	}

	return (
		<Box marginY={1} paddingX={2} paddingY={1} borderStyle="round" borderColor="green">
			<Box flexDirection="column">
				<Box>
					<Text color="green" bold>🤖 FLUI</Text>
				</Box>
				<Box marginTop={1}>
					<Text color="white">{message.content}</Text>
				</Box>
			</Box>
		</Box>
	);
};

const ToolBox: React.FC<{ tool: ToolExecution }> = ({ tool }) => {
	const borderColor = tool.status === 'complete' ? 'green' : 
	                    tool.status === 'error' ? 'red' : 'yellow';
	const icon = getIcon(tool.name);
	const duration = formatDuration(tool.startTime, tool.endTime);

	// Truncar resultado em 10 linhas
	const resultLines = tool.result ? tool.result.split('\n').filter(l => l.trim()) : [];
	const visibleLines = resultLines.slice(0, 10);
	const hiddenCount = Math.max(0, resultLines.length - 10);

	return (
		<Box 
			marginY={1} 
			paddingX={2} 
			paddingY={1} 
			borderStyle="round" 
			borderColor={borderColor}
		>
			<Box flexDirection="column" width="100%">
				{/* HEADER */}
				<Box>
					{tool.status === 'running' && (
						<Text color="yellow">
							<Spinner type="dots" /> 
						</Text>
					)}
					<Text color={borderColor} bold>
						{icon} {tool.name.replace(/_/g, ' ').toUpperCase()}
					</Text>
					<Text color="gray"> ({duration})</Text>
				</Box>

				{/* SEPARADOR */}
				{(tool.result || Object.keys(tool.args).length > 0) && (
					<Box marginTop={1}>
						<Text color="gray">─────────────────────────────────────</Text>
					</Box>
				)}

				{/* ARGS (primeiros 3) */}
				{Object.keys(tool.args).length > 0 && (
					<Box marginTop={1} flexDirection="column">
						{Object.entries(tool.args).slice(0, 3).map(([key, value]) => (
							<Box key={key}>
								<Text color="cyan">{key}: </Text>
								<Text color="white">
									{String(value).substring(0, 60)}
									{String(value).length > 60 ? '...' : ''}
								</Text>
							</Box>
						))}
					</Box>
				)}

				{/* RESULTADO */}
				{tool.result && tool.status === 'complete' && (
					<>
						<Box marginTop={1}>
							<Text color="gray">─────────────────────────────────────</Text>
						</Box>
						<Box marginTop={1} flexDirection="column">
							{visibleLines.map((line, idx) => (
								<Text key={idx} color="white">
									{line.substring(0, 80)}
								</Text>
							))}
							{hiddenCount > 0 && (
								<Text color="gray" italic>
									(+{hiddenCount} linhas ocultas)
								</Text>
							)}
						</Box>
					</>
				)}

				{/* ERRO */}
				{tool.result && tool.status === 'error' && (
					<Box marginTop={1}>
						<Text color="red">❌ {tool.result.substring(0, 150)}</Text>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export const ConversationUI: React.FC<ConversationUIProps> = ({ messages, tools }) => {
	// Últimas 5 mensagens
	const recentMessages = messages.slice(-5);
	
	// Últimas 5 tools
	const recentTools = tools.slice(-5);

	return (
		<Box flexDirection="column">
			{/* MENSAGENS */}
			{recentMessages.map((msg, idx) => (
				<MessageBox key={idx} message={msg} />
			))}

			{/* TOOLS */}
			{recentTools.map((tool, idx) => (
				<ToolBox key={tool.id} tool={tool} />
			))}

			{messages.length > 5 && (
				<Box paddingX={2}>
					<Text color="gray" italic>
						... +{messages.length - 5} mensagens anteriores (use /history)
					</Text>
				</Box>
			)}
		</Box>
	);
};
