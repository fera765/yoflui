/**
 * Assistant Message Component
 * Based on qwen-code GeminiMessage.tsx
 */

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { MaxSizedBox } from '../shared/MaxSizedBox.js';

export interface AssistantMessageProps {
	text: string;
	isPending?: boolean;
	availableTerminalHeight?: number;
	terminalWidth: number;
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({ 
	text, 
	isPending,
	availableTerminalHeight,
	terminalWidth
}) => {
	const lines = useMemo(() => text.split('\n'), [text]);
	
	// NEVER truncate assistant messages - always show full content
	// MaxSizedBox should only be used for extremely long messages (>1000 lines)
	const shouldTruncate = availableTerminalHeight !== undefined && lines.length > 1000;
	
	if (shouldTruncate) {
		return (
			<Box marginY={1} paddingLeft={2}>
				<MaxSizedBox 
					maxHeight={1000} 
					maxWidth={terminalWidth - 4}
					overflowDirection="top"
				>
					{lines.map((line, index) => (
						<Box key={index}>
							<Text wrap="wrap" color="green">{line || ' '}</Text>
						</Box>
					))}
					{isPending && (
						<Box>
							<Text color="yellow">?</Text>
						</Box>
					)}
				</MaxSizedBox>
			</Box>
		);
	}
	
	// Default: show all content without truncation
	return (
		<Box marginY={1} paddingLeft={2} flexDirection="column">
			{lines.map((line, index) => (
				<Box key={index}>
					<Text color="green">{line || ' '}</Text>
				</Box>
			))}
			{isPending && <Text color="yellow">?</Text>}
		</Box>
	);
};
