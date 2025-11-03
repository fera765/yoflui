/**
 * Text Buffer State Management
 * Simplified version of qwen-code text-buffer
 * Manages text state with undo/redo and multiline support
 */

import { useState, useCallback, useMemo, useReducer, useRef, useEffect } from 'react';
import { cpLen, cpSlice, toCodePoints, stripUnsafeCharacters, findNextWordStart, findPrevWordStart } from '../utils/textUtils.js';

export type Direction = 'left' | 'right' | 'up' | 'down' | 'wordLeft' | 'wordRight' | 'home' | 'end';

interface UndoHistoryEntry {
	lines: string[];
	cursorRow: number;
	cursorCol: number;
}

export interface TextBufferState {
	lines: string[];
	cursorRow: number;
	cursorCol: number;
	preferredCol: number | null;
	undoStack: UndoHistoryEntry[];
	redoStack: UndoHistoryEntry[];
}

export type TextBufferAction =
	| { type: 'set_text'; payload: string }
	| { type: 'insert'; payload: string }
	| { type: 'backspace' }
	| { type: 'delete' }
	| { type: 'move'; payload: { dir: Direction } }
	| { type: 'delete_word_left' }
	| { type: 'delete_word_right' }
	| { type: 'kill_line_right' }
	| { type: 'kill_line_left' }
	| { type: 'undo' }
	| { type: 'redo' }
	| { type: 'newline' };

const HISTORY_LIMIT = 100;

function pushUndo(state: TextBufferState): TextBufferState {
	const snapshot = {
		lines: [...state.lines],
		cursorRow: state.cursorRow,
		cursorCol: state.cursorCol,
	};
	const newStack = [...state.undoStack, snapshot];
	if (newStack.length > HISTORY_LIMIT) {
		newStack.shift();
	}
	return { ...state, undoStack: newStack, redoStack: [] };
}

function clamp(v: number, min: number, max: number): number {
	return v < min ? min : v > max ? max : v;
}

