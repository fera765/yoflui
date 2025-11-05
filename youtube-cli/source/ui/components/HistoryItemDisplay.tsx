/**
 * History Item Display Component
 * Routes messages to appropriate component based on type
 * Based on qwen-code HistoryItemDisplay.tsx
 */

import React, { useMemo } from 'react';
import { Box } from 'ink';
import { escapeAnsiCtrlCodes } from '../utils/textUtils.js';
import type { HistoryItem } from '../types.js';
import { UserMessage } from './messages/UserMessage.js';
import { AssistantMessage } from './messages/AssistantMessage.js';
import { ToolMessage } from './messages/ToolMessage.js';
import { ToolMessageV2 } from './messages/ToolMessageV2.js';
import { ToolGroupMessage } from './messages/ToolGroupMessage.js';
import { ToolGroupMessageV2 } from './messages/ToolGroupMessageV2.js';
import { getUIConfig } from '../../config/ui-config.js';
import { KanbanMessage } from './messages/KanbanMessage.js';
import { InfoMessage } from './messages/InfoMessage.js';
import { ErrorMessage } from './messages/ErrorMessage.js';
import { WarningMessage } from './messages/WarningMessage.js';

export interface HistoryItemDisplayProps {
	item: HistoryItem;
	availableTerminalHeight?: number;
	terminalWidth: number;
	isPending: boolean;
	isFocused?: boolean;
}

const HistoryItemDisplayComponent: React.FC<HistoryItemDisplayProps> = ({
	item,
	availableTerminalHeight,
	terminalWidth,
	isPending,
	isFocused = true,
}) => {
	const itemForDisplay = useMemo(() => escapeAnsiCtrlCodes(item), [item]);
	
	return (
		<Box flexDirection="column" key={itemForDisplay.id}>
			{/* User message */}
			{itemForDisplay.type === 'user' && (
				<UserMessage text={itemForDisplay.text} />
			)}
			
			{/* Assistant message */}
			{itemForDisplay.type === 'assistant' && (
				<AssistantMessage
					text={itemForDisplay.text}
					isPending={isPending || itemForDisplay.isPending}
					availableTerminalHeight={availableTerminalHeight}
					terminalWidth={terminalWidth}
				/>
			)}
			
			{/* Single tool */}
			{itemForDisplay.type === 'tool' && (
				<ToolMessage 
					tool={itemForDisplay.tool} 
					terminalWidth={terminalWidth}
				/>
			)}
			
			{/* Tool group */}
			{itemForDisplay.type === 'tool_group' && (
				<ToolGroupMessage
					tools={itemForDisplay.tools}
					terminalWidth={terminalWidth}
				/>
			)}
			
			{/* Kanban board */}
			{itemForDisplay.type === 'kanban' && (
				<KanbanMessage tasks={itemForDisplay.tasks} />
			)}
			
			{/* Info message */}
			{itemForDisplay.type === 'info' && (
				<InfoMessage text={itemForDisplay.text} />
			)}
			
			{/* Error message */}
			{itemForDisplay.type === 'error' && (
				<ErrorMessage text={itemForDisplay.text} />
			)}
			
			{/* Warning message */}
			{itemForDisplay.type === 'warning' && (
				<WarningMessage text={itemForDisplay.text} />
			)}
		</Box>
	);
};

export { HistoryItemDisplayComponent as HistoryItemDisplay };
