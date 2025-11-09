/**
 * User Message Component
 * Based on qwen-code UserMessage.tsx
 */

import React from 'react';
import { Box, Text } from 'ink';

export interface UserMessageProps {
	text: string;
}

export const UserMessage: React.FC<UserMessageProps> = ({ text }) => {
	return (
		<Box marginY={1}>
			<Text color="cyan" bold>&gt; </Text>
			<Text color="white">{text}</Text>
		</Box>
	);
};