function textBufferReducer(state: TextBufferState, action: TextBufferAction): TextBufferState {
	const currentLine = (r: number): string => state.lines[r] ?? '';
	const currentLineLen = (r: number): number => cpLen(currentLine(r));
	
	switch (action.type) {
		case 'set_text': {
			const nextState = pushUndo(state);
			const lines = action.payload.replace(/\r\n?/g, '\n').split('\n');
			const validLines = lines.length === 0 ? [''] : lines;
			const lastLineIndex = validLines.length - 1;
			return {
				...nextState,
				lines: validLines,
				cursorRow: lastLineIndex,
				cursorCol: cpLen(validLines[lastLineIndex] ?? ''),
				preferredCol: null,
			};
		}
		
		case 'insert': {
			const nextState = pushUndo(state);
			const newLines = [...nextState.lines];
			let newCursorRow = nextState.cursorRow;
			let newCursorCol = nextState.cursorCol;
			
			const str = stripUnsafeCharacters(action.payload.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));
			const parts = str.split('\n');
			const lineContent = currentLine(newCursorRow);
			const before = cpSlice(lineContent, 0, newCursorCol);
			const after = cpSlice(lineContent, newCursorCol);
			
			if (parts.length > 1) {
				// Multiline insert
				newLines[newCursorRow] = before + parts[0];
				const remainingParts = parts.slice(1);
				const lastPart = remainingParts.pop() ?? '';
				newLines.splice(newCursorRow + 1, 0, ...remainingParts);
				newLines.splice(newCursorRow + parts.length - 1, 0, lastPart + after);
				newCursorRow = newCursorRow + parts.length - 1;
				newCursorCol = cpLen(lastPart);
			} else {
				// Single line insert
				newLines[newCursorRow] = before + parts[0] + after;
				newCursorCol = cpLen(before) + cpLen(parts[0]);
			}
			
			return {
				...nextState,
				lines: newLines,
				cursorRow: newCursorRow,
				cursorCol: newCursorCol,
				preferredCol: null,
			};
		}
		
		case 'newline': {
			const nextState = pushUndo(state);
			const newLines = [...nextState.lines];
			const lineContent = currentLine(nextState.cursorRow);
			const before = cpSlice(lineContent, 0, nextState.cursorCol);
			const after = cpSlice(lineContent, nextState.cursorCol);
			
			newLines[nextState.cursorRow] = before;
			newLines.splice(nextState.cursorRow + 1, 0, after);
			
			return {
				...nextState,
				lines: newLines,
				cursorRow: nextState.cursorRow + 1,
				cursorCol: 0,
				preferredCol: null,
			};
		}
		
		case 'backspace': {
			if (state.cursorCol === 0 && state.cursorRow === 0) return state;
			
			const nextState = pushUndo(state);
			const newLines = [...nextState.lines];
			let newCursorRow = nextState.cursorRow;
			let newCursorCol = nextState.cursorCol;
			
			if (newCursorCol > 0) {
				const lineContent = currentLine(newCursorRow);
				newLines[newCursorRow] = cpSlice(lineContent, 0, newCursorCol - 1) + cpSlice(lineContent, newCursorCol);
				newCursorCol--;
			} else if (newCursorRow > 0) {
				const prevLine = currentLine(newCursorRow - 1);
				const currentLineContent = currentLine(newCursorRow);
				const newCol = cpLen(prevLine);
				newLines[newCursorRow - 1] = prevLine + currentLineContent;
				newLines.splice(newCursorRow, 1);
				newCursorRow--;
				newCursorCol = newCol;
			}
			
			return {
				...nextState,
				lines: newLines,
				cursorRow: newCursorRow,
				cursorCol: newCursorCol,
				preferredCol: null,
			};
		}
		
		case 'delete': {
			const lineContent = currentLine(state.cursorRow);
			if (state.cursorCol < currentLineLen(state.cursorRow)) {
				const nextState = pushUndo(state);
				const newLines = [...nextState.lines];
				newLines[state.cursorRow] = cpSlice(lineContent, 0, state.cursorCol) + cpSlice(lineContent, state.cursorCol + 1);
				return {
					...nextState,
					lines: newLines,
					preferredCol: null,
				};
			} else if (state.cursorRow < state.lines.length - 1) {
				const nextState = pushUndo(state);
				const nextLine = currentLine(state.cursorRow + 1);
				const newLines = [...nextState.lines];
				newLines[state.cursorRow] = lineContent + nextLine;
				newLines.splice(state.cursorRow + 1, 1);
				return {
					...nextState,
					lines: newLines,
					preferredCol: null,
				};
			}
			return state;
		}
		
		case 'move': {
			const { dir } = action.payload;
			const { cursorRow, cursorCol, lines, preferredCol } = state;
			
			let newCursorRow = cursorRow;
			let newCursorCol = cursorCol;
			let newPreferredCol = preferredCol;
			
			switch (dir) {
				case 'left':
					newPreferredCol = null;
					if (newCursorCol > 0) {
						newCursorCol--;
					} else if (newCursorRow > 0) {
						newCursorRow--;
						newCursorCol = currentLineLen(newCursorRow);
					}
					break;
					
				case 'right':
					newPreferredCol = null;
					if (newCursorCol < currentLineLen(newCursorRow)) {
						newCursorCol++;
					} else if (newCursorRow < lines.length - 1) {
						newCursorRow++;
						newCursorCol = 0;
					}
					break;
					
				case 'up':
					if (newCursorRow > 0) {
						if (newPreferredCol === null) newPreferredCol = newCursorCol;
						newCursorRow--;
						newCursorCol = clamp(newPreferredCol, 0, currentLineLen(newCursorRow));
					}
					break;
					
				case 'down':
					if (newCursorRow < lines.length - 1) {
						if (newPreferredCol === null) newPreferredCol = newCursorCol;
						newCursorRow++;
						newCursorCol = clamp(newPreferredCol, 0, currentLineLen(newCursorRow));
					}
					break;
					
				case 'home':
					newPreferredCol = null;
					newCursorCol = 0;
					break;
					
				case 'end':
					newPreferredCol = null;
					newCursorCol = currentLineLen(newCursorRow);
					break;
					
				case 'wordLeft':
					newPreferredCol = null;
					if (newCursorCol === 0 && newCursorRow > 0) {
						newCursorRow--;
						newCursorCol = currentLineLen(newCursorRow);
					} else if (newCursorCol > 0) {
						const lineContent = lines[cursorRow];
						const prevWordStart = findPrevWordStart(lineContent, newCursorCol);
						newCursorCol = prevWordStart === null ? 0 : prevWordStart;
					}
					break;
					
				case 'wordRight':
					newPreferredCol = null;
					if (newCursorCol >= currentLineLen(newCursorRow) && newCursorRow < lines.length - 1) {
						newCursorRow++;
						newCursorCol = 0;
					} else if (newCursorCol < currentLineLen(newCursorRow)) {
						const lineContent = lines[cursorRow];
						const nextWordStart = findNextWordStart(lineContent, newCursorCol);
						newCursorCol = nextWordStart === null ? currentLineLen(newCursorRow) : nextWordStart;
					}
					break;
			}
			
			return {
				...state,
				cursorRow: newCursorRow,
				cursorCol: newCursorCol,
				preferredCol: newPreferredCol,
			};
		}
		
		case 'delete_word_left': {
			if (state.cursorCol === 0 && state.cursorRow === 0) return state;
			
			const nextState = pushUndo(state);
			const newLines = [...nextState.lines];
			let newCursorRow = state.cursorRow;
			let newCursorCol = state.cursorCol;
			
			if (newCursorCol > 0) {
				const lineContent = currentLine(newCursorRow);
				const prevWordStart = findPrevWordStart(lineContent, newCursorCol);
				const start = prevWordStart === null ? 0 : prevWordStart;
				newLines[newCursorRow] = cpSlice(lineContent, 0, start) + cpSlice(lineContent, newCursorCol);
				newCursorCol = start;
			} else {
				// Act as backspace
				const prevLine = currentLine(newCursorRow - 1);
				const currentLineContent = currentLine(newCursorRow);
				const newCol = cpLen(prevLine);
				newLines[newCursorRow - 1] = prevLine + currentLineContent;
				newLines.splice(newCursorRow, 1);
				newCursorRow--;
				newCursorCol = newCol;
			}
			
			return {
				...nextState,
				lines: newLines,
				cursorRow: newCursorRow,
				cursorCol: newCursorCol,
				preferredCol: null,
			};
		}
		
		case 'delete_word_right': {
			const lineContent = currentLine(state.cursorRow);
			const lineLen = cpLen(lineContent);
			
			if (state.cursorCol >= lineLen && state.cursorRow === state.lines.length - 1) {
				return state;
			}
			
			const nextState = pushUndo(state);
			const newLines = [...nextState.lines];
			
			if (state.cursorCol >= lineLen) {
				// Join with next line
				const nextLine = currentLine(state.cursorRow + 1);
				newLines[state.cursorRow] = lineContent + nextLine;
				newLines.splice(state.cursorRow + 1, 1);
			} else {
				const nextWordStart = findNextWordStart(lineContent, state.cursorCol);
				const end = nextWordStart === null ? lineLen : nextWordStart;
				newLines[state.cursorRow] = cpSlice(lineContent, 0, state.cursorCol) + cpSlice(lineContent, end);
			}
			
			return {
				...nextState,
				lines: newLines,
				preferredCol: null,
			};
		}
		
		case 'kill_line_right': {
			const lineContent = currentLine(state.cursorRow);
			if (state.cursorCol < currentLineLen(state.cursorRow)) {
				const nextState = pushUndo(state);
				const newLines = [...nextState.lines];
				newLines[state.cursorRow] = cpSlice(lineContent, 0, state.cursorCol);
				return {
					...nextState,
					lines: newLines,
				};
			} else if (state.cursorRow < state.lines.length - 1) {
				// Join with next line
				const nextState = pushUndo(state);
				const nextLine = currentLine(state.cursorRow + 1);
				const newLines = [...nextState.lines];
				newLines[state.cursorRow] = lineContent + nextLine;
				newLines.splice(state.cursorRow + 1, 1);
				return {
					...nextState,
					lines: newLines,
					preferredCol: null,
				};
			}
			return state;
		}
		
		case 'kill_line_left': {
			if (state.cursorCol > 0) {
				const nextState = pushUndo(state);
				const lineContent = currentLine(state.cursorRow);
				const newLines = [...nextState.lines];
				newLines[state.cursorRow] = cpSlice(lineContent, state.cursorCol);
				return {
					...nextState,
					lines: newLines,
					cursorCol: 0,
					preferredCol: null,
				};
			}
			return state;
		}
		
		case 'undo': {
			const stateToRestore = state.undoStack[state.undoStack.length - 1];
			if (!stateToRestore) return state;
			
			const currentSnapshot = {
				lines: [...state.lines],
				cursorRow: state.cursorRow,
				cursorCol: state.cursorCol,
			};
			return {
				...state,
				...stateToRestore,
				undoStack: state.undoStack.slice(0, -1),
				redoStack: [...state.redoStack, currentSnapshot],
			};
		}
		
		case 'redo': {
			const stateToRestore = state.redoStack[state.redoStack.length - 1];
			if (!stateToRestore) return state;
			
			const currentSnapshot = {
				lines: [...state.lines],
				cursorRow: state.cursorRow,
				cursorCol: state.cursorCol,
			};
			return {
				...state,
				...stateToRestore,
				redoStack: state.redoStack.slice(0, -1),
				undoStack: [...state.undoStack, currentSnapshot],
			};
		}
		
		default:
			return state;
	}
}

