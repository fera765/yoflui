/**
 * Info Message Component
 * Based on qwen-code InfoMessage.tsx
 */

import React from 'react';
import { Box, Text } from 'ink';

export interface InfoMessageProps {
	text: string;
}

export const InfoMessage: React.FC<InfoMessageProps> = ({ text }) => {
	return (
		<Box marginY={1} paddingLeft={2}>
			<Text color="blue">? </Text>
			<Text color="blue">{text}</Text>
		</Box>
	);
};
