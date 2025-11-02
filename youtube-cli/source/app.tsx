import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, useInput, useStdout, Text } from 'ink';
import { ChatTimeline, ChatInput, type ChatMessage } from './components/ChatComponents.js';
import { CommandSuggestions } from './components/CommandSuggestions.js';
import { NewAuthScreen } from './components/NewAuthScreen.js';
import { ConfigScreen } from './components/ConfigScreen.js';
import { ToolsScreen } from './components/ToolsScreen.js';
import { getConfig, setConfig } from './llm-config.js';
import { runAutonomousAgent } from './autonomous-agent.js';
import { join } from 'path';

type Screen = 'chat' | 'auth' | 'config' | 'tools';

const MAX_MESSAGES_IN_MEMORY = 500;

let msgIdCounter = 0;
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${++msgIdCounter}`;

export default function App() {
	const [screen, setScreen] = useState<Screen>('chat');
	const [msgs, setMsgs] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState('');
	const [busy, setBusy] = useState(false);
	const [cmds, setCmds] = useState(false);
	const [scrollOffset, setScrollOffset] = useState(0);
	
	const { stdout } = useStdout();
	const cfg = getConfig();
	
	const terminalHeight = stdout?.rows || 24;
	const INPUT_HEIGHT = 4;
	const COMMANDS_HEIGHT = cmds ? 10 : 0;
	const SCROLL_INDICATOR_HEIGHT = 1;
	const availableHeight = Math.max(5, terminalHeight - INPUT_HEIGHT - COMMANDS_HEIGHT - SCROLL_INDICATOR_HEIGHT);
	
	useEffect(() => {
		setScrollOffset(0);
	}, [msgs.length]);
	
	useEffect(() => {
		setScrollOffset(0);
	}, [terminalHeight]);
	
	useInput((_, key) => {
		if (screen !== 'chat') return;
		
		if (key.escape) {
			setInput('');
			setCmds(false);
			return;
		}
		
		if (cmds) return;
		
		if (key.upArrow) {
			setScrollOffset(prev => {
				const maxOffset = Math.max(0, msgs.length - availableHeight);
				return Math.min(prev + 1, maxOffset);
			});
		} else if (key.downArrow) {
			setScrollOffset(prev => Math.max(0, prev - 1));
		} else if (key.pageUp) {
			setScrollOffset(prev => {
				const maxOffset = Math.max(0, msgs.length - availableHeight);
				return Math.min(prev + Math.floor(availableHeight / 2), maxOffset);
			});
		} else if (key.pageDown) {
			setScrollOffset(prev => Math.max(0, prev - Math.floor(availableHeight / 2)));
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
	
	const visibleMessages = useMemo(() => {
		if (msgs.length === 0) return [];
		
		if (msgs.length <= availableHeight) {
			return msgs;
		}
		
		const start = Math.max(0, msgs.length - availableHeight - scrollOffset);
		const end = msgs.length - scrollOffset;
		
		return msgs.slice(start, end);
	}, [msgs, availableHeight, scrollOffset]);
	
	const hasMoreAbove = msgs.length > availableHeight && scrollOffset < msgs.length - availableHeight;
	const hasMoreBelow = scrollOffset > 0;
	
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
	
	return (
		<Box flexDirection="column" height={terminalHeight}>
			<Box flexDirection="column" flexGrow={1} overflow="hidden">
				<ChatTimeline messages={visibleMessages} />
			</Box>
			
			{(hasMoreAbove || hasMoreBelow) && !cmds && (
				<Box justifyContent="center" paddingX={2}>
					{hasMoreAbove && hasMoreBelow && (
						<Text color="gray" dimColor>? Scroll para ver mais | {scrollOffset} ocultas abaixo ?</Text>
					)}
					{hasMoreAbove && !hasMoreBelow && (
						<Text color="gray" dimColor>? Scroll para cima para ver mais antigas</Text>
					)}
					{!hasMoreAbove && hasMoreBelow && (
						<Text color="yellow">? {scrollOffset} novas mensagens abaixo</Text>
					)}
				</Box>
			)}
			
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
