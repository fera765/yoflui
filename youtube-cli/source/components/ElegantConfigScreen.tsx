import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { fetchAvailableModels } from '../llm-config.js';

interface Props {
	onSave: (endpoint: string, apiKey: string, model: string, maxVideos: number, maxComments: number) => void;
	onCancel: () => void;
	currentEndpoint: string;
	currentApiKey: string;
	currentModel: string;
	currentMaxVideos: number;
	currentMaxComments: number;
}

type Field = 'endpoint' | 'apiKey' | 'maxVideos' | 'maxComments' | 'model' | 'buttons';

export const ElegantConfigScreen: React.FC<Props> = ({
	onSave,
	onCancel,
	currentEndpoint,
	currentApiKey,
	currentModel,
	currentMaxVideos,
	currentMaxComments,
}) => {
	const [endpoint, setEndpoint] = useState(currentEndpoint);
	const [apiKey, setApiKey] = useState(currentApiKey);
	const [maxVideos, setMaxVideos] = useState(String(currentMaxVideos));
	const [maxComments, setMaxComments] = useState(String(currentMaxComments));
	const [model, setModel] = useState(currentModel);
	const [availableModels, setAvailableModels] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [activeField, setActiveField] = useState<Field>('endpoint');

	useInput((input, key) => {
		if (key.escape) {
			onCancel();
		}
	});

	useEffect(() => {
		loadModels();
	}, [endpoint]);

	const loadModels = async () => {
		if (!endpoint) return;
		setLoading(true);
		const models = await fetchAvailableModels(endpoint);
		setAvailableModels(models);
		if (models.length > 0 && !models.includes(model)) {
			setModel(models[0]);
		}
		setLoading(false);
	};

	const handleSave = () => {
		const videos = parseInt(maxVideos) || 10;
		const comments = parseInt(maxComments) || 100;
		onSave(endpoint, apiKey, model, videos, comments);
	};

	return (
		<Box flexDirection="column" padding={2}>
			{/* Header */}
			<Box marginBottom={1}>
				<Text bold color="#9333EA">? LLM Configuration</Text>
			</Box>

			<Box flexDirection="column" gap={1}>
				{/* Endpoint */}
				<Box flexDirection="column">
					<Text color="#6B7280">Endpoint</Text>
					<Box>
						<Text color="#9333EA">? </Text>
						{activeField === 'endpoint' ? (
							<TextInput
								value={endpoint}
								onChange={setEndpoint}
								onSubmit={() => setActiveField('apiKey')}
							/>
						) : (
							<Text color="#D1D5DB">{endpoint}</Text>
						)}
					</Box>
				</Box>

				{/* API Key */}
				<Box flexDirection="column">
					<Text color="#6B7280">API Key (optional)</Text>
					<Box>
						<Text color="#9333EA">? </Text>
						{activeField === 'apiKey' ? (
							<TextInput
								value={apiKey}
								onChange={setApiKey}
								onSubmit={() => setActiveField('maxVideos')}
								mask="*"
							/>
						) : (
							<Text color="#D1D5DB">{apiKey || '(none)'}</Text>
						)}
					</Box>
				</Box>

				{/* Max Videos */}
				<Box flexDirection="column">
					<Text color="#6B7280">Max Videos (1-20)</Text>
					<Box>
						<Text color="#9333EA">? </Text>
						{activeField === 'maxVideos' ? (
							<TextInput
								value={maxVideos}
								onChange={setMaxVideos}
								onSubmit={() => setActiveField('maxComments')}
							/>
						) : (
							<Text color="#D1D5DB">{maxVideos}</Text>
						)}
					</Box>
				</Box>

				{/* Max Comments Per Video */}
				<Box flexDirection="column">
					<Text color="#6B7280">Max Comments Per Video (10-500)</Text>
					<Box>
						<Text color="#9333EA">? </Text>
						{activeField === 'maxComments' ? (
							<TextInput
								value={maxComments}
								onChange={setMaxComments}
								onSubmit={() => setActiveField('model')}
							/>
						) : (
							<Text color="#D1D5DB">{maxComments}</Text>
						)}
					</Box>
				</Box>

				{/* Model */}
				<Box flexDirection="column" marginTop={1}>
					<Text color="#6B7280">
						Model {loading && <Text color="#9333EA">(loading...)</Text>}
					</Text>
					{activeField === 'model' && availableModels.length > 0 ? (
						<SelectInput
							items={availableModels.map(m => ({ label: m, value: m }))}
							onSelect={item => {
								setModel(item.value);
								setActiveField('buttons');
							}}
						/>
					) : (
						<Box>
							<Text color="#9333EA">? </Text>
							<Text color="#D1D5DB">{model}</Text>
						</Box>
					)}
				</Box>

				{/* Buttons */}
				{activeField === 'buttons' && (
					<Box marginTop={1}>
						<SelectInput
							items={[
								{ label: '? Save', value: 'save' },
								{ label: '? Cancel', value: 'cancel' },
							]}
							onSelect={item => {
								if (item.value === 'save') {
									handleSave();
								} else {
									onCancel();
								}
							}}
						/>
					</Box>
				)}
			</Box>

			{/* Hint */}
			<Box marginTop={2}>
				<Text color="#4B5563" dimColor>
					Press <Text color="#9333EA">Enter</Text> to confirm ? <Text color="#9333EA">Esc</Text> to cancel
				</Text>
			</Box>
		</Box>
	);
};
