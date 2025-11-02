import React, { useState, useCallback, useEffect } from 'react';
import { Box, useInput, useStdout } from 'ink';
import { ChatTimeline, ChatInput, type ChatMessage } from './components/ChatComponents.js';
import { CommandSuggestions } from './components/CommandSuggestions.js';
import { NewAuthScreen } from './components/NewAuthScreen.js';
import { ConfigScreen } from './components/ConfigScreen.js';
import { ToolsScreen } from './components/ToolsScreen.js';
import { MCPScreen } from './components/MCPScreen.js';
import { getConfig, setConfig } from './llm-config.js';
import { runAutonomousAgent } from './autonomous-agent.js';
import { mcpManager } from './mcp/mcp-manager.js';
import { join } from 'path';

type Screen = 'chat' | 'auth' | 'config' | 'tools' | 'mcp';

const MAX_MESSAGES_IN_MEMORY = 500;

let msgIdCounter = 0;
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${++msgIdCounter}`;

let mcpStarted = false;

export default function App() {
	const [screen, setScreen] = useState<Screen>('chat');
	const [msgs, setMsgs] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState('');
	const [busy, setBusy] = useState(false);
	const [cmds, setCmds] = useState(false);
	
	const { stdout } = useStdout();
	const cfg = getConfig();
	
	if (!mcpStarted) {
		mcpStarted = true;
		mcpManager.startAllMCPs().catch(() => {});
	}
	
	useInput((_, key) => {
		if (screen !== 'chat') return;
		
		if (key.escape) {
			setInput('');
			setCmds(false);
		}
	});
	
	const changeInput = useCallback((val: string) => {
		setInput(val);
		setCmds(val === '/');
	}, []);
	
	const selectCmd = useCallback((cmd: string) => {
		setInput('');
		setCmds(false);
		
		if (cmd === '/llm') setScreen('auth');
		else if (cmd === '/config') setScreen('config');
		else if (cmd === '/tools') setScreen('tools');
		else if (cmd === '/mcp') setScreen('mcp');
		else if (cmd === '/exit') process.exit(0);
	}, []);
	
	const addMessage = useCallback((msg: ChatMessage) => {
		setMsgs(prev => {
			const updated = [...prev, msg];
			if (updated.length > MAX_MESSAGES_IN_MEMORY) {
				return updated.slice(updated.length - MAX_MESSAGES_IN_MEMORY);
			}
			return updated;
		});
	}, []);
	
	const submitMsg = useCallback(async () => {
		if (!input.trim() || busy) return;
		
		const txt = input.trim();
		
		if (txt.startsWith('/') && txt.split(' ').length === 1) {
			selectCmd(txt);
			return;
		}
		
		setInput('');
		setCmds(false);
		
		const userMsgId = generateId('user');
		addMessage({ id: userMsgId, role: 'user', content: txt });
		
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
						const updated: ChatMessage[] = [...noKanban, {
							id: generateId('kanban'),
							role: 'kanban' as const,
							content: '',
							kanban: tasks
						}];
						if (updated.length > MAX_MESSAGES_IN_MEMORY) {
							return updated.slice(updated.length - MAX_MESSAGES_IN_MEMORY);
						}
						return updated;
					});
				},
				onToolExecute: (name, args) => {
					addMessage({
						id: generateId('tool'),
						role: 'tool',
						content: '',
						toolCall: { name, args, status: 'running' }
					});
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
			
			addMessage({
				id: generateId('assistant'),
				role: 'assistant',
				content: reply
			});
			
		} catch (err) {
			addMessage({
				id: generateId('error'),
				role: 'assistant',
				content: `Error: ${err instanceof Error ? err.message : String(err)}`
			});
		} finally {
			setBusy(false);
		}
	}, [input, busy, selectCmd, addMessage]);
	
	const onAuthComplete = useCallback((mode: 'custom' | 'qwen', endpoint: string, apiKey: string, model: string) => {
		setConfig({ endpoint, apiKey, model });
		setScreen('chat');
	}, []);
	
	const onConfigSave = useCallback((maxVideos: number, maxCommentsPerVideo: number) => {
		setConfig({ maxVideos, maxCommentsPerVideo });
		setScreen('chat');
	}, []);
	
	if (screen === 'auth') {
		return (
			<NewAuthScreen
				onComplete={onAuthComplete}
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
				onSave={onConfigSave}
				onCancel={() => setScreen('chat')}
				currentMaxVideos={cfg.maxVideos}
				currentMaxComments={cfg.maxCommentsPerVideo}
			/>
		);
	}
	
	if (screen === 'tools') {
		return <ToolsScreen onClose={() => setScreen('chat')} />;
	}
	
	if (screen === 'mcp') {
		return <MCPScreen onClose={() => setScreen('chat')} />;
	}
	
	return (
		<Box flexDirection="column">
			<Box flexDirection="column" flexGrow={1}>
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
