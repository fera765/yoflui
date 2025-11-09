/**
 * UI State Hook
 * Manages UI state including history and pending items
 */

import { useState, useCallback, useMemo } from 'react';
import type { HistoryItem, UIState } from '../types.js';
import { useStdout } from 'ink';

export function useUIState() {
	const { stdout } = useStdout();
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [pendingHistoryItems, setPendingHistoryItems] = useState<HistoryItem[]>([]);
	const [historyRemountKey, setHistoryRemountKey] = useState(0);
	const [constrainHeight, setConstrainHeight] = useState(true);
	
	// Get terminal dimensions
	const terminalWidth = stdout?.columns || 80;
	const terminalHeight = stdout?.rows || 24;
	
	// Calculate available heights
	const mainAreaWidth = Math.max(40, terminalWidth - 4);
	const availableTerminalHeight = Math.max(10, terminalHeight - 8);
	const staticAreaMaxItemHeight = Math.max(20, Math.floor(terminalHeight * 0.6));
	
	const addHistoryItem = useCallback((item: HistoryItem) => {
		setHistory(prev => [...prev, item]);
	}, []);
	
	const addPendingItem = useCallback((item: HistoryItem) => {
		setPendingHistoryItems(prev => [...prev, item]);
	}, []);
	
	const updatePendingItem = useCallback((index: number, updates: Partial<HistoryItem>) => {
		setPendingHistoryItems(prev => {
			const newItems = [...prev];
			if (newItems[index]) {
				newItems[index] = { ...newItems[index], ...updates } as HistoryItem;
			}
			return newItems;
		});
	}, []);
	
	const commitPendingItems = useCallback(() => {
		setPendingHistoryItems(prev => {
			setHistory(h => [...h, ...prev]);
			return [];
		});
	}, []);
	
	const clearPendingItems = useCallback(() => {
		setPendingHistoryItems([]);
	}, []);
	
	const remountHistory = useCallback(() => {
		setHistoryRemountKey(prev => prev + 1);
	}, []);
	
	const uiState: UIState = useMemo(() => ({
		history,
		pendingHistoryItems,
		historyRemountKey,
		mainAreaWidth,
		availableTerminalHeight,
		staticAreaMaxItemHeight,
		constrainHeight,
	}), [
		history,
		pendingHistoryItems,
		historyRemountKey,
		mainAreaWidth,
		availableTerminalHeight,
		staticAreaMaxItemHeight,
		constrainHeight,
	]);
	
	return {
		uiState,
		addHistoryItem,
		addPendingItem,
		updatePendingItem,
		commitPendingItems,
		clearPendingItems,
		remountHistory,
		setConstrainHeight,
	};
}
