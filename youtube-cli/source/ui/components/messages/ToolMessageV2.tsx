/**
 * ToolMessage V2 - UI Remodelada
 * Componente individual de tool para o sistema de mensagens
 */

import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { ToolCall } from '../../types.js';

const MAX_LINES = 10;

// Ícones por tipo
const TOOL_ICONS: Record<string, string> = {
	write_file: '📝',
	read_file: '📖',
	edit_file: '✏️',
	delete_file: '🗑️',
	execute_shell: '🔧',
	list_files: '📋',
	find_files: '🔍',
	web_scraper: '🌐',
	default: '⚙️'
};

const getIcon = (name: string): string => {
	const key = Object.keys(TOOL_ICONS).find(k => name.toLowerCase().includes(k));
	return key ? TOOL_ICONS[key] : TOOL_ICONS.default;
};

export interface ToolMessageV2Props {
	tool: ToolCall;
	terminalWidth?: number;
}

export const ToolMessageV2: React.FC<ToolMessageV2Props> = ({ tool, terminalWidth = 80 }) => {
	const borderColor = tool.status === 'error' ? 'red' : 
	                    tool.status === 'complete' ? 'green' : 
	                    tool.status === 'running' ? 'yellow' : 'cyan';
	
	const icon = getIcon(tool.name);
	const toolName = tool.name.replace(/_/g, ' ').toUpperCase();
	
	// Truncar resultado em 10 linhas
	const resultLines = tool.result ? tool.result.split('\n').filter(l => l.trim() !== '') : [];
	const visibleLines = resultLines.slice(0, MAX_LINES);
	const hiddenCount = Math.max(0, resultLines.length - MAX_LINES);
	
	const separator = '─'.repeat(Math.min(terminalWidth - 8, 60));
	
	return (
		<Box 
			marginY={1} 
			borderStyle="round" 
			borderColor={borderColor} 
			paddingX={2} 
			paddingY={1}
			flexDirection="column"
		>
			{/* HEADER */}
			<Box>
				{tool.status === 'running' && (
					<Text color="yellow">
						<Spinner type="dots" /> 
					</Text>
				)}
				<Text>{icon} </Text>
				<Text color={borderColor} bold>{toolName}</Text>
			</Box>
			
			{/* ARGS */}
			{Object.keys(tool.args).length > 0 && (
				<Box marginTop={1} flexDirection="column">
					<Text color="gray">{separator}</Text>
					<Box marginTop={1} flexDirection="column">
						{Object.entries(tool.args).slice(0, 3).map(([key, value]) => (
							<Box key={key}>
								<Text color="cyan">{key}: </Text>
								<Text color="white">
									{String(value).substring(0, 50)}
									{String(value).length > 50 ? '...' : ''}
								</Text>
							</Box>
						))}
					</Box>
				</Box>
			)}
			
			{/* RESULTADO */}
			{tool.result && (
				<Box marginTop={1} flexDirection="column">
					<Text color="gray">{separator}</Text>
					<Box marginTop={1} flexDirection="column">
						{visibleLines.map((line, idx) => (
							<Text key={idx} color="white">
								{line.substring(0, terminalWidth - 10)}
							</Text>
						))}
						{hiddenCount > 0 && (
							<Text color="gray" italic>
								(+{hiddenCount} linhas ocultas)
							</Text>
						)}
					</Box>
				</Box>
			)}
		</Box>
	);
};
