/**
 * UI System Exports
 * Complete message rendering system based on qwen-code
 */

// Types
export * from './types.js';

// Contexts
export { OverflowProvider, useOverflowContext, useOverflowActions } from './contexts/OverflowContext.js';

// Components
export { MainContent } from './components/MainContent.js';
export { HistoryItemDisplay } from './components/HistoryItemDisplay.js';
export { ChatTimeline } from './components/ChatTimeline.js';

// Shared components
export { MaxSizedBox, setMaxSizedBoxDebugging, MINIMUM_MAX_HEIGHT } from './components/shared/MaxSizedBox.js';
export { ShowMoreLines } from './components/shared/ShowMoreLines.js';

// Message components
export { UserMessage } from './components/messages/UserMessage.js';
export { AssistantMessage } from './components/messages/AssistantMessage.js';
export { ToolMessageV2 as ToolMessage } from './components/messages/ToolMessageV2.js';
export { ToolGroupMessageV2 as ToolGroupMessage } from './components/messages/ToolGroupMessageV2.js';
export { KanbanMessage } from './components/messages/KanbanMessage.js';
export { InfoMessage } from './components/messages/InfoMessage.js';
export { ErrorMessage } from './components/messages/ErrorMessage.js';
export { WarningMessage } from './components/messages/WarningMessage.js';

// Hooks
export { useUIState } from './hooks/useUIState.js';

// Adapters
export { chatMessageToHistoryItem, chatMessagesToHistoryItems } from './adapters/chatMessageAdapter.js';

// Utils
export { toCodePoints, cpLen, cpSlice, escapeAnsiCtrlCodes } from './utils/textUtils.js';
