import React, { useState, useCallback, useEffect } from 'react';
import { Box, useInput, useStdout } from 'ink';
import { ChatTimeline, type ChatMessage } from './components/ChatComponents.js';
import { ChatInput } from './input/index.js';
import { KeypressProvider } from './input/index.js';
import { CommandSuggestions } from './components/CommandSuggestions.js';
import { AutomationSelector } from './components/AutomationSelector.js';
import { formatAutomationStart, formatWebhookSetup, formatWebhookTriggered } from './prompts/prompt-loader.js';
import { NewAuthScreen } from './components/NewAuthScreen.js';
import { ConfigScreen } from './components/ConfigScreen.js';
import { ToolsScreen } from './components/ToolsScreen.js';
import { MCPScreen } from './components/MCPScreen.js';
import { getConfig, setConfig } from './llm-config.js';
import { runAutonomousAgent } from './autonomous-agent.js';
import { mcpManager } from './mcp/mcp-manager.js';
import { automationManager } from './automation/automation-manager.js';
import { webhookAPI } from './webhook-api.js';
import { webhookTriggerHandler } from './webhook-trigger-handler.js';
import { LLMAutomationCoordinator } from './llm-automation-coordinator.js';
import { ExecutionContext } from './utils/execution-context.js';
import { logger } from './utils/logger.js';
import { join } from 'path';

type Screen = 'chat' | 'auth' | 'config' | 'tools' | 'mcp';

const MAX_MESSAGES_IN_MEMORY = 500;

