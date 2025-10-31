import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface Props {
	onSendMessage: (message: string) => void;
	onConfigCommand: () => void;
	onExitCommand: () => void;
	isProcessing: boolean;
}

export const ElegantInput: React.FC<Props> = ({
	onSendMessage,
	onConfigCommand,
	onExitCommand,
	isProcessing,
}) => {
	const [message, setMessage] = useState('');

	useInput((input, key) => {
		if (key.escape && message.length > 0) {
			setMessage('');
		}
	});

	const handleSubmit = () => {
		if (!message.trim() || isProcessing) return;

		const trimmed = message.trim();

		if (trimmed === '/llm') {
			onConfigCommand();
		} else if (trimmed === '/exit') {
			onExitCommand();
		} else {
			onSendMessage(trimmed);
		}

		setMessage('');
	};

	return (
		<Box flexDirection="column">
			{/* Hints */}
			<Box paddingX={2} paddingBottom={1}>
				<Text color="#4B5563" dimColor>
					/llm config ? /exit quit ? esc clear
				</Text>
			</Box>

			{/* Input Box */}
			<Box borderStyle="round" borderColor="#9333EA" paddingX={2} paddingY={1}>
				<Text color="#9333EA">? </Text>
				{isProcessing ? (
					<Text color="#6B7280">Processing... Please wait</Text>
				) : (
					<TextInput
						value={message}
						onChange={setMessage}
						onSubmit={handleSubmit}
						placeholder="Ask me anything about YouTube..."
					/>
				)}
			</Box>
		</Box>
	);
};
