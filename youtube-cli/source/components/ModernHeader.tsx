import React from 'react';
import { Box, Text } from 'ink';

interface ModernHeaderProps {
	model: string;
	messageCount: number;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({ model, messageCount }) => {
	return (
		<Box paddingX={2} paddingY={1} borderStyle="round" borderColor="#8B5CF6">
			<Box width="100%" justifyContent="space-between">
				<Box>
					<Text color="#8B5CF6" bold>
						? 
					</Text>
					<Text color="#A78BFA" bold>
						{' AI ANALYST'}
					</Text>
				</Box>
				<Box>
					<Text color="#6B7280">
						{model}
					</Text>
					<Text color="#4B5563">
						{' '}? {messageCount} msgs
					</Text>
				</Box>
			</Box>
		</Box>
	);
};
