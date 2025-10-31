import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface ChatInputProps {
	onSendMessage: (message: string) => void;
	onConfigCommand: () => void;
	onExitCommand: () => void;
	isProcessing: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
	onSendMessage,
	onConfigCommand,
	onExitCommand,
	isProcessing,
}) => {
	const [message, setMessage] = useState('');

	useInput((input, key) => {
		if (key.escape) {
			// Esc key handling could be added here if needed
		}
	});

	const handleSubmit = () => {
		if (isProcessing) return;

		const trimmed = message.trim();
		if (!trimmed) return;

		// Check for commands
		if (trimmed === '/llm') {
			onConfigCommand();
			setMessage('');
			return;
		}

		if (trimmed === '/exit') {
			onExitCommand();
			return;
		}

		// Send normal message
		onSendMessage(trimmed);
		setMessage('');
	};

	return (
		<Box flexDirection="column">
			{/* Command hints */}
			<Box
				borderStyle="round"
				borderColor="gray"
				paddingX={2}
				paddingY={0}
				marginBottom={1}
			>
				<Text color="gray" dimColor>
					Commands: /llm (config) ? /exit (quit) ? Esc (cancel)
				</Text>
			</Box>

			{/* Input box */}
			<Box
				borderStyle="bold"
				borderColor={isProcessing ? 'yellow' : 'magenta'}
				paddingX={2}
				paddingY={1}
			>
				<Box flexDirection="column" width="100%">
					<Box marginBottom={1}>
						<Text color="magenta" bold>
							?? Message
						</Text>
					</Box>
					{isProcessing ? (
						<Text color="yellow">
							Processing your request... Please wait
						</Text>
					) : (
						<>
							<Box>
								<Text color="magenta" bold>
									{'? '}
								</Text>
								<TextInput
									value={message}
									onChange={setMessage}
									onSubmit={handleSubmit}
									placeholder="Ask me anything about YouTube trends..."
								/>
							</Box>
						</>
					)}
				</Box>
			</Box>
		</Box>
	);
};
