import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { LLMConfigScreen } from './components/LLMConfigScreen.js';
import { ChatTimeline, type ChatMessageData } from './components/ChatTimeline.js';
import { ChatInput } from './components/ChatInput.js';
import { getConfig, setConfig } from './llm-config.js';
import { sendMessage } from './llm-service.js';

type Screen = 'chat' | 'config';

export default function App() {
	const { exit } = useApp();
	const [screen, setScreen] = useState<Screen>('chat');
	const [messages, setMessages] = useState<ChatMessageData[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);

	const handleSendMessage = async (userMessage: string) => {
		setIsProcessing(true);

		// Add user message
		const userMsgId = Date.now().toString();
		const userMsg: ChatMessageData = {
			id: userMsgId,
			role: 'user',
			content: userMessage,
		};

		setMessages((prev) => [...prev, userMsg]);

		// Create assistant message with potential tool call
		const assistantMsgId = (Date.now() + 1).toString();
		let assistantMsg: ChatMessageData = {
			id: assistantMsgId,
			role: 'assistant',
			content: '',
		};

		setMessages((prev) => [...prev, assistantMsg]);

		try {
			const response = await sendMessage(
				userMessage,
				// onToolCall
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
				// onToolComplete
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

			// Update with final response
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
				<LLMConfigScreen
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
			{/* Header */}
			<Box borderStyle="bold" borderColor="magenta" paddingX={2} paddingY={0}>
				<Text color="magenta" bold>
					? AI YOUTUBE ANALYST
				</Text>
				<Text color="gray" dimColor>
					{' '}
					? Model: {getConfig().model}
				</Text>
			</Box>

			{/* Chat Timeline */}
			<Box flexGrow={1}>
				<ChatTimeline messages={messages} />
			</Box>

			{/* Chat Input */}
			<Box>
				<ChatInput
					onSendMessage={handleSendMessage}
					onConfigCommand={() => setScreen('config')}
					onExitCommand={handleExit}
					isProcessing={isProcessing}
				/>
			</Box>
		</Box>
	);
}
