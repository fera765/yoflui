/**
 * Input System Exports
 */

// Context
export { KeypressProvider, useKeypressContext } from './context/KeypressContext.js';

// Hooks
export { useKeypress } from './hooks/useKeypress.js';
export { useTextBuffer } from './state/text-buffer.js';
export type { TextBuffer } from './state/text-buffer.js';

// Components
export { TextInput } from './components/TextInput.js';
export type { TextInputProps } from './components/TextInput.js';
export { ChatInput } from './components/ChatInput.js';
export type { ChatInputProps } from './components/ChatInput.js';

// Config
export { keyMatchers, Command, createKeyMatchers, defaultKeyBindings } from './config/keyMatchers.js';
export type { Key, KeyBinding, KeyBindingConfig, KeyMatcher, KeyMatchers } from './config/keyMatchers.js';
