/**
 * Tool Group Message Component
 * Renders multiple tool executions as a group
 */

import React from 'react';
import { Box, Text } from 'ink';
import { ToolMessage } from './ToolMessage.js';
import type { ToolCall } from '../../types.js';

export interface ToolGroupMessageProps {
	tools: ToolCall[];
	terminalWidth?: number;
}

export const ToolGroupMessage: React.FC<ToolGroupMessageProps> = ({ tools, terminalWidth }) => {
	if (tools.length === 0) return null;
	
	const allComplete = tools.every(t => t.status === 'complete');
	const hasError = tools.some(t => t.status === 'error');
	const borderColor = hasError ? 'red' : allComplete ? 'green' : 'yellow';
	
	return (
		<Box marginY={1} borderStyle="round" borderColor={borderColor} paddingX={1} flexDirection="column">
			<Box marginBottom={1}>
				<Text color={borderColor} bold>
					[TOOLS] {tools.length} tool{tools.length === 1 ? '' : 's'}
				</Text>
			</Box>
			{tools.map((tool, index) => (
				<Box key={index} marginBottom={index < tools.length - 1 ? 1 : 0}>
					<ToolMessage tool={tool} terminalWidth={terminalWidth} />
				</Box>
			))}
		</Box>
	);
};
