import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface ModernInputProps {
	onSendMessage: (message: string) => void;
	onConfigCommand: () => void;
	onExitCommand: () => void;
	isProcessing: boolean;
}

export const ModernInput: React.FC<ModernInputProps> = ({
	onSendMessage,
	onConfigCommand,
	onExitCommand,
	isProcessing,
}) => {
	const [message, setMessage] = useState('');

	useInput((input, key) => {
		if (key.escape && !isProcessing) {
			// Clear input on Esc
			setMessage('');
		}
	});

	const handleSubmit = () => {
		if (isProcessing) return;

		const trimmed = message.trim();
		if (!trimmed) return;

		// Commands
		if (trimmed === '/llm') {
			onConfigCommand();
			setMessage('');
			return;
		}

		if (trimmed === '/exit') {
			onExitCommand();
			return;
		}

		// Normal message
		onSendMessage(trimmed);
		setMessage('');
	};

	return (
		<Box flexDirection="column">
			{/* Hints */}
			<Box paddingX={2} marginBottom={1}>
				<Text color="#6B7280">
					/llm
				</Text>
				<Text color="#4B5563">
					{' '}config
				</Text>
				<Text color="#374151">
					{' '}? {' '}
				</Text>
				<Text color="#6B7280">
					/exit
				</Text>
				<Text color="#4B5563">
					{' '}quit
				</Text>
				<Text color="#374151">
					{' '}? {' '}
				</Text>
				<Text color="#6B7280">
					esc
				</Text>
				<Text color="#4B5563">
					{' '}clear
				</Text>
			</Box>

			{/* Input Box */}
			<Box
				paddingX={2}
				paddingY={1}
				borderStyle="round"
				borderColor={isProcessing ? '#F59E0B' : '#8B5CF6'}
			>
				<Box flexDirection="column" width="100%">
					{isProcessing ? (
						<>
							<Text color="#F59E0B">
								? Processing...
							</Text>
							<Text color="#9CA3AF">
								Please wait while I analyze your request
							</Text>
						</>
					) : (
						<>
							<Box>
								<Text color="#8B5CF6" bold>
									?{' '}
								</Text>
								<TextInput
									value={message}
									onChange={setMessage}
									onSubmit={handleSubmit}
									placeholder="Ask me anything about YouTube..."
								/>
							</Box>
						</>
					)}
				</Box>
			</Box>
		</Box>
	);
};
