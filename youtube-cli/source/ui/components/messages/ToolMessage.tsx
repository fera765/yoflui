/**
 * Tool Message Component
 * Renders a single tool execution
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { ToolCall } from '../../types.js';

export interface ToolMessageProps {
	tool: ToolCall;
	terminalWidth?: number;
}

export const ToolMessage: React.FC<ToolMessageProps> = ({ tool }) => {
	const statusColor = tool.status === 'error' ? 'red' : tool.status === 'complete' ? 'green' : 'yellow';
	const statusIcon = tool.status === 'error' ? '?' : tool.status === 'complete' ? '?' : '?';
	
	return (
		<Box marginY={1} borderStyle="round" borderColor={statusColor} paddingX={1}>
			<Box flexDirection="column" width="100%">
				<Box>
					<Text color={statusColor} bold>{statusIcon} </Text>
					<Text color={statusColor} bold>{tool.name}</Text>
				</Box>
				{Object.keys(tool.args).length > 0 && (
					<Box marginLeft={2}>
						<Text color="gray">
							{JSON.stringify(tool.args, null, 2)}
						</Text>
					</Box>
				)}
				{tool.result && (
					<Box marginLeft={2} marginTop={1}>
						<Text color="white">{tool.result}</Text>
					</Box>
				)}
			</Box>
		</Box>
	);
};
