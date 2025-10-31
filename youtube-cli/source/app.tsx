import React, { useState } from 'react';
import { Box, useApp } from 'ink';
import { ModernHeader } from './components/ModernHeader.js';
import { BeautifulTimeline, type Message } from './components/BeautifulTimeline.js';
import { ModernInput } from './components/ModernInput.js';
import { BeautifulConfigScreen } from './components/BeautifulConfigScreen.js';
import { getConfig, setConfig } from './llm-config.js';
import { sendMessage } from './llm-service.js';

type Screen = 'chat' | 'config';

export default function App() {
	const { exit } = useApp();
	const [screen, setScreen] = useState<Screen>('chat');
	const [messages, setMessages] = useState<Message[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);

	const handleSendMessage = async (userMessage: string) => {
		setIsProcessing(true);

		const userMsgId = Date.now().toString();
		const userMsg: Message = {
			id: userMsgId,
			role: 'user',
			content: userMessage,
		};

		setMessages((prev) => [...prev, userMsg]);

		const assistantMsgId = (Date.now() + 1).toString();
		let assistantMsg: Message = {
			id: assistantMsgId,
			role: 'assistant',
			content: '',
		};

		setMessages((prev) => [...prev, assistantMsg]);

		try {
			const response = await sendMessage(
				userMessage,
				(toolName, query) => {
					assistantMsg.toolCall = {
						name: toolName,
						query,
						status: 'running',
					};
					setMessages((prev) =>
						prev.map((m) => (m.id === assistantMsgId ? { ...assistantMsg } : m))
					);
				},
				(result) => {
					if (assistantMsg.toolCall) {
						assistantMsg.toolCall.status = 'complete';
						assistantMsg.toolCall.result = {
							totalVideos: result.totalVideos,
							totalComments: result.totalComments,
						};
					}
					setMessages((prev) =>
						prev.map((m) => (m.id === assistantMsgId ? { ...assistantMsg } : m))
					);
				}
			);

			assistantMsg.content = response;
			setMessages((prev) =>
				prev.map((m) => (m.id === assistantMsgId ? { ...assistantMsg } : m))
			);
		} catch (error) {
			assistantMsg.content = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
			setMessages((prev) =>
				prev.map((m) => (m.id === assistantMsgId ? { ...assistantMsg } : m))
			);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleConfigSave = (endpoint: string, apiKey: string, model: string) => {
		setConfig({ endpoint, apiKey, model });
		setScreen('chat');
	};

	const handleConfigCancel = () => {
		setScreen('chat');
	};

	const handleExit = () => {
		exit();
	};

	if (screen === 'config') {
		const config = getConfig();
		return (
			<Box flexDirection="column" height="100%">
				<BeautifulConfigScreen
					onSave={handleConfigSave}
					onCancel={handleConfigCancel}
					currentEndpoint={config.endpoint}
					currentApiKey={config.apiKey}
					currentModel={config.model}
				/>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" height="100%">
			<ModernHeader model={getConfig().model} messageCount={Math.floor(messages.length / 2)} />
			<Box flexGrow={1}>
				<BeautifulTimeline messages={messages} />
			</Box>
			<ModernInput
				onSendMessage={handleSendMessage}
				onConfigCommand={() => setScreen('config')}
				onExitCommand={handleExit}
				isProcessing={isProcessing}
			/>
		</Box>
	);
}
