/**
 * Error Message Component
 * Based on qwen-code ErrorMessage.tsx
 */

import React from 'react';
import { Box, Text } from 'ink';

export interface ErrorMessageProps {
	text: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ text }) => {
	return (
		<Box marginY={1} paddingLeft={2}>
			<Text color="red">? </Text>
			<Text color="red">{text}</Text>
		</Box>
	);
};
