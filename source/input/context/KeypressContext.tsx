/**
 * Keypress Context
 * Captures and broadcasts keyboard events at low level
 * Based on qwen-code KeypressContext (simplified)
 */

import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { useStdin } from 'ink';
import readline from 'node:readline';
import type { Key } from '../config/keyMatchers.js';

export type KeypressHandler = (key: Key) => void;

interface KeypressContextValue {
	subscribe: (handler: KeypressHandler) => void;
	unsubscribe: (handler: KeypressHandler) => void;
}

const KeypressContext = createContext<KeypressContextValue | undefined>(undefined);

export function useKeypressContext() {
	const context = useContext(KeypressContext);
	if (!context) {
		throw new Error('useKeypressContext must be used within a KeypressProvider');
	}
	return context;
}

interface KeypressProviderProps {
	children?: React.ReactNode;
}

export function KeypressProvider({ children }: KeypressProviderProps) {
	const { stdin, setRawMode } = useStdin();
	const subscribers = useRef<Set<KeypressHandler>>(new Set()).current;
	
	const subscribe = useCallback((handler: KeypressHandler) => {
		subscribers.add(handler);
	}, [subscribers]);
	
	const unsubscribe = useCallback((handler: KeypressHandler) => {
		subscribers.delete(handler);
	}, [subscribers]);
	
	useEffect(() => {
		const wasRaw = stdin.isRaw;
		if (wasRaw === false) {
			setRawMode(true);
		}
		
		let isPaste = false;
		let pasteBuffer = Buffer.alloc(0);
		
		const broadcast = (key: Key) => {
			for (const handler of subscribers) {
				handler(key);
			}
		};
		
		const handleKeypress = (_: unknown, key: Key) => {
			// Handle paste mode
			if (key.name === 'paste-start') {
				isPaste = true;
				return;
			}
			if (key.name === 'paste-end') {
				isPaste = false;
				broadcast({
					name: '',
					ctrl: false,
					meta: false,
					shift: false,
					paste: true,
					sequence: pasteBuffer.toString(),
				});
				pasteBuffer = Buffer.alloc(0);
				return;
			}
			
			if (isPaste) {
				pasteBuffer = Buffer.concat([pasteBuffer, Buffer.from(key.sequence)]);
				return;
			}
			
			broadcast({ ...key, paste: false });
		};
		
		const rl = readline.createInterface({ 
			input: stdin, 
			escapeCodeTimeout: 0 
		});
		readline.emitKeypressEvents(stdin, rl);
		stdin.on('keypress', handleKeypress);
		
		return () => {
			stdin.removeListener('keypress', handleKeypress);
			rl.close();
			
			if (wasRaw === false) {
				setRawMode(false);
			}
			
			// Flush any pending paste
			if (isPaste) {
				broadcast({
					name: '',
					ctrl: false,
					meta: false,
					shift: false,
					paste: true,
					sequence: pasteBuffer.toString(),
				});
				pasteBuffer = Buffer.alloc(0);
			}
		};
	}, [stdin, setRawMode, subscribers]);
	
	return (
		<KeypressContext.Provider value={{ subscribe, unsubscribe }}>
			{children}
		</KeypressContext.Provider>
	);
}