let msgIdCounter = 0;
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${++msgIdCounter}`;

let mcpStarted = false;
let automationInitialized = false;
let webhookApiStarted = false;
let llmCoordinator: LLMAutomationCoordinator | null = null;

export default function App() {
	const [screen, setScreen] = useState<Screen>('chat');
	const [msgs, setMsgs] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState('');
	const [busy, setBusy] = useState(false);
	const [cmds, setCmds] = useState(false);
	const [showAutomations, setShowAutomations] = useState(false);
	const [apiConnected, setApiConnected] = useState(false);
	
	const { stdout } = useStdout();
	const cfg = getConfig();
	
	if (!mcpStarted) {
		mcpStarted = true;
		mcpManager.startAllMCPs().catch(() => {});
	}
	
	if (!automationInitialized) {
		automationInitialized = true;
		automationManager.initialize();
	}
	
	if (!webhookApiStarted) {
		webhookApiStarted = true;
		webhookAPI.start().then(() => {
			setApiConnected(true);
		}).catch(() => {
			setApiConnected(false);
		});
	}
	
	useInput((_, key) => {
		if (screen !== 'chat') return;
		
		if (key.escape) {
			setInput('');
			setCmds(false);
			setShowAutomations(false);
		}
		
		// Prevent Enter from submitting when selector is open
		if (key.return && (showAutomations || cmds)) {
			// Let the selector handle it, don't submit
			return;
		}
	});
	
	const changeInput = useCallback((val: string) => {
		setInput(val);
		setCmds(val === '/');
		setShowAutomations(val === '@');
		
		// If user clears to just "@", don't let it submit as a message
		if (val === '@') {
			// Keep showing automations, don't submit
			return;
		}
	}, []);
	
	const selectCmd = useCallback((cmd: string) => {
		setInput('');
		setCmds(false);
		
		if (cmd === '/llm') setScreen('auth');
		else if (cmd === '/config') setScreen('config');
		else if (cmd === '/tools') setScreen('tools');
		else if (cmd === '/mcp') setScreen('mcp');
		else if (cmd === '/clear-memory') {
			// Clear all messages, context, and .flui files
			setMsgs([]);
			llmCoordinator = null;
			msgIdCounter = 0;
			
			// Clear .flui directory and files
			try {
				const { rmSync, existsSync } = require('fs');
				const { join } = require('path');
				const cwd = process.cwd();
				const fluiDir = join(cwd, '.flui');
				const fluiMemory = join(cwd, '.flui-memory.json');
				const fluiHistory = join(cwd, '.flui-history.json');
				
				// Remove .flui directory
				if (existsSync(fluiDir)) {
					rmSync(fluiDir, { recursive: true, force: true });
				}
				
				// Remove .flui-memory.json
				if (existsSync(fluiMemory)) {
					rmSync(fluiMemory, { force: true });
				}
				
				// Remove .flui-history.json
				if (existsSync(fluiHistory)) {
					rmSync(fluiHistory, { force: true });
				}
			} catch (err) {
				// Silent fail - just continue
			}
		}
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
	
	const executeLLMCoordinatedAutomation = useCallback(async (
		automation: any, 
		workDir: string, 
		webhookData?: any
	) => {
		setBusy(true);
		
		// Create execution context for deduplication
		const execContext = new ExecutionContext(automation.id, {
			automationName: automation.metadata.name,
			workDir,
			hasWebhookData: !!webhookData,
		});
		
		// Single initial message
		addMessage({
			id: generateId('assistant'),
			role: 'assistant',
			content: `?? Executing automation: ${automation.metadata.name}...\n${automation.metadata.description}`
		});
		
		// Create new LLM coordinator with context
		llmCoordinator = new LLMAutomationCoordinator(execContext);
		
		const result = await llmCoordinator.executeAutomation({
			automation,
			workDir,
			webhookData,
			// Only onProgress callback - no duplicates
			onProgress: (message) => {
				if (message && message.trim()) {
					// Check if should emit (deduplication)
					const messageKey = message.substring(0, 100);
					if (execContext.shouldEmitMessage(messageKey)) {
						addMessage({
							id: generateId('assistant'),
							role: 'assistant',
							content: message
						});
					}
				}
			}
		});
		
		// Single final message (result already emitted via onProgress)
		const summary = execContext.getSummary();
		addMessage({
			id: generateId('assistant'),
			role: 'assistant',
			content: `? Automation completed in ${Math.round(summary.duration / 1000)}s`
		});
		
		setBusy(false);
	}, [addMessage]);
	
	const selectAutomation = useCallback(async (automationItem: any) => {
		// CRITICAL: Clear input and hide selector IMMEDIATELY to prevent "@" from being submitted
		setInput('');
		setShowAutomations(false);
		setCmds(false);
		
		const automation = automationManager.getAutomationById(automationItem.id);
		if (!automation) {
			addMessage({
				id: generateId('error'),
				role: 'assistant',
				content: `? Automation not found: ${automationItem.id}`
			});
			return;
		}
		
		// Add user message (automation selection)
		const userMsgId = generateId('user');
		addMessage({ id: userMsgId, role: 'user', content: `@${automationItem.name}` });
		
		try {
			const workDir = join(process.cwd(), 'work', `automation-${Date.now()}`);
			
			// Check if this is a webhook automation
			if (webhookTriggerHandler.hasWebhookConfig(automation)) {
				// For webhook: ONLY setup, DO NOT execute yet
				addMessage({
					id: generateId('assistant'),
					role: 'assistant',
					content: `?? Setting up webhook for: ${automation.metadata.name}`
				});
				
				const webhookInfo = await webhookTriggerHandler.setupWebhook(
					automation as any,
					async (webhookData) => {
						// Wait if busy
						if (busy) {
							addMessage({
								id: generateId('assistant'),
								role: 'assistant',
								content: `? Webhook received. Waiting for current operation...`
							});
							const waitInterval = setInterval(() => {
								if (!busy) {
									clearInterval(waitInterval);
									executeWebhook();
								}
							}, 500);
						} else {
							executeWebhook();
						}
						
						async function executeWebhook() {
							addMessage({
								id: generateId('assistant'),
								role: 'assistant',
								content: `? Webhook triggered for: ${automation.metadata.name}`
							});
							await executeLLMCoordinatedAutomation(automation, workDir, webhookData);
						}
					}
				);
				
				addMessage({
					id: generateId('assistant'),
					role: 'assistant',
					content: webhookInfo.message
				});
				// User can continue chatting - NOT busy
			} else {
				// Non-webhook: execute immediately
				setBusy(true);
				await executeLLMCoordinatedAutomation(automation, workDir);
			}
		} catch (err) {
			addMessage({
				id: generateId('error'),
				role: 'assistant',
				content: `Error: ${err instanceof Error ? err.message : String(err)}`
			});
			setBusy(false);
		}
	}, [addMessage, executeLLMCoordinatedAutomation, busy]);

	
	const submitMsg = useCallback(async () => {
		// Don't submit if selector is open
		if (showAutomations || cmds) {
			return;
		}
		
		if (!input.trim() || busy) return;
		
		const txt = input.trim();
		
		// Don't submit lone "@" or "/"
		if (txt === '@' || txt === '/') {
			return;
		}
		
		if (txt.startsWith('/') && txt.split(' ').length === 1) {
			selectCmd(txt);
			return;
		}
		
		setInput('');
		setCmds(false);
		setShowAutomations(false);
		
		const userMsgId = generateId('user');
		addMessage({ id: userMsgId, role: 'user', content: txt });
		
		setBusy(true);
		
		try {
			const workDir = join(process.cwd(), 'work', `task-${Date.now()}`);
			
			// If LLM coordinator exists (from previous automation), continue conversation
			if (llmCoordinator) {
				const reply = await llmCoordinator.continueConversation(txt, workDir);
				
				addMessage({
					id: generateId('assistant'),
					role: 'assistant',
					content: reply
				});
				
				setBusy(false);
				return;
			}
			
			// Check if message matches an automation trigger
			const automation = automationManager.findAutomation(txt);
			
			if (automation) {
				// Check if it's a webhook automation
				if (webhookTriggerHandler.hasWebhookConfig(automation)) {
					// Webhook: Setup only, do NOT execute
					addMessage({
						id: generateId('assistant'),
						role: 'assistant',
						content: `?? Setting up webhook for: ${automation.metadata.name}`
					});
					
					const webhookInfo = await webhookTriggerHandler.setupWebhook(
						automation as any,
						async (webhookData) => {
							// Wait if busy
							if (busy) {
								addMessage({
									id: generateId('assistant'),
									role: 'assistant',
									content: `? Webhook received. Waiting...`
								});
								const waitInterval = setInterval(() => {
									if (!busy) {
										clearInterval(waitInterval);
										executeWebhook();
									}
								}, 500);
							} else {
								executeWebhook();
							}
							
							async function executeWebhook() {
								addMessage({
									id: generateId('assistant'),
									role: 'assistant',
									content: `? Webhook triggered for: ${automation.metadata.name}`
								});
								await executeLLMCoordinatedAutomation(automation, workDir, webhookData);
							}
						}
					);
					
					addMessage({
						id: generateId('assistant'),
						role: 'assistant',
						content: webhookInfo.message
					});
					
					setBusy(false);
					return;
				} else {
					// Non-webhook: Execute immediately
					await executeLLMCoordinatedAutomation(automation, workDir);
					setBusy(false);
					return;
				}
			}
			
			// Normal flow (LLM)
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
	}, [input, busy, selectCmd, addMessage, executeLLMCoordinatedAutomation]);
	
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
		<KeypressProvider>
			<Box flexDirection="column">
				<Box flexDirection="column" flexGrow={1}>
					<ChatTimeline messages={msgs} />
				</Box>
				
				{cmds && (
					<Box paddingX={2} paddingBottom={1}>
						<CommandSuggestions onSelect={selectCmd} />
					</Box>
				)}
				
				{showAutomations && (
					<Box paddingX={2} paddingBottom={1}>
						<AutomationSelector
							automations={automationManager.listAutomations().map(a => ({
								id: a.id,
								name: a.name,
								description: a.description,
								category: a.category
							}))}
							onSelect={selectAutomation}
							apiConnected={apiConnected}
						/>
					</Box>
				)}
				
				<Box flexShrink={0}>
					<ChatInput 
						value={input} 
						onChange={changeInput} 
						onSubmit={submitMsg} 
						disabled={busy}
						preventSubmit={() => showAutomations || cmds}
					/>
				</Box>
			</Box>
		</KeypressProvider>
	);
}
