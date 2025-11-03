/**
 * Overflow Context
 * Tracks which components have overflowing content
 * Based on qwen-code OverflowContext.tsx
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface OverflowContextValue {
	overflowingIds: Set<string>;
	addOverflowingId: (id: string) => void;
	removeOverflowingId: (id: string) => void;
	hasOverflow: boolean;
}

const OverflowContext = createContext<OverflowContextValue | undefined>(undefined);

export function useOverflowContext() {
	const context = useContext(OverflowContext);
	if (!context) {
		throw new Error('useOverflowContext must be used within OverflowProvider');
	}
	return context;
}

export function useOverflowActions() {
	const context = useContext(OverflowContext);
	return context;
}

export const OverflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [overflowingIds, setOverflowingIds] = useState<Set<string>>(new Set());
	
	const addOverflowingId = useCallback((id: string) => {
		setOverflowingIds(prev => {
			if (prev.has(id)) return prev;
			const next = new Set(prev);
			next.add(id);
			return next;
		});
	}, []);
	
	const removeOverflowingId = useCallback((id: string) => {
		setOverflowingIds(prev => {
			if (!prev.has(id)) return prev;
			const next = new Set(prev);
			next.delete(id);
			return next;
		});
	}, []);
	
	const hasOverflow = overflowingIds.size > 0;
	
	const value = useMemo(() => ({
		overflowingIds,
		addOverflowingId,
		removeOverflowingId,
		hasOverflow,
	}), [overflowingIds, addOverflowingId, removeOverflowingId, hasOverflow]);
	
	return (
		<OverflowContext.Provider value={value}>
			{children}
		</OverflowContext.Provider>
	);
};
