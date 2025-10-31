import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { QwenOAuthScreen } from './QwenOAuthScreen.js';

interface Props {
	onComplete: (
		mode: 'custom' | 'qwen',
		endpoint: string,
		apiKey: string,
		model: string
	) => void;
	onCancel: () => void;
	currentMode: 'custom' | 'qwen';
	currentEndpoint: string;
	currentApiKey: string;
	currentModel: string;
}

type Screen = 'select-mode' | 'custom-config' | 'qwen-oauth';
type CustomStep = 'endpoint' | 'apikey' | 'model';

export const SimpleOAuthConfigScreen: React.FC<Props> = ({
	onComplete,
	onCancel,
	currentMode,
	currentEndpoint,
	currentApiKey,
	currentModel,
}) => {
	const [screen, setScreen] = useState<Screen>('select-mode');
	const [customStep, setCustomStep] = useState<CustomStep>('endpoint');
	const [endpoint, setEndpoint] = useState(currentEndpoint);
	const [apiKey, setApiKey] = useState(currentApiKey);
	const [model, setModel] = useState(currentModel);

	useInput((input, key) => {
		if (key.escape) {
			if (screen === 'select-mode') {
				onCancel();
			} else {
				setScreen('select-mode');
			}
		}
	});

	const handleModeSelect = (item: { value: string }) => {
		if (item.value === 'qwen') {
			setScreen('qwen-oauth');
		} else {
			setScreen('custom-config');
		}
	};

	const handleQwenComplete = (endpoint: string, apiKey: string, model: string) => {
		onComplete('qwen', endpoint, apiKey, model);
	};

	const handleCustomSave = () => {
		onComplete('custom', endpoint, apiKey, model);
	};

	return (
		<Box flexDirection="column" padding={2}>
			{/* Header */}
			{screen !== 'qwen-oauth' && (
				<Box marginBottom={1}>
					<Text bold color="#9333EA">
						? LLM Configuration
					</Text>
				</Box>
			)}

			{/* Select Mode */}
			{screen === 'select-mode' && (
				<Box flexDirection="column">
					<Box marginBottom={1}>
						<Text color="#6B7280">
							Select authentication mode:
						</Text>
					</Box>
					<SelectInput
						items={[
							{
								label: '?? OAuth Qwen (2000 requests/day - FREE)',
								value: 'qwen',
							},
							{
								label: '?? Custom (Manual endpoint + API key)',
								value: 'custom',
							},
						]}
						onSelect={handleModeSelect}
					/>
				</Box>
			)}

			{/* Custom Configuration */}
			{screen === 'custom-config' && (
				<Box flexDirection="column" gap={1}>
					<Box flexDirection="column">
						<Text color="#6B7280">Endpoint</Text>
						<Box>
							<Text color="#9333EA">? </Text>
							{customStep === 'endpoint' ? (
								<TextInput
									value={endpoint}
									onChange={setEndpoint}
									onSubmit={() => setCustomStep('apikey')}
									placeholder="http://localhost:4000/v1"
								/>
							) : (
								<Text color="#D1D5DB">{endpoint}</Text>
							)}
						</Box>
					</Box>

					{customStep !== 'endpoint' && (
						<Box flexDirection="column">
							<Text color="#6B7280">API Key</Text>
							<Box>
								<Text color="#9333EA">? </Text>
								{customStep === 'apikey' ? (
									<TextInput
										value={apiKey}
										onChange={setApiKey}
										onSubmit={() => setCustomStep('model')}
										mask="*"
										placeholder="Your API key"
									/>
								) : (
									<Text color="#D1D5DB">{apiKey || '(none)'}</Text>
								)}
							</Box>
						</Box>
					)}

					{customStep === 'model' && (
						<>
							<Box flexDirection="column">
								<Text color="#6B7280">Model</Text>
								<Box>
									<Text color="#9333EA">? </Text>
									<TextInput
										value={model}
										onChange={setModel}
										onSubmit={handleCustomSave}
										placeholder="Model name"
									/>
								</Box>
							</Box>

							<Box marginTop={1}>
								<Text color="#4B5563" dimColor>
									Press <Text color="#9333EA">Enter</Text> to save
								</Text>
							</Box>
						</>
					)}
				</Box>
			)}

			{/* Qwen OAuth */}
			{screen === 'qwen-oauth' && (
				<QwenOAuthScreen
					onComplete={handleQwenComplete}
					onBack={() => setScreen('select-mode')}
				/>
			)}

			{/* Hints */}
			{screen !== 'qwen-oauth' && (
				<Box marginTop={2}>
					<Text color="#4B5563" dimColor>
						Press <Text color="#9333EA">Enter</Text> to confirm ?{' '}
						<Text color="#9333EA">Esc</Text> to {screen === 'select-mode' ? 'cancel' : 'back'}
					</Text>
				</Box>
			)}
		</Box>
	);
};
