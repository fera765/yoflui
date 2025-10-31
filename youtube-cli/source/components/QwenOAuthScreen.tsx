import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import {
	authenticateWithQwen,
	loadQwenCredentials,
	clearQwenCredentials,
	getQwenConfig,
} from '../qwen-oauth.js';

interface Props {
	onComplete: (endpoint: string, apiKey: string, model: string) => void;
	onBack: () => void;
}

type Step = 'check-auth' | 'show-url' | 'polling' | 'success' | 'error';

export const QwenOAuthScreen: React.FC<Props> = ({ onComplete, onBack }) => {
	const [step, setStep] = useState<Step>('check-auth');
	const [authUrl, setAuthUrl] = useState('');
	const [error, setError] = useState('');
	const [isAuthenticating, setIsAuthenticating] = useState(false);

	useInput((input, key) => {
		if (key.escape) {
			onBack();
		}
	});

	useEffect(() => {
		checkExistingAuth();
	}, []);

	const checkExistingAuth = async () => {
		const existingCreds = loadQwenCredentials();
		
		if (existingCreds) {
			console.log('? Already authenticated with Qwen');
			const config = getQwenConfig();
			onComplete(config.endpoint, existingCreds.access_token, config.model);
		} else {
			startAuthFlow();
		}
	};

	const startAuthFlow = async () => {
		if (isAuthenticating) return;
		
		setIsAuthenticating(true);
		setStep('polling');

		try {
			const creds = await authenticateWithQwen();
			const config = getQwenConfig();
			
			setStep('success');
			
			// Wait a moment to show success message
			setTimeout(() => {
				onComplete(config.endpoint, creds.access_token, config.model);
			}, 1500);
			
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Authentication failed');
			setStep('error');
			setIsAuthenticating(false);
		}
	};

	const handleRetry = () => {
		setError('');
		startAuthFlow();
	};

	const handleLogout = () => {
		clearQwenCredentials();
		onBack();
	};

	return (
		<Box flexDirection="column" padding={2}>
			{/* Header */}
			<Box marginBottom={1}>
				<Text bold color="#9333EA">
					? Qwen OAuth Authentication
				</Text>
			</Box>

			{/* Check Auth */}
			{step === 'check-auth' && (
				<Box flexDirection="column" alignItems="center" gap={1}>
					<Box>
						<Text color="#9333EA">
							<Spinner type="dots" />
						</Text>
						<Text color="#9333EA"> Checking authentication status...</Text>
					</Box>
				</Box>
			)}

			{/* Polling */}
			{step === 'polling' && (
				<Box flexDirection="column" gap={1}>
					<Box>
						<Text color="#9333EA">
							<Spinner type="dots" />
						</Text>
						<Text color="#9333EA"> Authenticating with Qwen...</Text>
					</Box>

					<Box marginTop={1}>
						<Text color="#6B7280">
							A browser window has been opened for authentication.
						</Text>
					</Box>

					<Box>
						<Text color="#6B7280">
							Please complete the authorization in your browser.
						</Text>
					</Box>

					<Box marginTop={1}>
						<Text color="#4B5563" dimColor>
							Waiting for authorization...
						</Text>
					</Box>
				</Box>
			)}

			{/* Success */}
			{step === 'success' && (
				<Box flexDirection="column" gap={1}>
					<Box>
						<Text color="#10B981" bold>
							? Authentication Successful!
						</Text>
					</Box>

					<Box>
						<Text color="#6B7280">
							You are now authenticated with Qwen.
						</Text>
					</Box>

					<Box>
						<Text color="#6B7280">
							Quota: 2000 requests/day (free)
						</Text>
					</Box>
				</Box>
			)}

			{/* Error */}
			{step === 'error' && (
				<Box flexDirection="column" gap={1}>
					<Box>
						<Text color="#ef4444" bold>
							? Authentication Failed
						</Text>
					</Box>

					<Box>
						<Text color="#ef4444">{error}</Text>
					</Box>

					<Box marginTop={2}>
						<Text color="#6B7280">
							Press <Text color="#9333EA">R</Text> to retry
						</Text>
					</Box>
					<Box>
						<Text color="#6B7280">
							Press <Text color="#9333EA">Esc</Text> to go back
						</Text>
					</Box>
				</Box>
			)}

			{/* Hints */}
			<Box marginTop={2}>
				<Text color="#4B5563" dimColor>
					{step === 'error' ? (
						<>Press <Text color="#9333EA">R</Text> to retry ? </>
					) : null}
					Press <Text color="#9333EA">Esc</Text> to cancel
				</Text>
			</Box>
		</Box>
	);
};
