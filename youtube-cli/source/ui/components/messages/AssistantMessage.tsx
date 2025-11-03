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
	
	const content = (
		<Box flexDirection="column">
			{lines.map((line, index) => (
				<Box key={index}>
					<Text wrap="wrap">{line || ' '}</Text>
				</Box>
			))}
			{isPending && (
				<Text color="yellow">?</Text>
			)}
		</Box>
	);
	
	if (availableTerminalHeight !== undefined) {
		return (
			<Box marginY={1} paddingLeft={2}>
				<MaxSizedBox 
					maxHeight={availableTerminalHeight} 
					maxWidth={terminalWidth - 4}
					overflowDirection="top"
				>
					{content}
				</MaxSizedBox>
			</Box>
		);
	}
	
	return (
		<Box marginY={1} paddingLeft={2}>
			<Text color="green">{text}</Text>
			{isPending && <Text color="yellow">?</Text>}
		</Box>
	);
};
