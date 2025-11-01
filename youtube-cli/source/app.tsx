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
	
	// Prote??o contra m?ltiplas chamadas simult?neas
	const submittingRef = React.useRef(false);

	const config = getConfig();
	
	// Debug: Log quando messages mudar
	React.useEffect(() => {
		if (process.env.DEBUG_MESSAGES === 'true') {
			console.error(`[DEBUG] Messages array changed. Length: ${messages.length}`);
			messages.forEach((msg, idx) => {
				console.error(`[DEBUG]   [${idx}] ${msg.role}: ${msg.content?.substring(0, 40) || '(no content)'} | ID: ${msg.id || 'no-id'}`);
			});
		}
	}, [messages]);

	useInput((input, key) => {
		if (key.escape && inputValue.length > 0) {
			setInputValue('');
			setShowCommandSuggestions(false);
		}
	});

	const handleInputChange = (value: string) => {
		setInputValue(value);
		// Show suggestions only when input is exactly '/'
		// Hide suggestions when user types more characters
		if (value === '/') {
			setShowCommandSuggestions(true);
		} else {
			setShowCommandSuggestions(false);
		}
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
		
		// Prote??o contra m?ltiplas chamadas simult?neas
		if (submittingRef.current) {
			console.error('[HANDLE_SUBMIT] ??  BLOQUEADO - J? est? processando outra mensagem');
			return;
		}
		
		submittingRef.current = true;

		const msg = inputValue.trim();
		console.error(`\n\n${'='.repeat(80)}`);
		console.error(`[HANDLE_SUBMIT CALLED] Message: "${msg}"`);
		console.error(`[HANDLE_SUBMIT] Current messages length: ${messages.length}`);
		console.error(`[HANDLE_SUBMIT] Is processing: ${isProcessing}`);
		console.error('='.repeat(80) + '\n');
		
		setInputValue('');
		setShowCommandSuggestions(false);

		// Check if message starts with a command
		// Commands MUST be at the start and exact, no text before or after
		if (msg.startsWith('/')) {
			// Extract command (first word)
			const command = msg.split(/\s+/)[0];
			
			// Only execute if message is EXACTLY the command (no text after)
			if (msg === command) {
				if (command === '/llm') {
					setScreen('auth');
					return;
				}
				if (command === '/config') {
					setScreen('config');
					return;
				}
				if (command === '/tools') {
					setScreen('tools');
					return;
				}
				if (command === '/exit') {
					process.exit(0);
					return;
				}
			}
			// If command has text after it, or is not recognized, ignore the command
			// and treat as normal message (fall through)
		}

		// Add user message to timeline (only if not a command)
		// Use unique ID to prevent React key conflicts
		const userMessageId = `user-${Date.now()}-${Math.random()}`;
		if (process.env.DEBUG_MESSAGES === 'true') {
			console.error(`[DEBUG] handleSubmit: Adding user message with ID: ${userMessageId}`);
			console.error(`[DEBUG] handleSubmit: Message content: "${msg}"`);
		}
		setMessages(prev => {
			if (process.env.DEBUG_MESSAGES === 'true') {
				console.error(`[DEBUG] setMessages (user): prev.length = ${prev.length}`);
			}
			return [...prev, { role: 'user', content: msg, id: userMessageId }];
		});
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
					if (process.env.DEBUG_MESSAGES === 'true') {
						console.error(`[DEBUG] onKanbanUpdate called`);
					}
					setMessages(prev => {
						const filtered = prev.filter(m => m.role !== 'kanban');
						const kanbanId = `kanban-${Date.now()}`;
						if (process.env.DEBUG_MESSAGES === 'true') {
							console.error(`[DEBUG] setMessages (kanban): filtered.length = ${filtered.length}, adding kanban with ID: ${kanbanId}`);
						}
						return [...filtered, { role: 'kanban', content: '', kanban: tasks, id: kanbanId }];
					});
				},
				onToolExecute: (toolName, args) => {
					const toolId = `tool-${toolName}-${Date.now()}-${Math.random()}`;
					if (process.env.DEBUG_MESSAGES === 'true') {
						console.error(`[DEBUG] onToolExecute: ${toolName}, ID: ${toolId}`);
					}
					setMessages(prev => {
						if (process.env.DEBUG_MESSAGES === 'true') {
							console.error(`[DEBUG] setMessages (tool): prev.length = ${prev.length}`);
						}
						return [
							...prev,
							{
								role: 'tool',
								content: '',
								toolCall: { name: toolName, args, status: 'running' },
								id: toolId,
							},
						];
					});
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

			const assistantMessageId = `assistant-${Date.now()}-${Math.random()}`;
			if (process.env.DEBUG_MESSAGES === 'true') {
				console.error(`[DEBUG] Adding assistant response with ID: ${assistantMessageId}`);
			}
			setMessages(prev => {
				if (process.env.DEBUG_MESSAGES === 'true') {
					console.error(`[DEBUG] setMessages (assistant): prev.length = ${prev.length}`);
				}
				return [...prev, { role: 'assistant', content: response, id: assistantMessageId }];
			});
		} catch (error) {
			const errorMessageId = `assistant-error-${Date.now()}`;
			setMessages(prev => [
				...prev,
				{
					role: 'assistant',
					content: `**Error:** ${error instanceof Error ? error.message : 'Unknown error'}`,
					id: errorMessageId,
				},
			]);
		} finally {
			setIsProcessing(false);
			submittingRef.current = false;  // Liberar prote??o
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
		<Box flexDirection="column" minHeight={0}>
			<Box flexDirection="column" flexGrow={1} minHeight={0}>
				<QuantumTimeline messages={messages} />
			</Box>

			{showCommandSuggestions && (
				<Box paddingX={2} paddingBottom={1}>
					<CommandSuggestions onSelect={handleCommandSelect} />
				</Box>
			)}

			<Box flexShrink={0}>
				<QuantumInput
					value={inputValue}
					onChange={handleInputChange}
					onSubmit={handleSubmit}
					isProcessing={isProcessing}
				/>
			</Box>
		</Box>
	);
}
