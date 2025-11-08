/**
 * ToolExecutionBox - UI Dinâmica e Elegante para Todas as Tools
 * 
 * Características:
 * - Box pequeno com borda estilo kanban
 * - Ícone + nome da tool
 * - Log mostrando 10 linhas + "n linhas ocultas"
 * - Feedback visual em tempo real sem piscar
 * - Borda verde + check no sucesso
 * - Borda vermelha + X no erro
 * - Suporte para todas as tools (automação ou não)
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

export interface ToolExecutionBoxProps {
	name: string;
	args: any;
	status: 'waiting' | 'running' | 'complete' | 'error';
	result?: string;
	startTime?: number;
	endTime?: number;
	icon?: string;
}

const MAX_VISIBLE_LINES = 10;

// Mapeamento completo de ícones por tipo de tool
const TOOL_ICONS: Record<string, string> = {
	// File operations
	write_file: '📝',
	read_file: '📖',
	edit_file: '✏️',
	delete_file: '🗑️',
	find_files: '🔍',
	read_folder: '📂',
	search_text: '🔎',
	list_files: '📋',
	
	// Shell operations
	execute_shell: '⚡',
	shell_input: '⌨️',
	shell_status: '📊',
	
	// Web operations
	web_scraper: '🌐',
	web_scraper_with_context: '🌍',
	web_search: '🔍',
	intelligent_web_research: '🧠',
	keyword_suggestions: '💡',
	
	// YouTube
	search_youtube_comments: '📺',
	youtube_transcript: '📝',
	
	// Kanban & Memory
	update_kanban: '📋',
	save_memory: '💾',
	load_memory: '📚',
	
	// Agent & Flow
	delegate_to_agent: '🤖',
	condition: '🔀',
	trigger_webhook: '🔔',
	webhook_listener: '👂',
	
	// Automation
	automation_executor: '🎯',
	checkpoint_manager: '🔖',
	dry_run: '🧪',
	
	// MCP tools
	mcp: '🔌',
	mcp_tool: '🔧',
	
	// Default
	default: '⚙️'
};

/**
 * Obter ícone da tool
 */
const getToolIcon = (toolName: string, customIcon?: string): string => {
	if (customIcon) return customIcon;
	
	// Match exato
	if (TOOL_ICONS[toolName]) {
		return TOOL_ICONS[toolName];
	}
	
	// Match parcial (case insensitive)
	const normalizedName = toolName.toLowerCase();
	const key = Object.keys(TOOL_ICONS).find(k => 
		normalizedName.includes(k.toLowerCase())
	);
	
	return key ? TOOL_ICONS[key] : TOOL_ICONS.default;
};

/**
 * Formatar nome da tool (snake_case -> Title Case)
 */
const formatToolName = (name: string): string => {
	return name
		.replace(/_/g, ' ')
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
};

/**
 * Extrair argumento principal para exibição
 */
const getMainArg = (args: any): string => {
	if (!args || typeof args !== 'object') return '';
	
	// Ordem de prioridade dos argumentos mais comuns
	const priorityKeys = [
		'command', 'file_path', 'path', 'pattern', 
		'url', 'query', 'text', 'content',
		'video_id', 'search_query', 'task_id'
	];
	
	for (const key of priorityKeys) {
		if (args[key]) {
			const value = String(args[key]);
			return value.length > 40 ? value.substring(0, 37) + '...' : value;
		}
	}
	
	// Fallback: primeiro valor encontrado
	const firstValue = Object.values(args)[0];
	if (firstValue) {
		const value = String(firstValue);
		return value.length > 40 ? value.substring(0, 37) + '...' : value;
	}
	
	return '';
};

/**
 * Truncar logs em N linhas
 */
