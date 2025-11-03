/**
 * useKeypress Hook
 * Simple hook to consume keyboard events from KeypressContext
 */

import { useEffect } from 'react';
import { useKeypressContext, type KeypressHandler } from '../context/KeypressContext.js';

export type { Key } from '../config/keyMatchers.js';
export type { KeypressHandler };

export function useKeypress(
	onKeypress: KeypressHandler,
	{ isActive }: { isActive: boolean }
) {
	const { subscribe, unsubscribe } = useKeypressContext();
	
	useEffect(() => {
		if (!isActive) return;
		
		subscribe(onKeypress);
		return () => {
			unsubscribe(onKeypress);
		};
	}, [isActive, onKeypress, subscribe, unsubscribe]);
}
