/**
 * Warning Message Component
 * Based on qwen-code WarningMessage.tsx
 */

import React from 'react';
import { Box, Text } from 'ink';

export interface WarningMessageProps {
	text: string;
}

export const WarningMessage: React.FC<WarningMessageProps> = ({ text }) => {
	return (
		<Box marginY={1} paddingLeft={2}>
			<Text color="yellow">? </Text>
			<Text color="yellow">{text}</Text>
		</Box>
	);
};
