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
	
	// MaxSizedBox expects Box elements as direct children
	// Each Box represents one line
	if (availableTerminalHeight !== undefined) {
		return (
			<Box marginY={1} paddingLeft={2}>
				<MaxSizedBox 
					maxHeight={availableTerminalHeight} 
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
	
	// Fallback without MaxSizedBox
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
