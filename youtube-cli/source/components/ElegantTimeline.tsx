import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

export interface Message {
	role: 'user' | 'assistant' | 'tool';
	content: string;
	toolCall?: {
		name: string;
		query: string;
		status: 'running' | 'complete';
		result?: {
			totalVideos: number;
			totalComments: number;
		};
	};
}

const EmptyState: React.FC = () => (
	<Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} paddingY={4}>
		<Box marginBottom={2}>
			<Text color="#9333EA" bold>?</Text>
		</Box>
		<Text color="#6B7280">Ask me anything about YouTube trends and insights</Text>
	</Box>
);

const UserMessage: React.FC<{ content: string }> = ({ content }) => (
	<Box flexDirection="column" marginBottom={1}>
		<Box>
			<Text color="#9333EA" bold>? </Text>
			<Text color="#D1D5DB">{content}</Text>
		</Box>
	</Box>
);

const ToolBox: React.FC<{
	name: string;
	query: string;
	status: 'running' | 'complete';
	result?: { totalVideos: number; totalComments: number };
}> = ({ name, query, status, result }) => (
	<Box flexDirection="column" marginY={1} width="100%">
		<Box borderStyle="round" borderColor="#9333EA" paddingX={2} paddingY={1} flexDirection="column">
			<Box>
				{status === 'running' ? (
					<>
						<Text color="#9333EA"><Spinner type="dots" /></Text>
						<Text color="#9333EA"> {name}</Text>
					</>
				) : (
					<>
						<Text color="#10B981">? </Text>
						<Text color="#10B981">{name}</Text>
					</>
				)}
			</Box>
			<Box marginTop={1}>
				<Text color="#6B7280">Query: </Text>
				<Text color="#D1D5DB">{query}</Text>
			</Box>
			{result && (
				<Box marginTop={1}>
					<Text color="#6B7280">{result.totalVideos} videos ? {result.totalComments} comments</Text>
				</Box>
			)}
		</Box>
	</Box>
);

const AssistantMessage: React.FC<{ content: string }> = ({ content }) => (
	<Box flexDirection="column" marginY={1}>
		<Text color="#FFFFFF">{content}</Text>
	</Box>
);

export const ElegantTimeline: React.FC<{ messages: Message[] }> = ({ messages }) => {
	if (messages.length === 0) {
		return <EmptyState />;
	}

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			{messages.map((msg, idx) => {
				if (msg.role === 'user') {
					return <UserMessage key={idx} content={msg.content} />;
				} else if (msg.role === 'tool' && msg.toolCall) {
					return (
						<ToolBox
							key={idx}
							name={msg.toolCall.name}
							query={msg.toolCall.query}
							status={msg.toolCall.status}
							result={msg.toolCall.result}
						/>
					);
				} else if (msg.role === 'assistant') {
					return <AssistantMessage key={idx} content={msg.content} />;
				}
				return null;
			})}
		</Box>
	);
};
