import React, { useState } from 'react';
import { Box, useInput, Text } from 'ink';
import { QuantumTimeline, QuantumInput, type Message } from './components/QuantumTerminal.js';
import { CommandSuggestions } from './components/CommandSuggestions.js';
import { NewAuthScreen } from './components/NewAuthScreen.js';
import { ConfigScreen } from './components/ConfigScreen.js';
import { ToolsScreen } from './components/ToolsScreen.js';
import { getConfig, setConfig } from './llm-config.js';
import { runAutonomousAgent } from './autonomous-agent.js';
import { join } from 'path';

type Screen = 'chat' | 'auth' | 'config' | 'tools';

export default function App() {
	const [screen, setScreen] = useState<Screen>('chat');
	const [messages, setMessages] = useState<Message[]>([]);
	const [inputValue, setInputValue] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);
	const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);

	const config = getConfig();

	useInput((input, key) => {
		if (key.escape && inputValue.length > 0) {
			setInputValue('');
			setShowCommandSuggestions(false);
		}
	});

	const handleInputChange = (value: string) => {
		setInputValue(value);
		setShowCommandSuggestions(value === '/');
	};

	const handleCommandSelect = (command: string) => {
		setInputValue('');
		setShowCommandSuggestions(false);

		if (command === '/llm') {
			setScreen('auth');
		} else if (command === '/config') {
			setScreen('config');
		} else if (command === '/tools') {
			setScreen('tools');
		} else if (command === '/exit') {
			process.exit(0);
		}
	};

	const handleSubmit = async () => {
		if (!inputValue.trim() || isProcessing) return;

		const msg = inputValue.trim();
		setInputValue('');
		setShowCommandSuggestions(false);

		// Handle commands
		if (msg === '/llm') {
			setScreen('auth');
			return;
		}
		if (msg === '/config') {
			setScreen('config');
			return;
		}
		if (msg === '/tools') {
			setScreen('tools');
			return;
		}
		if (msg === '/exit') {
			process.exit(0);
			return;
		}

		// Send message - autonomous agent
		setMessages(prev => [...prev, { role: 'user', content: msg }]);
		setIsProcessing(true);

		try {
			// Create work directory
			const workDir = join(process.cwd(), 'work', `task-${Date.now()}`);

			const response = await runAutonomousAgent({
				userMessage: msg,
				workDir,
				onProgress: (progress) => {
					// Silent in interactive mode - visual feedback via timeline
				},
				onKanbanUpdate: (tasks) => {
					setMessages(prev => {
						// Remove previous kanban and add new one
						const filtered = prev.filter(m => m.role !== 'kanban');
						return [...filtered, { role: 'kanban', content: '', kanban: tasks }];
					});
				},
				onToolExecute: (toolName, args) => {
					setMessages(prev => [
						...prev,
						{
							role: 'tool',
							content: '',
							toolCall: { name: toolName, args, status: 'running' },
						},
					]);
				},
				onToolComplete: (toolName, args, result, error) => {
					setMessages(prev => {
						const updated = [...prev];
						// Find the last tool message with matching name and running status
						for (let i = updated.length - 1; i >= 0; i--) {
							if (
								updated[i]?.role === 'tool' &&
								updated[i]?.toolCall?.name === toolName &&
								updated[i]?.toolCall?.status === 'running'
							) {
								updated[i] = {
									role: 'tool',
									content: '',
									toolCall: {
										name: toolName,
										args,
										status: error ? 'error' : 'complete',
										result,
									},
								};
								break;
							}
						}
						return updated;
					});
				},
			});

			setMessages(prev => [...prev, { role: 'assistant', content: response }]);
		} catch (error) {
			setMessages(prev => [
				...prev,
				{
					role: 'assistant',
					content: `**Error:** ${error instanceof Error ? error.message : 'Unknown error'}`,
				},
			]);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleAuthComplete = (mode: 'custom' | 'qwen', endpoint: string, apiKey: string, model: string) => {
		setConfig({ endpoint, apiKey, model });
		setScreen('chat');
	};

	const handleConfigSave = (maxVideos: number, maxCommentsPerVideo: number) => {
		setConfig({ maxVideos, maxCommentsPerVideo });
		setScreen('chat');
	};

	if (screen === 'auth') {
		return (
			<NewAuthScreen
				onComplete={handleAuthComplete}
				onCancel={() => setScreen('chat')}
				currentMode="custom"
				currentEndpoint={config.endpoint}
				currentApiKey={config.apiKey}
				currentModel={config.model}
			/>
		);
	}

	if (screen === 'config') {
		return (
			<ConfigScreen
				onSave={handleConfigSave}
				onCancel={() => setScreen('chat')}
				currentMaxVideos={config.maxVideos}
				currentMaxComments={config.maxCommentsPerVideo}
			/>
		);
	}

	if (screen === 'tools') {
		return <ToolsScreen onClose={() => setScreen('chat')} />;
	}

	return (
		<Box flexDirection="column">
			<Box flexDirection="column" overflow="hidden">
				<QuantumTimeline messages={messages} />
			</Box>

			{showCommandSuggestions && (
				<Box paddingX={2} paddingBottom={1}>
					<CommandSuggestions onSelect={handleCommandSelect} />
				</Box>
			)}

			<QuantumInput
				value={inputValue}
				onChange={handleInputChange}
				onSubmit={handleSubmit}
				isProcessing={isProcessing}
			/>
		</Box>
	);
}
