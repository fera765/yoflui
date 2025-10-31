import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface SearchInputProps {
	onSearch: (query: string) => void;
	isDisabled: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
	onSearch,
	isDisabled,
}) => {
	const [query, setQuery] = useState('');

	const handleSubmit = () => {
		if (query.trim().length > 0 && !isDisabled) {
			onSearch(query.trim());
		}
	};

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="cyan"
			paddingX={2}
			paddingY={1}
		>
			<Box marginBottom={1}>
				<Text color="cyan" bold>
					?? YouTube Search
				</Text>
			</Box>
			<Box flexDirection="row" alignItems="center">
				<Text color="gray" dimColor>
					Query:{' '}
				</Text>
				{isDisabled ? (
					<Text color="gray" dimColor>
						{query || 'Loading...'}
					</Text>
				) : (
					<TextInput
						value={query}
						onChange={setQuery}
						onSubmit={handleSubmit}
						placeholder="Enter search term and press Enter..."
					/>
				)}
			</Box>
			<Box marginTop={1}>
				<Text color="gray" dimColor>
					{isDisabled
						? '? Scraping in progress...'
						: '?? Press Enter to search ? Ctrl+C to exit'}
				</Text>
			</Box>
		</Box>
	);
};