interface UseTextBufferProps {
	initialText?: string;
	onChange?: (text: string) => void;
}

export interface TextBuffer {
	lines: string[];
	text: string;
	cursor: [number, number];
	preferredCol: number | null;
	
	setText: (text: string) => void;
	insert: (ch: string) => void;
	newline: () => void;
	backspace: () => void;
	del: () => void;
	move: (dir: Direction) => void;
	deleteWordLeft: () => void;
	deleteWordRight: () => void;
	killLineRight: () => void;
	killLineLeft: () => void;
	undo: () => void;
	redo: () => void;
	handleInput: (key: { name: string; ctrl: boolean; meta: boolean; shift: boolean; paste: boolean; sequence: string }) => void;
}

export function useTextBuffer({ initialText = '', onChange }: UseTextBufferProps): TextBuffer {
	const initialState = useMemo((): TextBufferState => {
		const lines = initialText.split('\n');
		return {
			lines: lines.length === 0 ? [''] : lines,
			cursorRow: 0,
			cursorCol: 0,
			preferredCol: null,
			undoStack: [],
			redoStack: [],
		};
	}, [initialText]);
	
	const [state, dispatch] = useReducer(textBufferReducer, initialState);
	const { lines, cursorRow, cursorCol, preferredCol } = state;
	
	const text = useMemo(() => lines.join('\n'), [lines]);
	
	// Stabilize onChange to avoid triggering effect every render
	const onChangeRef = useRef(onChange);
	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);
	
	useEffect(() => {
		onChangeRef.current?.(text);
	}, [text]);
	
	const setText = useCallback((newText: string) => {
		dispatch({ type: 'set_text', payload: newText });
	}, []);
	
	const insert = useCallback((ch: string) => {
		dispatch({ type: 'insert', payload: ch });
	}, []);
	
	const newline = useCallback(() => {
		dispatch({ type: 'newline' });
	}, []);
	
	const backspace = useCallback(() => {
		dispatch({ type: 'backspace' });
	}, []);
	
	const del = useCallback(() => {
		dispatch({ type: 'delete' });
	}, []);
	
	const move = useCallback((dir: Direction) => {
		dispatch({ type: 'move', payload: { dir } });
	}, []);
	
	const deleteWordLeft = useCallback(() => {
		dispatch({ type: 'delete_word_left' });
	}, []);
	
	const deleteWordRight = useCallback(() => {
		dispatch({ type: 'delete_word_right' });
	}, []);
	
	const killLineRight = useCallback(() => {
		dispatch({ type: 'kill_line_right' });
	}, []);
	
	const killLineLeft = useCallback(() => {
		dispatch({ type: 'kill_line_left' });
	}, []);
	
	const undo = useCallback(() => {
		dispatch({ type: 'undo' });
	}, []);
	
	const redo = useCallback(() => {
		dispatch({ type: 'redo' });
	}, []);
	
	const handleInput = useCallback((key: {
		name: string;
		ctrl: boolean;
		meta: boolean;
		shift: boolean;
		paste: boolean;
		sequence: string;
	}) => {
		const { sequence: input } = key;
		
		if (key.paste) {
			insert(input);
			return;
		}
		
		if (key.name === 'return' || input === '\r' || input === '\n') {
			newline();
		} else if (key.name === 'left' && !key.meta && !key.ctrl) {
			move('left');
		} else if (key.ctrl && key.name === 'b') {
			move('left');
		} else if (key.name === 'right' && !key.meta && !key.ctrl) {
			move('right');
		} else if (key.ctrl && key.name === 'f') {
			move('right');
		} else if (key.name === 'up') {
			move('up');
		} else if (key.name === 'down') {
			move('down');
		} else if ((key.ctrl || key.meta) && key.name === 'left') {
			move('wordLeft');
		} else if (key.meta && key.name === 'b') {
			move('wordLeft');
		} else if ((key.ctrl || key.meta) && key.name === 'right') {
			move('wordRight');
		} else if (key.meta && key.name === 'f') {
			move('wordRight');
		} else if (key.name === 'home') {
			move('home');
		} else if (key.ctrl && key.name === 'a') {
			move('home');
		} else if (key.name === 'end') {
			move('end');
		} else if (key.ctrl && key.name === 'e') {
			move('end');
		} else if (key.ctrl && key.name === 'w') {
			deleteWordLeft();
		} else if ((key.meta || key.ctrl) && (key.name === 'backspace' || input === '\x7f')) {
			deleteWordLeft();
		} else if ((key.meta || key.ctrl) && key.name === 'delete') {
			deleteWordRight();
		} else if (key.name === 'backspace' || input === '\x7f' || (key.ctrl && key.name === 'h')) {
			backspace();
		} else if (key.name === 'delete' || (key.ctrl && key.name === 'd')) {
			del();
		} else if (key.ctrl && !key.shift && key.name === 'z') {
			undo();
		} else if (key.ctrl && key.shift && key.name === 'z') {
			redo();
		} else if (input && !key.ctrl && !key.meta) {
			insert(input);
		}
	}, [newline, move, deleteWordLeft, deleteWordRight, backspace, del, insert, undo, redo]);
	
	return useMemo(() => ({
		lines,
		text,
		cursor: [cursorRow, cursorCol] as [number, number],
		preferredCol,
		setText,
		insert,
		newline,
		backspace,
		del,
		move,
		deleteWordLeft,
		deleteWordRight,
		killLineRight,
		killLineLeft,
		undo,
		redo,
		handleInput,
	}), [
		lines,
		text,
		cursorRow,
		cursorCol,
		preferredCol,
		setText,
		insert,
		newline,
		backspace,
		del,
		move,
		deleteWordLeft,
		deleteWordRight,
		killLineRight,
		killLineLeft,
		undo,
		redo,
		handleInput,
	]);
}
