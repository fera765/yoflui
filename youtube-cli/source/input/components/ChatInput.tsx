/**
 * ChatInput Component
 * Replacement for ChatComponents.tsx ChatInput
 * Uses our new TextInput component with all features
 */

import React from 'react';
import { Box, Text } from 'ink';
import { TextInput } from './TextInput.js';

export interface ChatInputProps {
	value: string;
	onChange: (val: string) => void;
	onSubmit: () => void;
	disabled: boolean;
	preventSubmit?: () => boolean;
}

export const ChatInput: React.FC<ChatInputProps> = React.memo(({ 
	value, 
	onChange, 
	onSubmit, 
	disabled,
	preventSubmit 
}) => {
	return (
		<Box 
			width="98%" 
			borderStyle="round" 
			borderColor="gray" 
			paddingX={2} 
			paddingY={1} 
			marginX={1} 
			marginBottom={1}
		>
			{disabled ? (
				<Box>
					<Text color="yellow">[...]</Text>
					<Text color="gray"> Processing...</Text>
				</Box>
			) : (
				<Box width="100%">
					<Text color="magenta" bold>&gt; </Text>
					<Box flexGrow={1}>
						<TextInput 
							value={value} 
							onChange={onChange} 
							onSubmit={onSubmit}
							multiline={false}
							isActive={!disabled}
							placeholder="Type your message..."
							preventSubmit={preventSubmit}
						/>
					</Box>
				</Box>
			)}
		</Box>
	);
});

ChatInput.displayName = 'ChatInput';