const truncateLogLines = (text: string, maxLines: number = MAX_VISIBLE_LINES): {
	visible: string[];
	hiddenCount: number;
} => {
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

/**
 * Calcular duração da execução
 */
const calculateDuration = (startTime?: number, endTime?: number): string => {
	if (!startTime) return '';
	
	const end = endTime || Date.now();
	const durationMs = end - startTime;
	const durationSec = durationMs / 1000;
	
	if (durationSec < 1) {
		return `${durationMs}ms`;
	} else if (durationSec < 60) {
		return `${durationSec.toFixed(2)}s`;
	} else {
		const minutes = Math.floor(durationSec / 60);
		const seconds = Math.floor(durationSec % 60);
		return `${minutes}m ${seconds}s`;
	}
};

/**
 * ToolExecutionBox Component
 */
export const ToolExecutionBox: React.FC<ToolExecutionBoxProps> = React.memo(({
	name,
	args,
	status,
	result,
	startTime,
	endTime,
	icon: customIcon
}) => {
	const [displayResult, setDisplayResult] = useState(result || '');
	const [currentDuration, setCurrentDuration] = useState('');
	
	// Atualizar resultado em tempo real sem piscar
	useEffect(() => {
		if (result !== undefined) {
			setDisplayResult(result);
		}
	}, [result]);
	
	// Atualizar duração em tempo real para execuções em andamento
	useEffect(() => {
		if (status === 'running' && startTime) {
			const interval = setInterval(() => {
				setCurrentDuration(calculateDuration(startTime));
			}, 100);
			
			return () => clearInterval(interval);
		} else if (endTime && startTime) {
			setCurrentDuration(calculateDuration(startTime, endTime));
		}
	}, [status, startTime, endTime]);
	
	// Configurações visuais por status
	const visualConfig = {
		waiting: {
			borderColor: 'cyan',
			icon: '⏳',
			showSpinner: false
		},
		running: {
			borderColor: 'yellow',
			icon: '⟳',
			showSpinner: true
		},
		complete: {
			borderColor: 'green',
			icon: '✓',
			showSpinner: false
		},
		error: {
			borderColor: 'red',
			icon: '✗',
			showSpinner: false
		}
	};
	
	const config = visualConfig[status];
	const toolIcon = getToolIcon(name, customIcon);
	const toolName = formatToolName(name);
	const mainArg = getMainArg(args);
	const { visible, hiddenCount } = truncateLogLines(displayResult);
	const duration = currentDuration || calculateDuration(startTime, endTime);
	
	return (
		<Box 
			flexDirection="column" 
			borderStyle="round" 
			borderColor={config.borderColor}
			paddingX={1}
			paddingY={0}
			marginY={1}
		>
			{/* HEADER: Ícone + Nome + Status */}
			<Box justifyContent="space-between" width="100%">
				<Box>
					{config.showSpinner && (
						<Text color="yellow">
							<Spinner type="dots" />{' '}
						</Text>
					)}
					<Text>{toolIcon} </Text>
					<Text color={config.borderColor} bold>{toolName}</Text>
					{mainArg && (
						<Text color="gray" dimColor> → {mainArg}</Text>
					)}
				</Box>
				
				{/* Status Icon + Duração */}
				{!config.showSpinner && (
					<Box>
						<Text color={config.borderColor} bold>{config.icon}</Text>
						{duration && (
							<Text color="gray" dimColor> {duration}</Text>
						)}
					</Box>
				)}
				{config.showSpinner && duration && (
					<Text color="gray" dimColor>{duration}</Text>
				)}
			</Box>
			
			{/* LOGS: Máximo 10 linhas visíveis */}
			{visible.length > 0 && (
				<Box flexDirection="column" marginTop={1} marginLeft={2}>
					{visible.map((line, idx) => (
						<Text key={idx} color="white" wrap="truncate-end">
							{line}
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
	// Otimização: só re-renderizar se algo relevante mudar
	return (
		prevProps.name === nextProps.name &&
		prevProps.status === nextProps.status &&
		prevProps.result === nextProps.result
	);
});

ToolExecutionBox.displayName = 'ToolExecutionBox';
