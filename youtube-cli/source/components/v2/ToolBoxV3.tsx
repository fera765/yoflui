/**
 * ToolBox V3 - UI Dinâmica e Elegante
 * Box pequeno com borda estilo kanban, ícone, nome da tool, log (10 linhas + "n linhas ocultas")
 * Atualização em tempo real sem piscar, borda verde + check no sucesso, borda vermelha + X no erro
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useStdout } from 'ink';
import Spinner from 'ink-spinner';

interface ToolBoxV3Props {
	name: string;
	args: any;
	status: 'running' | 'complete' | 'error' | 'waiting';
	result?: string;
	startTime?: number;
	endTime?: number;
}

const MAX_VISIBLE_LINES = 10;

// Ícones por tipo de tool (completo)
const TOOL_ICONS: Record<string, string> = {
	// File operations
	write_file: '📝',
	read_file: '📖',
	edit_file: '✏️',
	delete_file: '🗑️',
	find_files: '🔍',
	read_folder: '📂',
	search_text: '🔎',
	
	// Shell operations
	execute_shell: '🔧',
	shell_input: '⌨️',
	shell_status: '📊',
	
	// Web operations
	web_scraper: '🌐',
	web_scraper_with_context: '🌐',
	web_search: '🔍',
	intelligent_web_research: '🧠',
	keyword_suggestions: '💡',
	
	// YouTube
	search_youtube_comments: '📺',
	
	// Kanban & Memory
	update_kanban: '📋',
	save_memory: '💾',
	
	// Agent & Flow
	delegate_to_agent: '🤖',
	condition: '🔀',
	trigger_webhook: '🔔',
	
	// MCP tools (genérico)
	mcp: '🔌',
	
	default: '⚙️'
};

const getToolIcon = (toolName: string): string => {
	// Verificar match exato primeiro
	if (TOOL_ICONS[toolName]) {
		return TOOL_ICONS[toolName];
	}
	
	// Verificar match parcial
	const key = Object.keys(TOOL_ICONS).find(k => toolName.toLowerCase().includes(k.toLowerCase()));
	return key ? TOOL_ICONS[key] : TOOL_ICONS.default;
};

const truncateLogLines = (text: string, maxLines: number = MAX_VISIBLE_LINES): { visible: string[]; hiddenCount: number } => {
	if (!text) return { visible: [], hiddenCount: 0 };
	
	const lines = text.split('\n').filter(l => l.trim() !== '');
	
	if (lines.length <= maxLines) {
		return { visible: lines, hiddenCount: 0 };
	}
	
	return {
		visible: lines.slice(0, maxLines),
		hiddenCount: lines.length - maxLines
	};
};

const formatToolName = (name: string): string => {
	return name
		.replace(/_/g, ' ')
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

const getMainArg = (args: any): string => {
	if (!args) return '';
	if (args.command) return args.command;
	if (args.file_path) return args.file_path;
	if (args.path) return args.path;
	if (args.pattern) return args.pattern;
	if (args.url) return args.url;
	if (args.query) return args.query;
	if (typeof args === 'string') return args;
	return '';
};

export const ToolBoxV3: React.FC<ToolBoxV3Props> = React.memo(({ name, args, status, result, startTime, endTime }) => {
	const { stdout } = useStdout();
	const terminalWidth = stdout?.columns || 80;
	const [displayResult, setDisplayResult] = useState(result || '');
	
	// Atualizar resultado em tempo real sem piscar
	useEffect(() => {
		if (result !== undefined) {
			setDisplayResult(result);
		}
	}, [result]);
	
	const icon = getToolIcon(name);
	const toolName = formatToolName(name);
	const mainArg = getMainArg(args);
	
	// Cores e bordas dinâmicas
	let borderColor = 'cyan';
	let statusIcon = '';
	
	if (status === 'running') {
		borderColor = 'yellow';
		statusIcon = '⟳';
	} else if (status === 'complete') {
		borderColor = 'green';
		statusIcon = '✓';
	} else if (status === 'error') {
		borderColor = 'red';
		statusIcon = '✗';
	} else if (status === 'waiting') {
		borderColor = 'cyan';
		statusIcon = '⏳';
	}
	
	// Processar logs
	const { visible, hiddenCount } = truncateLogLines(displayResult, MAX_VISIBLE_LINES);
	
	// Calcular duração
	const duration = startTime && endTime 
		? `${((endTime - startTime) / 1000).toFixed(2)}s`
		: startTime 
		? `${((Date.now() - startTime) / 1000).toFixed(1)}s`
		: '';
	
	return (
		<Box 
			flexDirection="column" 
			borderStyle="round" 
			borderColor={borderColor}
			paddingX={1} 
			paddingY={1} 
			marginY={1}
			width="100%"
		>
			{/* HEADER: Ícone + Nome + Status */}
			<Box justifyContent="space-between" alignItems="center">
				<Box>
					{status === 'running' && (
						<Text color="yellow">
							<Spinner type="dots" />{' '}
						</Text>
					)}
					<Text>{icon} </Text>
					<Text color={borderColor} bold>{toolName}</Text>
					{mainArg && (
						<>
							<Text color="gray"> </Text>
							<Text color="cyan" dimColor>
								{mainArg.length > 30 ? mainArg.substring(0, 27) + '...' : mainArg}
							</Text>
						</>
					)}
				</Box>
				
				{/* Status icon no canto direito */}
				{status !== 'running' && statusIcon && (
					<Box>
						<Text color={borderColor} bold>{statusIcon}</Text>
						{duration && (
							<Text color="gray"> {duration}</Text>
						)}
					</Box>
				)}
			</Box>
			
			{/* LOGS: Máximo 10 linhas visíveis */}
			{visible.length > 0 && (
				<Box flexDirection="column" marginTop={1}>
					{visible.map((line, idx) => (
						<Text key={idx} color="white" wrap="truncate-end">
							{line.length > terminalWidth - 6 ? line.substring(0, terminalWidth - 9) + '...' : line}
						</Text>
					))}
					{hiddenCount > 0 && (
						<Text color="gray" dimColor italic>
							({hiddenCount} linhas ocultas)
						</Text>
					)}
				</Box>
			)}
		</Box>
	);
}, (prevProps, nextProps) => {
	// Otimização: só re-renderizar se status ou result mudarem
	return (
		prevProps.name === nextProps.name &&
		prevProps.status === nextProps.status &&
		prevProps.result === nextProps.result &&
		prevProps.args === nextProps.args
	);
});
