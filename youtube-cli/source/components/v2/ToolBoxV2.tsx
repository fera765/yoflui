/**
 * ToolBox V2 - UI Remodelada Elegante
 * Sistema de cores dinâmico, ícones por tipo, limitação de 10 linhas
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';
import Spinner from 'ink-spinner';

interface ToolBoxV2Props {
	name: string;
	args: any;
	status: 'running' | 'complete' | 'error' | 'waiting';
	result?: string;
	startTime?: number;
	endTime?: number;
}

const MAX_VISIBLE_LINES = 10;

// Ícones por tipo de tool
const TOOL_ICONS: Record<string, string> = {
	write_file: '📝',
	read_file: '📖',
	edit_file: '✏️',
	delete_file: '🗑️',
	execute_shell: '🔧',
	execute_command: '🔧',
	list_files: '📋',
	find_files: '🔍',
	read_folder: '📋',
	install_package: '📦',
	web_scraper: '🌐',
	default: '⚙️'
};

// Cores por status
const STATUS_COLORS: Record<string, string> = {
	running: 'yellow',
	complete: 'green',
	error: 'red',
	waiting: 'cyan'
};

const getToolIcon = (toolName: string): string => {
	const key = Object.keys(TOOL_ICONS).find(k => toolName.toLowerCase().includes(k));
	return key ? TOOL_ICONS[key] : TOOL_ICONS.default;
};

const parseEditDiff = (result: string) => {
	const lines = result.split('\n');
	const diffLines: Array<{lineNum: number; type: 'add' | 'remove' | 'same'; content: string}> = [];
	let totalAdded = 0;
	let totalRemoved = 0;
	let charsAdded = 0;
	let charsRemoved = 0;
	
	for (const line of lines) {
		if (line.startsWith('+ ')) {
			const content = line.substring(2);
			diffLines.push({ lineNum: diffLines.length + 1, type: 'add', content });
			totalAdded++;
			charsAdded += content.length;
		} else if (line.startsWith('- ')) {
			const content = line.substring(2);
			diffLines.push({ lineNum: diffLines.length + 1, type: 'remove', content });
			totalRemoved++;
			charsRemoved += content.length;
		} else if (line.trim()) {
			diffLines.push({ lineNum: diffLines.length + 1, type: 'same', content: line });
		}
	}
	
	return { diffLines, totalAdded, totalRemoved, charsAdded, charsRemoved };
};

const truncateContent = (text: string, maxLines: number = MAX_VISIBLE_LINES): { content: string[]; hiddenCount: number } => {
	const lines = text.split('\n').filter(l => l.trim() !== '');
	
	if (lines.length <= maxLines) {
		return { content: lines, hiddenCount: 0 };
	}
	
	return {
		content: lines.slice(0, maxLines),
		hiddenCount: lines.length - maxLines
	};
};

const formatDuration = (startTime?: number, endTime?: number): string => {
	if (!startTime) return '';
	const end = endTime || Date.now();
	const duration = (end - startTime) / 1000;
	return duration < 1 ? `${Math.round(duration * 1000)}ms` : `${duration.toFixed(2)}s`;
};

export const ToolBoxV2: React.FC<ToolBoxV2Props> = React.memo(({ name, args, status, result, startTime, endTime }) => {
	const { stdout } = useStdout();
	const terminalWidth = stdout?.columns || 80;
	
	const icon = getToolIcon(name);
	const borderColor = STATUS_COLORS[status] || 'cyan';
	const toolName = name.replace(/_/g, ' ').toUpperCase();
	
	const fileName = args?.file_path || args?.path || args?.pattern || '';
	const isEdit = name === 'edit_file';
	const isLog = name.includes('log') || name.includes('shell') || name.includes('command');
	
	let contentLines: string[] = [];
	let hiddenCount = 0;
	let footerStats = '';
	
	// Processar conteúdo baseado no tipo
	if (result && isEdit) {
		// UI de Diff para edições
		const { diffLines, totalAdded, totalRemoved, charsAdded, charsRemoved } = parseEditDiff(result);
		const visibleLines = diffLines.slice(0, MAX_VISIBLE_LINES);
		hiddenCount = Math.max(0, diffLines.length - MAX_VISIBLE_LINES);
		
		contentLines = visibleLines.map(l => {
			const prefix = l.type === 'add' ? '+' : l.type === 'remove' ? '-' : ' ';
			const color = l.type === 'add' ? 'green' : l.type === 'remove' ? 'red' : 'white';
			return `${color}|${prefix} ${l.content}`;
		});
		
		footerStats = `${totalAdded + totalRemoved} linhas alteradas, +${charsAdded} -${charsRemoved} caracteres`;
	} else if (result && isLog) {
		// Logs: últimas 10 linhas (mais recentes)
		const allLines = result.split('\n').filter(l => l.trim() !== '');
		const recentLines = allLines.slice(-MAX_VISIBLE_LINES);
		contentLines = recentLines.map(l => `white|${l}`);
		hiddenCount = Math.max(0, allLines.length - MAX_VISIBLE_LINES);
		footerStats = `${allLines.length} linhas totais`;
	} else if (result) {
		// Conteúdo genérico: primeiras 10 linhas
		const truncated = truncateContent(result, MAX_VISIBLE_LINES);
		contentLines = truncated.content.map(l => `white|${l}`);
		hiddenCount = truncated.hiddenCount;
		footerStats = result.length > 1000 ? `${(result.length / 1024).toFixed(1)}KB` : `${result.length} bytes`;
	}
	
	const duration = formatDuration(startTime, endTime);
	const separatorWidth = Math.min(terminalWidth - 8, 70);
	const separator = '─'.repeat(separatorWidth);
	
	return (
		<Box 
			flexDirection="column" 
			borderStyle="round" 
			borderColor={borderColor} 
			paddingX={2} 
			paddingY={1} 
			marginY={1}
		>
			{/* HEADER */}
			<Box>
				{status === 'running' && (
					<Text color="yellow">
						<Spinner type="dots" /> 
					</Text>
				)}
				<Text>{icon} </Text>
				<Text color={borderColor} bold>{toolName}</Text>
				{fileName && (
					<>
						<Text color="gray"> → </Text>
						<Text color="cyan">{fileName.length > 40 ? '...' + fileName.slice(-37) : fileName}</Text>
					</>
				)}
				{duration && status !== 'running' && (
					<Text color="gray"> ({duration})</Text>
				)}
			</Box>
			
			{/* SEPARADOR */}
			{contentLines.length > 0 && (
				<Box marginTop={1}>
					<Text color="gray">{separator}</Text>
				</Box>
			)}
			
			{/* CONTEÚDO (máximo 10 linhas) */}
			{contentLines.length > 0 && (
				<Box flexDirection="column" marginTop={1}>
					{contentLines.map((line, idx) => {
						const [color, content] = line.split('|');
						return (
							<Text key={idx} color={color as any}>
								{content}
							</Text>
						);
					})}
					{hiddenCount > 0 && (
						<Text color="gray" italic>
							(+{hiddenCount} linhas ocultas)
						</Text>
					)}
				</Box>
			)}
			
			{/* SEPARADOR */}
			{footerStats && (
				<Box marginTop={1}>
					<Text color="gray">{separator}</Text>
				</Box>
			)}
			
			{/* RODAPÉ */}
			{footerStats && (
				<Box marginTop={1}>
					<Text color="gray" dimColor>{footerStats}</Text>
				</Box>
			)}
		</Box>
	);
}, (prevProps, nextProps) => {
	return (
		prevProps.name === nextProps.name &&
		prevProps.status === nextProps.status &&
		prevProps.result === nextProps.result
	);
});
