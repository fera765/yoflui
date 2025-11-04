/**
 * Chat Message Adapter
 * Converts old ChatMessage format to new HistoryItem format
 */

import type { ChatMessage } from '../../components/ChatComponents.js';
import type { HistoryItem } from '../types.js';

let idCounter = 0;
const generateId = () => ++idCounter;

/**
 * Convert old ChatMessage to new HistoryItem
 */
export function chatMessageToHistoryItem(msg: ChatMessage): HistoryItem {
	const baseId = msg.id ? (typeof msg.id === 'string' ? parseInt(msg.id.split('-')[1] || '0', 10) : msg.id) : generateId();
	
	switch (msg.role) {
		case 'user':
			return {
				type: 'user',
				id: baseId,
				text: msg.content,
			};
			
		case 'assistant':
			return {
				type: 'assistant',
				id: baseId,
				text: msg.content,
			};
			
		case 'tool':
			if (msg.toolCall) {
				return {
					type: 'tool',
					id: baseId,
					tool: msg.toolCall,
				};
			}
			return {
				type: 'error',
				id: baseId,
				text: 'Tool call missing data',
			};
			
		case 'kanban':
			if (msg.kanban) {
				return {
					type: 'kanban',
					id: baseId,
					tasks: msg.kanban,
				};
			}
			return {
				type: 'error',
				id: baseId,
				text: 'Kanban data missing',
			};
			
		default:
			return {
				type: 'error',
				id: baseId,
				text: `Unknown message type: ${msg.role}`,
			};
	}
}

/**
 * Convert array of ChatMessages to HistoryItems
 */
export function chatMessagesToHistoryItems(messages: ChatMessage[]): HistoryItem[] {
	return messages.map(chatMessageToHistoryItem);
}
