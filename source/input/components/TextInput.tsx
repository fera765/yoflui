/**
 * TextInput Component
 * Advanced text input with multiline support, undo/redo, and more
 * Based on qwen-code TextInput (simplified)
 */

import React, { useCallback } from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';
import { useTextBuffer } from '../state/text-buffer.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { keyMatchers, Command, type Key } from '../config/keyMatchers.js';

// Funções utilitárias simples para manipulação de strings Unicode
const cpSlice = (str: string, start: number, end?: number): string => {
	const points = [...str];
	return points.slice(start, end).join('');
};

const cpLen = (str: string): number => {
	return [...str].length;
};

export interface TextInputProps {
	value: string;
	onChange: (text: string) => void;
	onSubmit?: () => void;
	placeholder?: string;
	isActive?: boolean;
	multiline?: boolean;
	preventSubmit?: () => boolean;
}

export function TextInput({
	value,
	onChange,
	onSubmit,
	placeholder,
	isActive = true,
	multiline = false,
	preventSubmit,
}: TextInputProps) {
	const buffer = useTextBuffer({
		initialText: value || '',
		onChange,
	});
	
	const handleSubmit = useCallback(() => {
		if (!onSubmit) return;
		if (preventSubmit && preventSubmit()) return;
		onSubmit();
	}, [onSubmit, preventSubmit]);
	
	useKeypress(
		(key: Key) => {
			if (!buffer || !isActive) return;
			
			// Submit on Enter (unless prevented)
				if (keyMatchers[Command.SUBMIT](key) || key.name === 'return') {
					if (multiline) {
						// In multiline, backslash + enter = newline, plain enter = submit
						const [row, col] = buffer.cursor;
						const line = buffer.lines[row];
						const charBefore = col > 0 ? cpSlice(line, col - 1, col) : '';
						if (charBefore === '\\') {
							buffer.backspace();
							buffer.newline();
						} else {
							handleSubmit();
						}
					} else {
						handleSubmit();
					}
					// Return true to stop propagation of the Enter key, which is the likely cause of tsx watch restart
					return true;
				}
			
			// Multiline newline (Shift+Enter or Meta+Enter)
			if (multiline && keyMatchers[Command.NEWLINE](key)) {
				buffer.newline();
				return;
			}
			
			// Home/End
			if (keyMatchers[Command.HOME](key)) {
				buffer.move('home');
				return;
			}
			if (keyMatchers[Command.END](key)) {
				buffer.move('end');
				buffer.move('end'); // Ensure we're at the very end
				return;
			}
			
			// Clear input (Ctrl+C)
			if (keyMatchers[Command.CLEAR_INPUT](key)) {
				if (buffer.text.length > 0) {
					buffer.setText('');
				}
				return;
			}
			
			// Kill line commands
			if (keyMatchers[Command.KILL_LINE_RIGHT](key)) {
				buffer.killLineRight();
				return;
			}
			if (keyMatchers[Command.KILL_LINE_LEFT](key)) {
				buffer.killLineLeft();
				return;
			}
			
			// Delete word commands
			if (keyMatchers[Command.DELETE_WORD_LEFT](key)) {
				buffer.deleteWordLeft();
				return;
			}
			if (keyMatchers[Command.DELETE_WORD_RIGHT](key)) {
				buffer.deleteWordRight();
				return;
			}
			
			// Undo/Redo
			if (keyMatchers[Command.UNDO](key)) {
				buffer.undo();
				return;
			}
			if (keyMatchers[Command.REDO](key)) {
				buffer.redo();
				return;
			}
			
			// Default input handling
			buffer.handleInput(key);
		},
		{ isActive }
	);
	
	if (!buffer) return null;
	
	const linesToRender = buffer.lines;
	const [cursorRow, cursorCol] = buffer.cursor;
	
	return (
		<Box flexDirection="column">
			{buffer.text.length === 0 && placeholder ? (
				<Text>
					{chalk.inverse(placeholder.slice(0, 1))}
					<Text color="gray">{placeholder.slice(1)}</Text>
				</Text>
			) : (
				linesToRender.map((lineText, lineIdx) => {
					const isOnCursorLine = lineIdx === cursorRow;
					let display = lineText;
					
					// Add cursor
					if (isOnCursorLine) {
						if (cursorCol >= 0 && cursorCol < cpLen(display)) {
							const charToHighlight = cpSlice(display, cursorCol, cursorCol + 1) || ' ';
							const highlighted = chalk.inverse(charToHighlight);
							display =
								cpSlice(display, 0, cursorCol) +
								highlighted +
								cpSlice(display, cursorCol + 1);
						} else if (cursorCol === cpLen(display)) {
							display = display + chalk.inverse(' ');
						}
					}
					
					return <Text key={`line-${lineIdx}`}>{display}</Text>;
				})
			)}
		</Box>
	);
}
