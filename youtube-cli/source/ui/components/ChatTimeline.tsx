/**
 * Chat Timeline Component
 * New implementation using MainContent with Static/Dynamic separation
 * Based on qwen-code architecture
 */

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { MainContent } from './MainContent.js';
import { chatMessagesToHistoryItems } from '../adapters/chatMessageAdapter.js';
import type { ChatMessage } from '../../components/ChatComponents.js';
import { useStdout } from 'ink';

export interface ChatTimelineProps {
	messages: ChatMessage[];
}

export const ChatTimeline: React.FC<ChatTimelineProps> = ({ messages }) => {
	const { stdout } = useStdout();
	
	const historyItems = useMemo(() => {
		return chatMessagesToHistoryItems(messages);
	}, [messages]);
	
	// Separate committed vs pending messages
	// For now, all messages are considered committed (history)
	// In future, you can add logic to detect pending/streaming messages
	const history = historyItems;
	const pendingItems: typeof historyItems = [];
	
	// Calculate dimensions
	const terminalWidth = stdout?.columns || 80;
	const terminalHeight = stdout?.rows || 24;
	const mainAreaWidth = Math.max(40, terminalWidth - 4);
	const availableTerminalHeight = Math.max(10, terminalHeight - 8);
	const staticAreaMaxItemHeight = Math.max(20, Math.floor(terminalHeight * 0.6));
	
	if (messages.length === 0) {
		return (
			<Box paddingY={5} justifyContent="center">
				<Text color="cyan" bold>[ READY ]</Text>
			</Box>
		);
	}
	
	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			<MainContent
				history={history}
				pendingHistoryItems={pendingItems}
				historyRemountKey={0}
				mainAreaWidth={mainAreaWidth}
				staticAreaMaxItemHeight={staticAreaMaxItemHeight}
				availableTerminalHeight={availableTerminalHeight}
				constrainHeight={true}
			/>
		</Box>
	);
};
