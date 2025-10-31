import React, { useState } from 'react';
import { Box } from 'ink';
import { ElegantHeader } from './components/ElegantHeader.js';
import { ElegantTimeline, type Message } from './components/ElegantTimeline.js';
import { ElegantInput } from './components/ElegantInput.js';
import { SimpleOAuthConfigScreen } from './components/SimpleOAuthConfigScreen.js';
import { getConfig, setConfig } from './llm-config.js';
import { sendMessage } from './llm-service.js';

type Screen = 'chat' | 'config';

export default function App() {
	const [screen, setScreen] = useState<Screen>('chat');
	const [messages, setMessages] = useState<Message[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);

	const config = getConfig();

	const handleSendMessage = async (userMessage: string) => {
		// Add user message
		setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
		setIsProcessing(true);

		try {
			let toolMessageIndex: number | null = null;

			const response = await sendMessage(
				userMessage,
				(toolName, query) => {
					// Tool started
					const toolMsg: Message = {
						role: 'tool',
						content: '',
						toolCall: {
							name: toolName,
							query,
							status: 'running',
						},
					};
					setMessages(prev => {
						toolMessageIndex = prev.length;
						return [...prev, toolMsg];
					});
				},
				(result) => {
					// Tool completed
					if (toolMessageIndex !== null) {
						setMessages(prev => {
							const updated = [...prev];
							const toolMsg = updated[toolMessageIndex!];
							if (toolMsg && toolMsg.toolCall) {
								toolMsg.toolCall.status = 'complete';
								toolMsg.toolCall.result = {
									totalVideos: result.totalVideos,
									totalComments: result.totalComments,
								};
							}
							return updated;
						});
					}
				}
			);

			// Add assistant response
			setMessages(prev => [...prev, { role: 'assistant', content: response }]);
		} catch (error) {
			setMessages(prev => [
				...prev,
				{
					role: 'assistant',
					content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
				},
			]);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleSaveConfig = (
		mode: 'custom' | 'qwen',
		endpoint: string,
		apiKey: string,
		model: string
	) => {
		setConfig({ endpoint, apiKey, model });
		setScreen('chat');
	};

	if (screen === 'config') {
		return (
			<SimpleOAuthConfigScreen
				onComplete={handleSaveConfig}
				onCancel={() => setScreen('chat')}
				currentMode="custom"
				currentEndpoint={config.endpoint}
				currentApiKey={config.apiKey}
				currentModel={config.model}
			/>
		);
	}

	return (
		<Box flexDirection="column" height="100%">
			<ElegantHeader model={config.model} messageCount={messages.filter(m => m.role === 'user').length} />
			
			<Box flexGrow={1} flexDirection="column">
				<ElegantTimeline messages={messages} />
			</Box>

			<ElegantInput
				onSendMessage={handleSendMessage}
				onConfigCommand={() => setScreen('config')}
				onExitCommand={() => process.exit(0)}
				isProcessing={isProcessing}
			/>
		</Box>
	);
}
