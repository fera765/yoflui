/**
 * ToolGroupMessage V2 - UI Remodelada
 * Agrupa múltiplas tools com status consolidado
 */

import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { ToolMessageV2 } from './ToolMessageV2.js';
import type { ToolCall } from '../../types.js';

export interface ToolGroupMessageV2Props {
	tools: ToolCall[];
	terminalWidth?: number;
}

export const ToolGroupMessageV2: React.FC<ToolGroupMessageV2Props> = ({ tools, terminalWidth = 80 }) => {
	if (!tools || tools.length === 0) return null;
	
	const allComplete = tools.every(t => t.status === 'complete');
	const hasError = tools.some(t => t.status === 'error');
	const isRunning = tools.some(t => t.status === 'running');
	
	const borderColor = hasError ? 'red' : allComplete ? 'green' : isRunning ? 'yellow' : 'cyan';
	const separator = '─'.repeat(Math.min(terminalWidth - 8, 60));
	
	const completedCount = tools.filter(t => t.status === 'complete').length;
	const errorCount = tools.filter(t => t.status === 'error').length;
	const runningCount = tools.filter(t => t.status === 'running').length;
	
	return (
		<Box 
			marginY={1} 
			borderStyle="round" 
			borderColor={borderColor} 
			paddingX={2} 
			paddingY={1}
			flexDirection="column"
		>
			{/* HEADER DO GRUPO */}
			<Box>
				{isRunning && (
					<Text color="yellow">
						<Spinner type="dots" /> 
					</Text>
				)}
				<Text>🔧 </Text>
				<Text color={borderColor} bold>TOOLS GROUP</Text>
				<Text color="gray"> ({tools.length} tools)</Text>
			</Box>
			
			{/* STATS */}
			<Box marginTop={1}>
				<Text color="gray">{separator}</Text>
			</Box>
			<Box marginTop={1}>
				{completedCount > 0 && (
					<>
						<Text color="green">✓ {completedCount}</Text>
						<Text color="gray"> | </Text>
					</>
				)}
				{errorCount > 0 && (
					<>
						<Text color="red">✗ {errorCount}</Text>
						<Text color="gray"> | </Text>
					</>
				)}
				{runningCount > 0 && (
					<Text color="yellow">⟳ {runningCount}</Text>
				)}
			</Box>
			
			{/* SEPARADOR */}
			<Box marginTop={1} marginBottom={1}>
				<Text color="gray">{separator}</Text>
			</Box>
			
			{/* TOOLS INDIVIDUAIS */}
			{tools.map((tool, index) => (
				<Box key={index} marginBottom={index < tools.length - 1 ? 1 : 0}>
					<ToolMessageV2 tool={tool} terminalWidth={terminalWidth} />
				</Box>
			))}
		</Box>
	);
};
