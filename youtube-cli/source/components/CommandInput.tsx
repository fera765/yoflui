import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface CommandInputProps {
	onCommand: (command: string, args: string) => void;
	isDisabled: boolean;
}

const COMMANDS = [
	{ cmd: '/exit', description: 'Exit the application' },
	{ cmd: '/ytube', description: 'Search YouTube videos and scrape comments' },
];

export const CommandInput: React.FC<CommandInputProps> = ({
	onCommand,
	isDisabled,
}) => {
	const [input, setInput] = useState('');
	const [showSuggestions, setShowSuggestions] = useState(false);

	useEffect(() => {
		if (input.startsWith('/') && input.length > 0) {
			const matchingCommands = COMMANDS.filter(c =>
				c.cmd.startsWith(input.split(' ')[0])
			);
			setShowSuggestions(matchingCommands.length > 0);
		} else {
			setShowSuggestions(false);
		}
	}, [input]);

	const handleSubmit = () => {
		if (!input.trim() || isDisabled) return;

		if (input.startsWith('/')) {
			const parts = input.split(' ');
			const command = parts[0];
			const args = parts.slice(1).join(' ');

			onCommand(command, args);
			setInput('');
		}
	};

	const getMatchingCommands = () => {
		if (!input.startsWith('/')) return [];
		const typed = input.split(' ')[0];
		return COMMANDS.filter(c => c.cmd.startsWith(typed));
	};

	const matchingCommands = getMatchingCommands();

	return (
		<Box flexDirection="column" width="100%">
			{/* Command Suggestions */}
			{showSuggestions && matchingCommands.length > 0 && (
				<Box
					flexDirection="column"
					borderStyle="round"
					borderColor="yellow"
					paddingX={1}
					marginBottom={1}
				>
					<Box marginBottom={1}>
						<Text color="yellow" bold>
							?? Available Commands
						</Text>
					</Box>
					{matchingCommands.map((cmd, idx) => (
						<Box key={idx} marginBottom={0}>
							<Text color="cyan" bold>
								{cmd.cmd}
							</Text>
							<Text color="gray" dimColor>
								{' '}
								- {cmd.description}
							</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Input Box */}
			<Box
				borderStyle="double"
				borderColor="cyan"
				paddingX={2}
				paddingY={1}
				flexDirection="column"
			>
				<Box marginBottom={1}>
					<Text color="cyan" bold>
						? Command Input
					</Text>
				</Box>

				<Box flexDirection="row" alignItems="center">
					<Text color="magenta" bold>
						{'> '}
					</Text>
					{isDisabled ? (
						<Text color="gray" dimColor>
							Processing command...
						</Text>
					) : (
						<TextInput
							value={input}
							onChange={setInput}
							onSubmit={handleSubmit}
							placeholder="Type / for commands..."
						/>
					)}
				</Box>

				<Box marginTop={1}>
					<Text color="gray" dimColor>
						{isDisabled
							? '? Please wait...'
							: '?? Type /ytube <query> to search ? /exit to quit ? Ctrl+C to force exit'}
					</Text>
				</Box>
			</Box>
		</Box>
	);
};
