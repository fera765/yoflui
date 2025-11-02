/**
 * App.tsx - REESCRITO ULTRA-SIMPLES
 * 
 * Zero complexidade, zero bugs
 * Foco: funcionar perfeitamente
 */

import React, { useState } from 'react';
import { Box, useInput } from 'ink';
import { ChatTimeline, ChatInput, type ChatMessage } from './components/ChatComponents.js';
import { CommandSuggestions } from './components/CommandSuggestions.js';
import { NewAuthScreen } from './components/NewAuthScreen.js';
import { ConfigScreen } from './components/ConfigScreen.js';
import { ToolsScreen } from './components/ToolsScreen.js';
import { getConfig, setConfig } from './llm-config.js';
import { runAutonomousAgent } from './autonomous-agent.js';
import { join } from 'path';

type Screen = 'chat' | 'auth' | 'config' | 'tools';

let msgIdCounter = 0;
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${++msgIdCounter}`;

export default function App() {
	const [screen, setScreen] = useState<Screen>('chat');
	const [msgs, setMsgs] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState('');
	const [busy, setBusy] = useState(false);
	const [cmds, setCmds] = useState(false);
	
	const cfg = getConfig();
	
	// ESC para limpar
	useInput((_, key) => {
		if (key.escape) {
			setInput('');
			setCmds(false);
		}
	});
	
	// Mudar input
	const changeInput = (val: string) => {
		setInput(val);
		setCmds(val === '/');
	};
	
	// Selecionar comando
	const selectCmd = (cmd: string) => {
		setInput('');
		setCmds(false);
		
		if (cmd === '/llm') setScreen('auth');
		else if (cmd === '/config') setScreen('config');
		else if (cmd === '/tools') setScreen('tools');
		else if (cmd === '/exit') process.exit(0);
	};
	
	// Enviar mensagem
	const submitMsg = async () => {
		if (!input.trim() || busy) return;
		
		const txt = input.trim();
		
		// Comando?
		if (txt.startsWith('/') && txt.split(' ').length === 1) {
			selectCmd(txt);
			return;
		}
		
		// Limpar input IMEDIATAMENTE
		setInput('');
		setCmds(false);
		
		// Adicionar msg do usu?rio
		const userMsgId = generateId('user');
		setMsgs(prev => [...prev, { id: userMsgId, role: 'user', content: txt }]);
		
		setBusy(true);
		
		try {
			const workDir = join(process.cwd(), 'work', `task-${Date.now()}`);
			
			const reply = await runAutonomousAgent({
				userMessage: txt,
				workDir,
				onProgress: () => {},
				onKanbanUpdate: (tasks) => {
					setMsgs(prev => {
						const noKanban = prev.filter(m => m.role !== 'kanban');
						return [...noKanban, {
							id: generateId('kanban'),
							role: 'kanban',
							content: '',
							kanban: tasks
						}];
					});
				},
				onToolExecute: (name, args) => {
					setMsgs(prev => [...prev, {
						id: generateId('tool'),
						role: 'tool',
						content: '',
						toolCall: { name, args, status: 'running' }
					}]);
				},
				onToolComplete: (name, args, result, error) => {
					setMsgs(prev => {
						const copy = [...prev];
						for (let i = copy.length - 1; i >= 0; i--) {
							if (copy[i].role === 'tool' && 
								copy[i].toolCall?.name === name &&
								copy[i].toolCall?.status === 'running') {
								copy[i] = {
									...copy[i],
									toolCall: { name, args, status: error ? 'error' : 'complete', result }
								};
								break;
							}
						}
						return copy;
					});
				}
			});
			
			// Adicionar resposta
			setMsgs(prev => [...prev, {
				id: generateId('assistant'),
				role: 'assistant',
				content: reply
			}]);
			
		} catch (err) {
			setMsgs(prev => [...prev, {
				id: generateId('error'),
				role: 'assistant',
				content: `Error: ${err instanceof Error ? err.message : String(err)}`
			}]);
		} finally {
			setBusy(false);
		}
	};
	
	// Telas
	if (screen === 'auth') {
		return (
			<NewAuthScreen
				onComplete={(mode, endpoint, apiKey, model) => {
					setConfig({ endpoint, apiKey, model });
					setScreen('chat');
				}}
				onCancel={() => setScreen('chat')}
				currentMode="custom"
				currentEndpoint={cfg.endpoint}
				currentApiKey={cfg.apiKey}
				currentModel={cfg.model}
			/>
		);
	}
	
	if (screen === 'config') {
		return (
			<ConfigScreen
				onSave={(maxVideos, maxCommentsPerVideo) => {
					setConfig({ maxVideos, maxCommentsPerVideo });
					setScreen('chat');
				}}
				onCancel={() => setScreen('chat')}
				currentMaxVideos={cfg.maxVideos}
				currentMaxComments={cfg.maxCommentsPerVideo}
			/>
		);
	}
	
	if (screen === 'tools') {
		return <ToolsScreen onClose={() => setScreen('chat')} />;
	}
	
	// Chat
	return (
		<Box flexDirection="column" minHeight={0}>
			<Box flexGrow={1} minHeight={0}>
				<ChatTimeline messages={msgs} />
			</Box>
			
			{cmds && (
				<Box paddingX={2} paddingBottom={1}>
					<CommandSuggestions onSelect={selectCmd} />
				</Box>
			)}
			
			<Box flexShrink={0}>
				<ChatInput value={input} onChange={changeInput} onSubmit={submitMsg} disabled={busy} />
			</Box>
		</Box>
	);
}
