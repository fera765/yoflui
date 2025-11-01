/**
 * App.tsx - REESCRITO DO ZERO
 * 
 * Vers?o limpa sem problemas de:
 * - Duplica??o de mensagens
 * - Re-renderiza??es excessivas
 * - Multiplica??o ao digitar
 */

import React, { useState, useCallback, useRef } from 'react';
import { Box, useInput } from 'ink';
import { OptimizedTimeline, type Message } from './components/OptimizedTimeline.js';
import { InputField } from './components/InputField.js';
import { CommandSuggestions } from './components/CommandSuggestions.js';
import { NewAuthScreen } from './components/NewAuthScreen.js';
import { ConfigScreen } from './components/ConfigScreen.js';
import { ToolsScreen } from './components/ToolsScreen.js';
import { getConfig, setConfig } from './llm-config.js';
import { runAutonomousAgent } from './autonomous-agent.js';
import { join } from 'path';

type AppScreen = 'chat' | 'auth' | 'config' | 'tools';

export default function App() {
	// Estados principais
	const [currentScreen, setCurrentScreen] = useState<AppScreen>('chat');
	const [messagesList, setMessagesList] = useState<Message[]>([]);
	const [textInput, setTextInput] = useState('');
	const [processing, setProcessing] = useState(false);
	const [showCommands, setShowCommands] = useState(false);
	
	// Refs para controle
	const isSubmitting = useRef(false);
	const msgCounter = useRef(0);
	
	const appConfig = getConfig();
	
	// Handler para ESC key
	useInput((input, key) => {
		if (key.escape && textInput.length > 0) {
			setTextInput('');
			setShowCommands(false);
		}
	});
	
	// Handler otimizado para mudan?as no input
	const onInputChange = useCallback((newValue: string) => {
		setTextInput(newValue);
		setShowCommands(newValue === '/');
	}, []);
	
	// Handler para sele??o de comando
	const onCommandSelect = useCallback((cmd: string) => {
		setTextInput('');
		setShowCommands(false);
		
		if (cmd === '/llm') setCurrentScreen('auth');
		else if (cmd === '/config') setCurrentScreen('config');
		else if (cmd === '/tools') setCurrentScreen('tools');
		else if (cmd === '/exit') process.exit(0);
	}, []);
	
	// Handler para submit de mensagem
	const onMessageSubmit = useCallback(async () => {
		// Valida??es
		if (!textInput.trim() || processing || isSubmitting.current) return;
		
		const userText = textInput.trim();
		
		// Verificar se ? comando
		if (userText.startsWith('/')) {
			const cmd = userText.split(/\s+/)[0];
			if (userText === cmd) {
				// Comando exato - executar
				onCommandSelect(cmd);
				return;
			}
		}
		
		// Marcar como processando
		isSubmitting.current = true;
		setTextInput('');
		setShowCommands(false);
		
		// Criar ID ?nico
		msgCounter.current += 1;
		const msgId = `msg-${Date.now()}-${msgCounter.current}`;
		
		// Adicionar mensagem do usu?rio
		setMessagesList(prev => [...prev, {
			role: 'user',
			content: userText,
			id: msgId
		}]);
		
		setProcessing(true);
		
		try {
			const workFolder = join(process.cwd(), 'work', `task-${Date.now()}`);
			
			const aiResponse = await runAutonomousAgent({
				userMessage: userText,
				workDir: workFolder,
				onProgress: () => {},
				onKanbanUpdate: (tasks) => {
					setMessagesList(prev => {
						const withoutKanban = prev.filter(m => m.role !== 'kanban');
						msgCounter.current += 1;
						return [...withoutKanban, {
							role: 'kanban',
							content: '',
							id: `kanban-${Date.now()}-${msgCounter.current}`,
							kanban: tasks
						}];
					});
				},
				onToolExecute: (toolName, args) => {
					msgCounter.current += 1;
					setMessagesList(prev => [...prev, {
						role: 'tool',
						content: '',
						id: `tool-${Date.now()}-${msgCounter.current}`,
						toolCall: { name: toolName, args, status: 'running' }
					}]);
				},
				onToolComplete: (toolName, args, result, error) => {
					setMessagesList(prev => {
						const updated = [...prev];
						for (let i = updated.length - 1; i >= 0; i--) {
							if (updated[i].role === 'tool' && 
								updated[i].toolCall?.name === toolName &&
								updated[i].toolCall?.status === 'running') {
								updated[i] = {
									...updated[i],
									toolCall: {
										name: toolName,
										args,
										status: error ? 'error' : 'complete',
										result
									}
								};
								break;
							}
						}
						return updated;
					});
				}
			});
			
			// Adicionar resposta do assistente
			msgCounter.current += 1;
			setMessagesList(prev => [...prev, {
				role: 'assistant',
				content: aiResponse,
				id: `assist-${Date.now()}-${msgCounter.current}`
			}]);
			
		} catch (err) {
			msgCounter.current += 1;
			setMessagesList(prev => [...prev, {
				role: 'assistant',
				content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
				id: `error-${Date.now()}-${msgCounter.current}`
			}]);
		} finally {
			setProcessing(false);
			isSubmitting.current = false;
		}
	}, [textInput, processing, onCommandSelect]);
	
	// Handlers de navega??o
	const onAuthComplete = useCallback((mode: 'custom' | 'qwen', endpoint: string, apiKey: string, model: string) => {
		setConfig({ endpoint, apiKey, model });
		setCurrentScreen('chat');
	}, []);
	
	const onConfigSave = useCallback((maxVideos: number, maxCommentsPerVideo: number) => {
		setConfig({ maxVideos, maxCommentsPerVideo });
		setCurrentScreen('chat');
	}, []);
	
	// Renderiza??o condicional de telas
	if (currentScreen === 'auth') {
		return (
			<NewAuthScreen
				onComplete={onAuthComplete}
				onCancel={() => setCurrentScreen('chat')}
				currentMode="custom"
				currentEndpoint={appConfig.endpoint}
				currentApiKey={appConfig.apiKey}
				currentModel={appConfig.model}
			/>
		);
	}
	
	if (currentScreen === 'config') {
		return (
			<ConfigScreen
				onSave={onConfigSave}
				onCancel={() => setCurrentScreen('chat')}
				currentMaxVideos={appConfig.maxVideos}
				currentMaxComments={appConfig.maxCommentsPerVideo}
			/>
		);
	}
	
	if (currentScreen === 'tools') {
		return <ToolsScreen onClose={() => setCurrentScreen('chat')} />;
	}
	
	// Tela principal de chat
	return (
		<Box flexDirection="column" minHeight={0}>
			<Box flexDirection="column" flexGrow={1} minHeight={0}>
				<OptimizedTimeline messages={messagesList} />
			</Box>
			
			{showCommands && (
				<Box paddingX={2} paddingBottom={1}>
					<CommandSuggestions onSelect={onCommandSelect} />
				</Box>
			)}
			
			<Box flexShrink={0}>
				<InputField
					value={textInput}
					onChange={onInputChange}
					onSubmit={onMessageSubmit}
					isProcessing={processing}
				/>
			</Box>
		</Box>
	);
}
