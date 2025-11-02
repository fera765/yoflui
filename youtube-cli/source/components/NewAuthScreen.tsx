import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { QwenOAuthScreen } from './QwenOAuthScreen.js';
import TextInput from 'ink-text-input';

interface Props {
	onComplete: (mode: 'custom' | 'qwen', endpoint: string, apiKey: string, model: string) => void;
	onCancel: () => void;
	currentMode: 'custom' | 'qwen';
	currentEndpoint: string;
	currentApiKey: string;
	currentModel: string;
}

type Screen = 'select' | 'custom' | 'qwen';
type CustomField = 'endpoint' | 'apikey' | 'model' | 'done';

export const NewAuthScreen: React.FC<Props> = ({
	onComplete,
	onCancel,
	currentEndpoint,
	currentApiKey,
	currentModel,
}) => {
	const [screen, setScreen] = useState<Screen>('select');
	const [customField, setCustomField] = useState<CustomField>('endpoint');
	const [endpoint, setEndpoint] = useState(currentEndpoint);
	const [apiKey, setApiKey] = useState(currentApiKey);
	const [model, setModel] = useState(currentModel);

	useInput((input, key) => {
		if (key.escape) {
			if (screen === 'select') {
				onCancel();
			} else {
				setScreen('select');
			}
		}
		
		if (customField === 'done' && key.return) {
			onComplete('custom', endpoint, apiKey, model);
		}
	});

	if (screen === 'qwen') {
		return (
			<QwenOAuthScreen
				onComplete={(ep, key, mdl) => onComplete('qwen', ep, key, mdl)}
				onBack={() => setScreen('select')}
			/>
		);
	}

	if (screen === 'custom') {
		return (
			<Box flexDirection="column" padding={1}>
			<Box borderStyle="double" borderColor="#8B5CF6" paddingX={2} paddingY={1} flexDirection="column">
				<Box marginBottom={1}>
					<Text bold color="#A78BFA">?? CUSTOM ENDPOINT</Text>
				</Box>

					<Box flexDirection="column" gap={1}>
						<Box flexDirection="column">
							<Text color="#6B7280">Endpoint URL</Text>
							<Box>
								{customField === 'endpoint' ? (
									<>
										<Text color="#8B5CF6">? </Text>
										<TextInput
											value={endpoint}
											onChange={setEndpoint}
											onSubmit={() => setCustomField('apikey')}
											placeholder="http://localhost:4000/v1"
										/>
									</>
								) : (
									<>
										<Text color="#4B5563">? </Text>
										<Text color="#D1D5DB">{endpoint}</Text>
									</>
								)}
							</Box>
						</Box>

						{customField !== 'endpoint' && (
							<Box flexDirection="column">
								<Text color="#6B7280">API Key</Text>
								<Box>
									{customField === 'apikey' ? (
										<>
											<Text color="#8B5CF6">? </Text>
											<TextInput
												value={apiKey}
												onChange={setApiKey}
												onSubmit={() => setCustomField('model')}
												mask="*"
												placeholder="Optional"
											/>
										</>
									) : (
										<>
											<Text color="#4B5563">? </Text>
											<Text color="#D1D5DB">{apiKey || '(none)'}</Text>
										</>
									)}
								</Box>
							</Box>
						)}

						{(customField === 'model' || customField === 'done') && (
							<Box flexDirection="column">
								<Text color="#6B7280">Model Name</Text>
								<Box>
									{customField === 'model' ? (
										<>
											<Text color="#8B5CF6">? </Text>
											<TextInput
												value={model}
												onChange={setModel}
												onSubmit={() => setCustomField('done')}
												placeholder="gemini"
											/>
										</>
									) : (
										<>
											<Text color="#4B5563">? </Text>
											<Text color="#D1D5DB">{model}</Text>
										</>
									)}
								</Box>
							</Box>
						)}

						{customField === 'done' && (
							<Box marginTop={1}>
								<Text color="#10B981">? Press </Text>
								<Text color="#10B981" bold>Enter</Text>
								<Text color="#10B981"> to save</Text>
							</Box>
						)}
					</Box>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" padding={1}>
		<Box borderStyle="double" borderColor="#8B5CF6" paddingX={2} paddingY={1} flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color="#A78BFA">?? LLM AUTHENTICATION</Text>
			</Box>

			<SelectInput
				items={[
				{ label: '?? Qwen OAuth (2000 req/day FREE)', value: 'qwen' },
				{ label: '?? Custom Endpoint', value: 'custom' },
					]}
					onSelect={item => setScreen(item.value as Screen)}
				/>
			</Box>
		</Box>
	);
};
