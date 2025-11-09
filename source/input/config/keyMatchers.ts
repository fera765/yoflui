/**
 * Key binding configuration
 * Based on qwen-code keyMatchers
 */

export interface Key {
	name: string;
	ctrl: boolean;
	meta: boolean;
	shift: boolean;
	paste: boolean;
	sequence: string;
}

export interface KeyBinding {
	key?: string;
	sequence?: string;
	ctrl?: boolean;
	shift?: boolean;
	meta?: boolean;
	paste?: boolean;
}

export enum Command {
	// Submit & Navigation
	SUBMIT = 'SUBMIT',
	NEWLINE = 'NEWLINE',
	ESCAPE = 'ESCAPE',
	
	// Cursor movement
	NAVIGATION_UP = 'NAVIGATION_UP',
	NAVIGATION_DOWN = 'NAVIGATION_DOWN',
	NAVIGATION_LEFT = 'NAVIGATION_LEFT',
	NAVIGATION_RIGHT = 'NAVIGATION_RIGHT',
	HOME = 'HOME',
	END = 'END',
	WORD_LEFT = 'WORD_LEFT',
	WORD_RIGHT = 'WORD_RIGHT',
	
	// Editing
	CLEAR_INPUT = 'CLEAR_INPUT',
	BACKSPACE = 'BACKSPACE',
	DELETE = 'DELETE',
	DELETE_WORD_LEFT = 'DELETE_WORD_LEFT',
	DELETE_WORD_RIGHT = 'DELETE_WORD_RIGHT',
	KILL_LINE_RIGHT = 'KILL_LINE_RIGHT',
	KILL_LINE_LEFT = 'KILL_LINE_LEFT',
	
	// History
	HISTORY_UP = 'HISTORY_UP',
	HISTORY_DOWN = 'HISTORY_DOWN',
	
	// Undo/Redo
	UNDO = 'UNDO',
	REDO = 'REDO',
}

export type KeyBindingConfig = {
	[C in Command]: KeyBinding[];
};

export const defaultKeyBindings: KeyBindingConfig = {
	[Command.SUBMIT]: [
		{ key: 'return', ctrl: false, shift: false }
	],
	[Command.NEWLINE]: [
		{ key: 'return', shift: true },
		{ key: 'return', meta: true }
	],
	[Command.ESCAPE]: [
		{ key: 'escape' }
	],
	
	[Command.NAVIGATION_UP]: [
		{ key: 'up' }
	],
	[Command.NAVIGATION_DOWN]: [
		{ key: 'down' }
	],
	[Command.NAVIGATION_LEFT]: [
		{ key: 'left' }
	],
	[Command.NAVIGATION_RIGHT]: [
		{ key: 'right' }
	],
	[Command.HOME]: [
		{ key: 'home' },
		{ key: 'a', ctrl: true }
	],
	[Command.END]: [
		{ key: 'end' },
		{ key: 'e', ctrl: true }
	],
	[Command.WORD_LEFT]: [
		{ key: 'left', ctrl: true },
		{ key: 'left', meta: true },
		{ key: 'b', meta: true }
	],
	[Command.WORD_RIGHT]: [
		{ key: 'right', ctrl: true },
		{ key: 'right', meta: true },
		{ key: 'f', meta: true }
	],
	
	[Command.CLEAR_INPUT]: [
		{ key: 'c', ctrl: true }
	],
	[Command.BACKSPACE]: [
		{ key: 'backspace' }
	],
	[Command.DELETE]: [
		{ key: 'delete' },
		{ key: 'd', ctrl: true }
	],
	[Command.DELETE_WORD_LEFT]: [
		{ key: 'w', ctrl: true },
		{ key: 'backspace', ctrl: true },
		{ key: 'backspace', meta: true }
	],
	[Command.DELETE_WORD_RIGHT]: [
		{ key: 'delete', ctrl: true },
		{ key: 'delete', meta: true }
	],
	[Command.KILL_LINE_RIGHT]: [
		{ key: 'k', ctrl: true }
	],
	[Command.KILL_LINE_LEFT]: [
		{ key: 'u', ctrl: true }
	],
	
	[Command.HISTORY_UP]: [
		{ key: 'p', ctrl: true }
	],
	[Command.HISTORY_DOWN]: [
		{ key: 'n', ctrl: true }
	],
	
	[Command.UNDO]: [
		{ key: 'z', ctrl: true, shift: false }
	],
	[Command.REDO]: [
		{ key: 'z', ctrl: true, shift: true }
	],
};

/**
 * Match a key binding against an actual key press
 */
function matchKeyBinding(binding: KeyBinding, key: Key): boolean {
	// Match key name or sequence
	let keyMatches = false;
	if (binding.key !== undefined) {
		keyMatches = binding.key === key.name;
	} else if (binding.sequence !== undefined) {
		keyMatches = binding.sequence === key.sequence;
	} else {
		return false;
	}
	
	if (!keyMatches) return false;
	
	// Check modifiers
	if (binding.ctrl !== undefined && key.ctrl !== binding.ctrl) return false;
	if (binding.shift !== undefined && key.shift !== binding.shift) return false;
	if (binding.meta !== undefined && key.meta !== binding.meta) return false;
	if (binding.paste !== undefined && key.paste !== binding.paste) return false;
	
	return true;
}

/**
 * Check if key matches a command
 */
function matchCommand(
	command: Command,
	key: Key,
	config: KeyBindingConfig = defaultKeyBindings
): boolean {
	const bindings = config[command];
	return bindings.some(binding => matchKeyBinding(binding, key));
}

/**
 * Key matcher type
 */
export type KeyMatcher = (key: Key) => boolean;

/**
 * Key matchers mapped to commands
 */
export type KeyMatchers = {
	readonly [C in Command]: KeyMatcher;
};

/**
 * Create key matchers from configuration
 */
export function createKeyMatchers(
	config: KeyBindingConfig = defaultKeyBindings
): KeyMatchers {
	const matchers = {} as { [C in Command]: KeyMatcher };
	
	for (const command of Object.values(Command)) {
		matchers[command as Command] = (key: Key) => matchCommand(command as Command, key, config);
	}
	
	return matchers as KeyMatchers;
}

/**
 * Default key matchers
 */
export const keyMatchers: KeyMatchers = createKeyMatchers(defaultKeyBindings);
