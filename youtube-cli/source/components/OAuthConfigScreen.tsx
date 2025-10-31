import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import {
	completeQwenOAuth,
	loadTokens,
	clearTokens,
	getQwenConfig,
} from '../oauth-manager.js';

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

type Step =
	| 'select-mode'
	| 'custom-endpoint'
	| 'custom-apikey'
	| 'custom-model'
	| 'qwen-client-id'
	| 'qwen-client-secret'
	| 'qwen-oauth-flow'
	| 'confirm';

export const OAuthConfigScreen: React.FC<Props> = ({
	onComplete,
	onCancel,
	currentMode,
	currentEndpoint,
	currentApiKey,
	currentModel,
}) => {
	const [step, setStep] = useState<Step>('select-mode');
	const [mode, setMode] = useState<'custom' | 'qwen'>(currentMode);
	const [endpoint, setEndpoint] = useState(currentEndpoint);
	const [apiKey, setApiKey] = useState(currentApiKey);
	const [model, setModel] = useState(currentModel);
	const [qwenClientId, setQwenClientId] = useState('');
	const [qwenClientSecret, setQwenClientSecret] = useState('');
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [authError, setAuthError] = useState<string | null>(null);

	useInput((input, key) => {
		if (key.escape) {
			onCancel();
		}
	});

	// Check if already authenticated
	const existingTokens = loadTokens();
	const isAuthenticated = existingTokens && existingTokens.provider === 'qwen';

	const handleModeSelect = (item: { value: string }) => {
		const selectedMode = item.value as 'custom' | 'qwen';
		setMode(selectedMode);

		if (selectedMode === 'custom') {
			setStep('custom-endpoint');
		} else {
			// Check if already authenticated
			if (isAuthenticated) {
				const qwenConfig = getQwenConfig();
				setEndpoint(qwenConfig.apiEndpoint);
				setModel(qwenConfig.model);
				setStep('confirm');
			} else {
				setStep('qwen-client-id');
			}
		}
	};

	const handleQwenAuth = async () => {
		if (!qwenClientId || !qwenClientSecret) {
			setAuthError('Client ID and Secret are required');
			return;
		}

		setIsAuthenticating(true);
		setAuthError(null);
		setStep('qwen-oauth-flow');

		try {
			const tokens = await completeQwenOAuth(qwenClientId, qwenClientSecret);
			const qwenConfig = getQwenConfig();
			
			setEndpoint(qwenConfig.apiEndpoint);
			setApiKey(tokens.accessToken);
			setModel(qwenConfig.model);
			setStep('confirm');
		} catch (error) {
			setAuthError(error instanceof Error ? error.message : 'OAuth failed');
			setStep('qwen-client-id');
		} finally {
			setIsAuthenticating(false);
		}
	};

	const handleLogout = () => {
		clearTokens();
		setStep('qwen-client-id');
	};

	const handleSave = () => {
		onComplete(mode, endpoint, apiKey, model);
	};

	return (
		<Box flexDirection="column" padding={2}>
			{/* Header */}
			<Box marginBottom={1}>
				<Text bold color="#9333EA">
					? LLM Configuration
				</Text>
			</Box>

			{/* Step: Select Mode */}
			{step === 'select-mode' && (
				<Box flexDirection="column">
					<Box marginBottom={1}>
						<Text color="#6B7280">
							Select authentication mode:
						</Text>
					</Box>
					<SelectInput
						items={[
							{ label: '?? Custom (Manual endpoint + API key)', value: 'custom' },
							{
								label: `?? OAuth Qwen ${isAuthenticated ? '(Already logged in)' : ''}`,
								value: 'qwen',
							},
						]}
						onSelect={handleModeSelect}
					/>
				</Box>
			)}

			{/* Custom Mode Steps */}
			{step === 'custom-endpoint' && (
				<Box flexDirection="column">
					<Text color="#6B7280">Endpoint</Text>
					<Box>
						<Text color="#9333EA">? </Text>
						<TextInput
							value={endpoint}
							onChange={setEndpoint}
							onSubmit={() => setStep('custom-apikey')}
						/>
					</Box>
				</Box>
			)}

			{step === 'custom-apikey' && (
				<Box flexDirection="column">
					<Text color="#6B7280">API Key</Text>
					<Box>
						<Text color="#9333EA">? </Text>
						<TextInput
							value={apiKey}
							onChange={setApiKey}
							onSubmit={() => setStep('custom-model')}
							mask="*"
						/>
					</Box>
				</Box>
			)}

			{step === 'custom-model' && (
				<Box flexDirection="column">
					<Text color="#6B7280">Model</Text>
					<Box>
						<Text color="#9333EA">? </Text>
						<TextInput
							value={model}
							onChange={setModel}
							onSubmit={() => setStep('confirm')}
						/>
					</Box>
				</Box>
			)}

			{/* Qwen OAuth Steps */}
			{step === 'qwen-client-id' && (
				<Box flexDirection="column" gap={1}>
					{authError && (
						<Box marginBottom={1}>
							<Text color="#ef4444">? {authError}</Text>
						</Box>
					)}
					
					<Text color="#6B7280">Qwen Client ID</Text>
					<Box>
						<Text color="#9333EA">? </Text>
						<TextInput
							value={qwenClientId}
							onChange={setQwenClientId}
							onSubmit={() => setStep('qwen-client-secret')}
							placeholder="Enter your Qwen Client ID"
						/>
					</Box>
					
					<Box marginTop={1}>
						<Text color="#4B5563" dimColor>
							Get your credentials at: https://dashscope.console.aliyun.com
						</Text>
					</Box>
				</Box>
			)}

			{step === 'qwen-client-secret' && (
				<Box flexDirection="column">
					<Text color="#6B7280">Qwen Client Secret</Text>
					<Box>
						<Text color="#9333EA">? </Text>
						<TextInput
							value={qwenClientSecret}
							onChange={setQwenClientSecret}
							onSubmit={handleQwenAuth}
							mask="*"
							placeholder="Enter your Qwen Client Secret"
						/>
					</Box>
				</Box>
			)}

			{step === 'qwen-oauth-flow' && (
				<Box flexDirection="column" alignItems="center" gap={1}>
					<Box>
						<Text color="#9333EA">
							<Spinner type="dots" />
						</Text>
						<Text color="#9333EA"> Authenticating with Qwen...</Text>
					</Box>
					<Text color="#6B7280">Please complete authorization in your browser</Text>
					<Text color="#4B5563" dimColor>
						A new browser window should have opened
					</Text>
					<Text color="#4B5563" dimColor>
						Waiting for callback...
					</Text>
				</Box>
			)}

			{/* Confirmation */}
			{step === 'confirm' && (
				<Box flexDirection="column" gap={1}>
					<Text color="#10B981" bold>
						? Configuration Ready
					</Text>

					<Box flexDirection="column" marginTop={1}>
						<Text color="#6B7280">Mode: </Text>
						<Text color="#D1D5DB">
							{mode === 'qwen' ? '?? OAuth Qwen' : '?? Custom'}
						</Text>
					</Box>

					<Box flexDirection="column">
						<Text color="#6B7280">Endpoint: </Text>
						<Text color="#D1D5DB">{endpoint}</Text>
					</Box>

					<Box flexDirection="column">
						<Text color="#6B7280">Model: </Text>
						<Text color="#D1D5DB">{model}</Text>
					</Box>

					{mode === 'qwen' && isAuthenticated && (
						<Box marginTop={1}>
							<Text color="#10B981">? Authenticated with Qwen OAuth</Text>
						</Box>
					)}

					<Box marginTop={2}>
						<SelectInput
							items={[
								{ label: '? Save Configuration', value: 'save' },
								...(mode === 'qwen' && isAuthenticated
									? [{ label: '?? Logout from Qwen', value: 'logout' }]
									: []),
								{ label: '? Cancel', value: 'cancel' },
							]}
							onSelect={item => {
								if (item.value === 'save') {
									handleSave();
								} else if (item.value === 'logout') {
									handleLogout();
								} else {
									onCancel();
								}
							}}
						/>
					</Box>
				</Box>
			)}

			{/* Hints */}
			<Box marginTop={2}>
				<Text color="#4B5563" dimColor>
					Press <Text color="#9333EA">Enter</Text> to confirm ?{' '}
					<Text color="#9333EA">Esc</Text> to cancel
				</Text>
			</Box>
		</Box>
	);
};
