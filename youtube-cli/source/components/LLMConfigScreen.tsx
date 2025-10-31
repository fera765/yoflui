import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { fetchAvailableModels } from '../llm-config.js';

interface LLMConfigScreenProps {
	onSave: (endpoint: string, apiKey: string, model: string) => void;
	onCancel: () => void;
	currentEndpoint: string;
	currentApiKey: string;
	currentModel: string;
}

type InputField = 'endpoint' | 'apiKey' | 'model' | 'buttons';

export const LLMConfigScreen: React.FC<LLMConfigScreenProps> = ({
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
	const [activeField, setActiveField] = useState<InputField>('endpoint');

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

	const handleEndpointSubmit = () => {
		setActiveField('apiKey');
	};

	const handleApiKeySubmit = () => {
		setActiveField('model');
	};

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
		<Box flexDirection="column" padding={1}>
			{/* Header */}
			<Box
				borderStyle="bold"
				borderColor="cyan"
				paddingX={2}
				paddingY={1}
				marginBottom={1}
			>
				<Box flexDirection="column" width="100%">
					<Text color="cyan" bold>
						??  LLM CONFIGURATION
					</Text>
					<Text color="gray" dimColor>
						Configure your AI endpoint and model
					</Text>
				</Box>
			</Box>

			{/* Endpoint Input */}
			<Box marginBottom={1}>
				<Box
					borderStyle="round"
					borderColor={activeField === 'endpoint' ? 'yellow' : 'gray'}
					paddingX={2}
					paddingY={1}
					width="100%"
				>
					<Box flexDirection="column" width="100%">
						<Text color="white" bold>
							Endpoint URL:
						</Text>
						{activeField === 'endpoint' ? (
							<TextInput
								value={endpoint}
								onChange={setEndpoint}
								onSubmit={handleEndpointSubmit}
								placeholder="https://api.llm7.io/v1"
							/>
						) : (
							<Text color="cyan">{endpoint}</Text>
						)}
					</Box>
				</Box>
			</Box>

			{/* API Key Input */}
			<Box marginBottom={1}>
				<Box
					borderStyle="round"
					borderColor={activeField === 'apiKey' ? 'yellow' : 'gray'}
					paddingX={2}
					paddingY={1}
					width="100%"
				>
					<Box flexDirection="column" width="100%">
						<Text color="white" bold>
							API Key:
						</Text>
						{activeField === 'apiKey' ? (
							<>
								<TextInput
									value={apiKey}
									onChange={setApiKey}
									onSubmit={handleApiKeySubmit}
									placeholder="(optional - leave empty if not needed)"
								/>
								<Text color="gray" dimColor>
									Press Enter to continue
								</Text>
							</>
						) : (
							<Text color="cyan">
								{apiKey || '(not set)'}
							</Text>
						)}
					</Box>
				</Box>
			</Box>

			{/* Model Selection */}
			<Box marginBottom={1}>
				<Box
					borderStyle="round"
					borderColor={activeField === 'model' ? 'yellow' : 'gray'}
					paddingX={2}
					paddingY={1}
					width="100%"
				>
					<Box flexDirection="column" width="100%">
						<Text color="white" bold>
							Model:
						</Text>
						{loading ? (
							<Text color="yellow">Loading models...</Text>
						) : activeField === 'model' && availableModels.length > 0 ? (
							<SelectInput
								items={availableModels.map((m) => ({
									label: m,
									value: m,
								}))}
								onSelect={handleModelSelect}
							/>
						) : (
							<Text color="cyan">{model}</Text>
						)}
					</Box>
				</Box>
			</Box>

			{/* Buttons */}
			{activeField === 'buttons' && (
				<Box>
					<Box
						borderStyle="bold"
						borderColor="green"
						paddingX={2}
						paddingY={1}
					>
						<SelectInput
							items={[
								{ label: '? Save Configuration', value: 'save' },
								{ label: '? Cancel', value: 'cancel' },
							]}
							onSelect={handleButtonSelect}
						/>
					</Box>
				</Box>
			)}

			{/* Help Text */}
			<Box marginTop={1}>
				<Text color="gray" dimColor>
					Press Esc to cancel ? Use ?? to navigate ? Enter to confirm
				</Text>
			</Box>
		</Box>
	);
};
