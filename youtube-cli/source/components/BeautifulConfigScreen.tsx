import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { fetchAvailableModels } from '../llm-config.js';

interface BeautifulConfigScreenProps {
	onSave: (endpoint: string, apiKey: string, model: string) => void;
	onCancel: () => void;
	currentEndpoint: string;
	currentApiKey: string;
	currentModel: string;
}

type Field = 'endpoint' | 'apiKey' | 'model' | 'buttons';

export const BeautifulConfigScreen: React.FC<BeautifulConfigScreenProps> = ({
	onSave,
	onCancel,
	currentEndpoint,
	currentApiKey,
	currentModel,
}) => {
	const [endpoint, setEndpoint] = useState(currentEndpoint);
	const [apiKey, setApiKey] = useState(currentApiKey);
	const [model, setModel] = useState(currentModel);
	const [availableModels, setAvailableModels] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [activeField, setActiveField] = useState<Field>('endpoint');

	useEffect(() => {
		loadModels();
	}, [endpoint]);

	const loadModels = async () => {
		if (!endpoint) return;
		setLoading(true);
		const models = await fetchAvailableModels(endpoint);
		setAvailableModels(models);
		if (models.length > 0 && !model) {
			setModel(models[0]);
		}
		setLoading(false);
	};

	const handleEndpointSubmit = () => setActiveField('apiKey');
	const handleApiKeySubmit = () => setActiveField('model');
	const handleModelSelect = (item: { value: string }) => {
		setModel(item.value);
		setActiveField('buttons');
	};
	const handleButtonSelect = (item: { value: string }) => {
		if (item.value === 'save') {
			onSave(endpoint, apiKey, model);
		} else {
			onCancel();
		}
	};

	return (
		<Box flexDirection="column" padding={2}>
			{/* Header */}
			<Box
				paddingX={2}
				paddingY={1}
				borderStyle="round"
				borderColor="#8B5CF6"
				marginBottom={2}
			>
				<Box flexDirection="column" width="100%">
					<Text color="#A78BFA" bold>
						? LLM Configuration
					</Text>
					<Text color="#6B7280">
						Configure your AI endpoint and model
					</Text>
				</Box>
			</Box>

			{/* Endpoint */}
			<Box marginBottom={1}>
				<Box
					paddingX={2}
					paddingY={1}
					borderStyle="round"
					borderColor={activeField === 'endpoint' ? '#8B5CF6' : '#374151'}
					width="100%"
				>
					<Box flexDirection="column" width="100%">
						<Text color="#9CA3AF">
							Endpoint
						</Text>
						{activeField === 'endpoint' ? (
							<TextInput
								value={endpoint}
								onChange={setEndpoint}
								onSubmit={handleEndpointSubmit}
								placeholder="https://api.llm7.io/v1"
							/>
						) : (
							<Text color="#D1D5DB">{endpoint}</Text>
						)}
					</Box>
				</Box>
			</Box>

			{/* API Key */}
			<Box marginBottom={1}>
				<Box
					paddingX={2}
					paddingY={1}
					borderStyle="round"
					borderColor={activeField === 'apiKey' ? '#8B5CF6' : '#374151'}
					width="100%"
				>
					<Box flexDirection="column" width="100%">
						<Text color="#9CA3AF">
							API Key
						</Text>
						{activeField === 'apiKey' ? (
							<>
								<TextInput
									value={apiKey}
									onChange={setApiKey}
									onSubmit={handleApiKeySubmit}
									placeholder="(optional)"
								/>
								<Text color="#6B7280">
									Press Enter to continue
								</Text>
							</>
						) : (
							<Text color="#D1D5DB">
								{apiKey || '(not set)'}
							</Text>
						)}
					</Box>
				</Box>
			</Box>

			{/* Model */}
			<Box marginBottom={2}>
				<Box
					paddingX={2}
					paddingY={1}
					borderStyle="round"
					borderColor={activeField === 'model' ? '#8B5CF6' : '#374151'}
					width="100%"
				>
					<Box flexDirection="column" width="100%">
						<Text color="#9CA3AF">
							Model
						</Text>
						{loading ? (
							<Text color="#F59E0B">Loading models...</Text>
						) : activeField === 'model' && availableModels.length > 0 ? (
							<SelectInput
								items={availableModels.map((m) => ({
									label: m,
									value: m,
								}))}
								onSelect={handleModelSelect}
							/>
						) : (
							<Text color="#D1D5DB">{model}</Text>
						)}
					</Box>
				</Box>
			</Box>

			{/* Buttons */}
			{activeField === 'buttons' && (
				<Box
					paddingX={2}
					paddingY={1}
					borderStyle="round"
					borderColor="#10B981"
				>
					<SelectInput
						items={[
							{ label: '? Save Configuration', value: 'save' },
							{ label: '? Cancel', value: 'cancel' },
						]}
						onSelect={handleButtonSelect}
					/>
				</Box>
			)}

			{/* Footer */}
			<Box marginTop={1} paddingX={2}>
				<Text color="#6B7280">
					Use ?? to navigate ? Enter to confirm ? Esc to cancel
				</Text>
			</Box>
		</Box>
	);
};
