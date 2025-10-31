import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';

interface CommandInputProps {
	onCommand: (command: string, args: string) => void;
	isDisabled: boolean;
}

type InputMode = 'menu' | 'typing';

const COMMAND_ITEMS = [
	{
		label: '?? Search YouTube Videos',
		value: '/ytube',
		description: 'Search and scrape comments from YouTube videos',
	},
	{
		label: '?? Exit Application',
		value: '/exit',
		description: 'Close the application',
	},
];

export const NewCommandInput: React.FC<CommandInputProps> = ({
	onCommand,
	isDisabled,
}) => {
	const [mode, setMode] = useState<InputMode>('menu');
	const [selectedCommand, setSelectedCommand] = useState('');
	const [queryInput, setQueryInput] = useState('');

	const handleSelect = (item: { value: string }) => {
		if (item.value === '/exit') {
			onCommand('/exit', '');
		} else if (item.value === '/ytube') {
			setSelectedCommand('/ytube');
			setMode('typing');
		}
	};

	const handleQuerySubmit = () => {
		if (queryInput.trim() && selectedCommand === '/ytube') {
			onCommand('/ytube', queryInput.trim());
			setQueryInput('');
			setMode('menu');
			setSelectedCommand('');
		}
	};

	if (isDisabled) {
		return (
			<Box
				borderStyle="bold"
				borderColor="yellow"
				paddingX={2}
				paddingY={1}
				flexDirection="column"
			>
				<Box justifyContent="center" marginBottom={1}>
					<Text color="yellow" bold>
						? PROCESSING
					</Text>
				</Box>
				<Box justifyContent="center">
					<Text color="gray" dimColor>
						Scraping in progress... Please wait
					</Text>
				</Box>
			</Box>
		);
	}

	if (mode === 'typing' && selectedCommand === '/ytube') {
		return (
			<Box flexDirection="column">
				<Box
					borderStyle="round"
					borderColor="cyan"
					paddingX={2}
					paddingY={1}
					marginBottom={1}
				>
					<Box flexDirection="column">
						<Text color="cyan" bold>
							?? YouTube Search Query
						</Text>
						<Text color="gray" dimColor>
							{' '}
							Enter your search term
						</Text>
					</Box>
				</Box>

				<Box
					borderStyle="bold"
					borderColor="magenta"
					paddingX={2}
					paddingY={1}
				>
					<Box flexDirection="column" width="100%">
						<Box marginBottom={1}>
							<Text color="magenta" bold>
								{'? '}
							</Text>
							<TextInput
								value={queryInput}
								onChange={setQueryInput}
								onSubmit={handleQuerySubmit}
								placeholder="e.g., javascript tutorial"
							/>
						</Box>
						<Text color="gray" dimColor>
							Press Enter to search ? Esc to go back
						</Text>
					</Box>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Box
				borderStyle="round"
				borderColor="green"
				paddingX={2}
				paddingY={1}
				marginBottom={1}
			>
				<Box flexDirection="column">
					<Text color="green" bold>
						? COMMAND CENTER
					</Text>
					<Text color="gray" dimColor>
						{' '}
						Use ?? arrows to select, Enter to confirm
					</Text>
				</Box>
			</Box>

			<Box borderStyle="bold" borderColor="cyan" paddingX={2} paddingY={1}>
				<SelectInput items={COMMAND_ITEMS} onSelect={handleSelect} />
			</Box>
		</Box>
	);
};
