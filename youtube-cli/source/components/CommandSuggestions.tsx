import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';

interface Props {
	onSelect: (command: string) => void;
}

export const CommandSuggestions: React.FC<Props> = ({ onSelect }) => {
	const commands = [
		{ label: '??  /config - Configure scraping settings', value: '/config' },
		{ label: '?? /llm - Configure LLM authentication', value: '/llm' },
		{ label: '?? /exit - Exit application', value: '/exit' },
	];

	return (
		<Box
			borderStyle="round"
			borderColor="#8B5CF6"
			paddingX={1}
			paddingY={0}
			flexDirection="column"
		>
			<SelectInput
				items={commands}
				onSelect={item => onSelect(item.value)}
			/>
		</Box>
	);
};
