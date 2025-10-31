import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';

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

// Header ultra moderno
export const UltraHeader: React.FC<{ model: string; count: number }> = ({ model, count }) => (
	<Box paddingX={2} paddingY={1} borderStyle="bold" borderColor="#8B5CF6">
		<Box width="100%" justifyContent="space-between">
			<Text color="#A78BFA" bold>? AI YOUTUBE ANALYST</Text>
			<Box>
				<Text color="#8B5CF6" dimColor>{model}</Text>
				<Text color="#6B7280" dimColor> ? {count}</Text>
			</Box>
		</Box>
	</Box>
);

// Empty state elegante
const EmptyState: React.FC = () => (
	<Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} paddingY={5}>
		<Text color="#8B5CF6" bold>?</Text>
		<Box marginTop={1}>
			<Text color="#6B7280">Ask anything about YouTube trends and insights</Text>
		</Box>
	</Box>
);

// User message simples
const UserMsg: React.FC<{ text: string }> = ({ text }) => (
	<Box marginY={1}>
		<Text color="#8B5CF6">? </Text>
		<Text color="#D1D5DB">{text}</Text>
	</Box>
);

// Tool box ultra elegante
const ToolBox: React.FC<{
	name: string;
	query: string;
	status: 'running' | 'complete';
	result?: { totalVideos: number; totalComments: number };
}> = ({ name, query, status, result }) => (
	<Box marginY={1} width="100%">
		<Box
			borderStyle="round"
			borderColor={status === 'running' ? '#8B5CF6' : '#10B981'}
			paddingX={3}
			paddingY={1}
			flexDirection="column"
			width="100%"
		>
			<Box justifyContent="space-between" width="100%">
				<Box>
					{status === 'running' ? (
						<>
							<Text color="#8B5CF6"><Spinner type="dots" /></Text>
							<Text color="#8B5CF6" bold> {name}</Text>
						</>
					) : (
						<>
							<Text color="#10B981" bold>? </Text>
							<Text color="#10B981" bold>{name}</Text>
						</>
					)}
				</Box>
				{result && (
					<Text color="#6B7280">
						{result.totalVideos}v ? {result.totalComments}c
					</Text>
				)}
			</Box>
			<Box marginTop={1}>
				<Text color="#9CA3AF" dimColor>{query}</Text>
			</Box>
		</Box>
	</Box>
);

// AI response renderizado
const AIMsg: React.FC<{ text: string }> = ({ text }) => (
	<Box marginY={1} paddingX={1} flexDirection="column">
		<Text color="#FFFFFF">{text}</Text>
	</Box>
);

// Timeline ultra moderna
export const UltraTimeline: React.FC<{ messages: Message[] }> = ({ messages }) => {
	if (messages.length === 0) {
		return <EmptyState />;
	}

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			{messages.map((msg, idx) => {
				if (msg.role === 'user') {
					return <UserMsg key={idx} text={msg.content} />;
				}
				if (msg.role === 'tool' && msg.toolCall) {
					return (
						<ToolBox
							key={idx}
							name={msg.toolCall.name}
							query={msg.toolCall.query}
							status={msg.toolCall.status}
							result={msg.toolCall.result}
						/>
					);
				}
				if (msg.role === 'assistant') {
					return <AIMsg key={idx} text={msg.content} />;
				}
				return null;
			})}
		</Box>
	);
};

// Input ultra moderno
export const UltraInput: React.FC<{
	value: string;
	onChange: (val: string) => void;
	onSubmit: () => void;
	isProcessing: boolean;
	showSuggestions: boolean;
}> = ({ value, onChange, onSubmit, isProcessing, showSuggestions }) => (
	<Box flexDirection="column">
		<Box paddingX={2} paddingBottom={1}>
			<Text color="#4B5563" dimColor>
				/ for commands ? esc clear
			</Text>
		</Box>
		<Box borderStyle="round" borderColor="#8B5CF6" paddingX={2} paddingY={1}>
			{isProcessing ? (
				<>
					<Text color="#8B5CF6"><Spinner type="dots" /></Text>
					<Text color="#6B7280"> Processing...</Text>
				</>
			) : (
				<>
					<Text color="#8B5CF6">? </Text>
					<TextInput
						value={value}
						onChange={onChange}
						onSubmit={onSubmit}
						placeholder="Ask me anything..."
					/>
				</>
			)}
		</Box>
	</Box>
);
