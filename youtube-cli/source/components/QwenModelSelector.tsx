import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { fetchQwenModels } from '../qwen-oauth.js';

interface Props {
	accessToken: string;
	onSelect: (model: string) => void;
	onBack: () => void;
}

export const QwenModelSelector: React.FC<Props> = ({
	accessToken,
	onSelect,
	onBack,
}) => {
	const [models, setModels] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		loadModels();
	}, []);

	const loadModels = async () => {
		try {
			setLoading(true);
			const availableModels = await fetchQwenModels(accessToken);
			setModels(availableModels);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load models');
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<Box flexDirection="column" padding={2}>
				<Box marginBottom={1}>
					<Text bold color="#9333EA">
						? Select Qwen Model
					</Text>
				</Box>

				<Box>
					<Text color="#9333EA">
						<Spinner type="dots" />
					</Text>
					<Text color="#9333EA"> Loading available models...</Text>
				</Box>

				<Box marginTop={2}>
					<Text color="#4B5563" dimColor>
						Please wait...
					</Text>
				</Box>
			</Box>
		);
	}

	if (error) {
		return (
			<Box flexDirection="column" padding={2}>
				<Box marginBottom={1}>
					<Text bold color="#9333EA">
						? Select Qwen Model
					</Text>
				</Box>

				<Box>
					<Text color="#ef4444">Failed to load models: {error}</Text>
				</Box>

				<Box marginTop={1}>
					<Text color="#6B7280">Using default model: qwen-max</Text>
				</Box>

				<Box marginTop={2}>
					<Text color="#4B5563" dimColor>
						Press any key to continue with default model
					</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" padding={2}>
			<Box marginBottom={1}>
				<Text bold color="#9333EA">
					? Select Qwen Model
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text color="#6B7280">
					Available models ({models.length} found):
				</Text>
			</Box>

			<SelectInput
				items={models.map(model => ({
					label: model,
					value: model,
				}))}
				onSelect={item => onSelect(item.value)}
			/>

			<Box marginTop={2}>
				<Text color="#4B5563" dimColor>
					Press <Text color="#9333EA">Enter</Text> to select ?{' '}
					<Text color="#9333EA">Esc</Text> to go back
				</Text>
			</Box>
		</Box>
	);
};
