import React from 'react';
import { Box, Text } from 'ink';

interface Props {
	toolName: string;
	args: any;
	result?: string;
	status: 'running' | 'complete' | 'error';
}

export const ToolExecutionBox: React.FC<Props> = ({ toolName, args, result, status }) => {
	const borderColor = status === 'complete' ? '#10B981' : status === 'error' ? '#EF4444' : '#8B5CF6';
	const icon = status === 'complete' ? '✓' : status === 'error' ? '✗' : '⟳';

	// Get first 10 lines of result for log display
	const logLines = result ? result.split('\n').slice(0, 10) : [];

	return (
		<Box borderStyle="round" borderColor={borderColor} paddingX={2} paddingY={1} flexDirection="column" width="100%">
			<Box marginBottom={1}>
				<Text bold color={borderColor}>
					{icon} {toolName.toUpperCase().replace('_', ' ')}
				</Text>
			</Box>

			{/* Args */}
			<Box flexDirection="column" marginBottom={1}>
				<Text color="#9CA3AF" dimColor>Arguments:</Text>
				{Object.entries(args).map(([key, value]) => (
					<Box key={key} marginLeft={2}>
						<Text color="#60A5FA">{key}: </Text>
						<Text color="#E5E7EB">{String(value).substring(0, 100)}</Text>
					</Box>
				))}
			</Box>

			{/* Result/Log */}
			{result && (
				<Box flexDirection="column">
					<Text color="#9CA3AF" dimColor>Result:</Text>
					{logLines.map((line, idx) => (
						<Box key={idx} marginLeft={2}>
							<Text color="#E5E7EB">{line}</Text>
						</Box>
					))}
					{result.split('\n').length > 10 && (
						<Box marginLeft={2}>
							<Text color="#6B7280" dimColor>... hidden {result.split('\n').length - 10} lines</Text>
						</Box>
					)}
				</Box>
			)}
		</Box>
	);
};
