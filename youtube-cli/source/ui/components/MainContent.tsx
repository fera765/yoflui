/**
 * Main Content Component
 * Separates Static (old messages) from Dynamic (pending messages)
 * Based on qwen-code MainContent.tsx
 */

import React from 'react';
import { Box, Static } from 'ink';
import { HistoryItemDisplay } from './HistoryItemDisplay.js';
import { ShowMoreLines } from './shared/ShowMoreLines.js';
import { OverflowProvider } from '../contexts/OverflowContext.js';
import type { HistoryItem } from '../types.js';

export interface MainContentProps {
	history: HistoryItem[];
	pendingHistoryItems: HistoryItem[];
	historyRemountKey: number;
	mainAreaWidth: number;
	staticAreaMaxItemHeight: number;
	availableTerminalHeight: number;
	constrainHeight: boolean;
}

// Maximum lines for any single message (prevent performance issues)
const MAX_MESSAGE_LINES = 65536;

export const MainContent: React.FC<MainContentProps> = ({
	history,
	pendingHistoryItems,
	historyRemountKey,
	mainAreaWidth,
	staticAreaMaxItemHeight,
	availableTerminalHeight,
	constrainHeight,
}) => {
	return (
		<>
			{/* Static area - old messages (immutable, no re-renders) */}
			<Static
				key={historyRemountKey}
				items={history.map((h) => (
					<HistoryItemDisplay
						terminalWidth={mainAreaWidth}
						availableTerminalHeight={staticAreaMaxItemHeight}
						key={h.id}
						item={h}
						isPending={false}
					/>
				))}
			>
				{(item) => item}
			</Static>
			
			{/* Dynamic area - pending messages (updates in real-time) */}
			<OverflowProvider>
				<Box flexDirection="column">
					{pendingHistoryItems.map((item, i) => (
						<HistoryItemDisplay
							key={i}
							availableTerminalHeight={
								constrainHeight ? availableTerminalHeight : MAX_MESSAGE_LINES
							}
							terminalWidth={mainAreaWidth}
							item={{ ...item, id: item.id ?? i }}
							isPending={true}
							isFocused={true}
						/>
					))}
					<ShowMoreLines constrainHeight={constrainHeight} />
				</Box>
			</OverflowProvider>
		</>
	);
};
