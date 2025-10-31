import React from 'react';
import { Box, Text } from 'ink';

interface Props {
	model: string;
	messageCount: number;
}

export const ElegantHeader: React.FC<Props> = ({ model, messageCount }) => {
	return (
		<Box paddingX={2} paddingY={1} justifyContent="space-between">
			<Box>
				<Text color="#9333EA" bold>? AI YouTube Analyst</Text>
			</Box>
			<Box>
				<Text color="#4B5563">{model}</Text>
				<Text color="#6B7280"> ? {messageCount} msgs</Text>
			</Box>
		</Box>
	);
};
