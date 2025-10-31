import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

export interface Message {
	id: string;
	role: 'user' | 'assistant';
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

interface BeautifulTimelineProps {
	messages: Message[];
}

const EmptyState: React.FC = () => (
	<Box
		flexDirection="column"
		alignItems="center"
		justifyContent="center"
		flexGrow={1}
		paddingY={3}
	>
		<Box marginBottom={2}>
			<Text color="#8B5CF6" bold>
				?
			</Text>
		</Box>
		<Box marginBottom={1}>
			<Text color="#E5E7EB" bold>
				Welcome to AI YouTube Analyst
			</Text>
		</Box>
		<Box marginBottom={3}>
			<Text color="#6B7280">
				Ask me anything about YouTube trends, opinions, and insights
			</Text>
		</Box>
		<Box paddingX={3} paddingY={1} borderStyle="round" borderColor="#374151">
			<Text color="#9CA3AF">
				Type your question below to get started
			</Text>
		</Box>
	</Box>
);

const UserMessage: React.FC<{ content: string }> = ({ content }) => (
	<Box marginBottom={1} paddingLeft={2}>
		<Box borderStyle="round" borderColor="#374151" paddingX={2} paddingY={1}>
			<Text color="#D1D5DB">{content}</Text>
		</Box>
	</Box>
);

const ToolCallBox: React.FC<{
	name: string;
	query: string;
	status: 'running' | 'complete';
	result?: { totalVideos: number; totalComments: number };
}> = ({ name, query, status, result }) => (
	<Box marginBottom={2} paddingX={2}>
		<Box
			borderStyle="round"
			borderColor={status === 'running' ? '#F59E0B' : '#10B981'}
			paddingX={2}
			paddingY={1}
		>
			<Box flexDirection="column">
				<Box marginBottom={1}>
					{status === 'running' ? (
						<>
							<Text color="#F59E0B">
								<Spinner type="dots" />
							</Text>
							<Text color="#FCD34D" bold>
								{' '}{name}
							</Text>
						</>
					) : (
						<Text color="#34D399" bold>
							? {name}
						</Text>
					)}
				</Box>
				<Box>
					<Text color="#9CA3AF">
						Query:{' '}
					</Text>
					<Text color="#D1D5DB">
						{query}
					</Text>
				</Box>
				{result && status === 'complete' && (
					<Box marginTop={1}>
						<Text color="#60A5FA">
							{result.totalVideos} videos
						</Text>
						<Text color="#6B7280">
							{' '}? {' '}
						</Text>
						<Text color="#34D399">
							{result.totalComments.toLocaleString()} comments
						</Text>
					</Box>
				)}
			</Box>
		</Box>
	</Box>
);

const AssistantMessage: React.FC<{ content: string }> = ({ content }) => (
	<Box marginBottom={2} paddingX={2}>
		<Box flexDirection="column">
			<Text color="#E5E7EB">{content}</Text>
		</Box>
	</Box>
);

export const BeautifulTimeline: React.FC<BeautifulTimelineProps> = ({ messages }) => {
	if (messages.length === 0) {
		return <EmptyState />;
	}

	return (
		<Box flexDirection="column" flexGrow={1} paddingY={1} overflow="hidden">
			{messages.map((msg) => (
				<Box key={msg.id} flexDirection="column">
					{msg.role === 'user' && <UserMessage content={msg.content} />}
					{msg.toolCall && (
						<ToolCallBox
							name={msg.toolCall.name}
							query={msg.toolCall.query}
							status={msg.toolCall.status}
							result={msg.toolCall.result}
						/>
					)}
					{msg.role === 'assistant' && msg.content && (
						<AssistantMessage content={msg.content} />
					)}
				</Box>
			))}
		</Box>
	);
};
