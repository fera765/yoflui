/**
 * Non-interactive mode for CLI - USANDO ORCHESTRATOR-V2
 * Usage: npm run start --prompt "Your question here"
 */

import { setConfig, getConfig } from './llm-config.js';
import { loadQwenCredentials } from './qwen-oauth.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CentralOrchestratorV2 } from './agi/orchestrator-v2.js';
import type { KanbanTask, FluiFeedback, ToolExecution } from './agi/types.js';

interface ConfigFile {
	endpoint: string;
	apiKey: string;
	model: string;
	maxVideos: number;
	maxCommentsPerVideo: number;
}

function loadConfig(): ConfigFile {
	try {
		const configPath = join(process.cwd(), 'config.json');
		const configData = readFileSync(configPath, 'utf-8');
		const config = JSON.parse(configData) as ConfigFile;
		
		console.log('\n[+] Loaded configuration:');
		console.log(`    Endpoint: ${config.endpoint}`);
		console.log(`    Model: ${config.model}`);
		console.log(`    Max Videos: ${config.maxVideos}`);
		console.log(`    Max Comments/Video: ${config.maxCommentsPerVideo}`);
		console.log('');
		
		return config;
	} catch (error) {
		// Try to load Qwen OAuth credentials
		const qwenCreds = loadQwenCredentials();
		if (qwenCreds?.access_token) {
			console.log('\n[+] Using Qwen OAuth credentials');
			console.log(`    Expires: ${new Date(qwenCreds.expiry_date || 0).toLocaleString()}`);
			console.log('');
			
			const resourceUrl = qwenCreds.resource_url || 'portal.qwen.ai';
			return {
				endpoint: `https://${resourceUrl}/v1`,
				apiKey: qwenCreds.access_token,
				model: 'qwen3-coder-plus',
				maxVideos: 7,
				maxCommentsPerVideo: 10,
			};
		}
		
		console.error('[!] Failed to load config.json and no Qwen credentials found');
		console.log('[*] Using default configuration...\n');
		
		return {
			endpoint: 'http://localhost:4000/v1',
			apiKey: '',
			model: 'gemini',
			maxVideos: 7,
			maxCommentsPerVideo: 10,
		};
	}
}

export async function runNonInteractive(prompt: string): Promise<void> {
	console.log('===========================================');
	console.log('[*] FLUI AGI - ORCHESTRATOR V2 MODE');
	console.log('===========================================\n');

	// Load and apply config
	const config = loadConfig();
	setConfig({
		endpoint: config.endpoint,
		apiKey: config.apiKey,
		model: config.model,
		maxVideos: config.maxVideos,
		maxCommentsPerVideo: config.maxCommentsPerVideo,
	});

	console.log('[>] User Task:');
	console.log(`    "${prompt}"\n`);

	console.log('[*] Initializing Orchestrator V2...\n');

	try {
		// FIX: workDir deve ser o root do projeto, não um subdiretório
		// Paths relativos do usuário (ex: work/arquivo.txt) serão resolvidos a partir daqui
		const workDir = process.cwd();
		let currentKanban: KanbanTask[] = [];
		
		// Criar instância do Orchestrator V2
		const orchestrator = new CentralOrchestratorV2();
		
		// Configurar callbacks
		orchestrator.setCallbacks({
			onFeedback: (feedback: FluiFeedback) => {
				console.log(`\n[FLUI] ${feedback.message}`);
			},
			onToolExecution: (tool: ToolExecution) => {
				console.log(`\n[>] TOOL: ${tool.name.toUpperCase()}`);
				if (tool.args) {
					const argsStr = JSON.stringify(tool.args).substring(0, 100);
					console.log(`    Args: ${argsStr}...`);
				}
				if (tool.status === 'complete') {
					console.log(`    [+] Success`);
				} else if (tool.status === 'error') {
					console.log(`    [x] Failed: ${tool.error || 'Unknown error'}`);
				}
			}
		});

		console.log('[✓] Orchestrator configured\n');
		console.log('[*] Starting orchestration...\n');

		// Executar orquestração
		const result = await orchestrator.orchestrate(
			prompt,
			workDir,
			(message: string, kanban?: KanbanTask[]) => {
				if (kanban) {
					// Update kanban state
					currentKanban = kanban;
					const received = kanban.filter(t => t.column === 'received').length;
					const planning = kanban.filter(t => t.column === 'planning').length;
					const queue = kanban.filter(t => t.column === 'execution_queue').length;
					const inProgress = kanban.filter(t => t.column === 'in_progress').length;
					const review = kanban.filter(t => t.column === 'review').length;
					const completed = kanban.filter(t => t.column === 'completed').length;
					const replanning = kanban.filter(t => t.column === 'replanning').length;
					const delivery = kanban.filter(t => t.column === 'delivery').length;
					
					console.log('\n[KANBAN UPDATE]');
					console.log(`    📥 Received: ${received} | 📋 Planning: ${planning} | 📦 Queue: ${queue}`);
					console.log(`    ⚡ In Progress: ${inProgress} | 🔍 Review: ${review} | ✔️  Completed: ${completed}`);
					if (replanning > 0) console.log(`    🔄 Replanning: ${replanning}`);
					if (delivery > 0) console.log(`    🚀 Delivery: ${delivery}`);
					console.log('');
				}
				if (message && message.trim()) {
					console.log(`    ${message}`);
				}
			}
		);

		console.log('\n===========================================');
		console.log('[+] FINAL RESULTS');
		console.log('===========================================\n');

		if (currentKanban.length > 0) {
			console.log('[TASK SUMMARY]');
			const completed = currentKanban.filter(t => t.column === 'completed' || t.column === 'delivery').length;
			const total = currentKanban.length;
			console.log(`    [+] Completed: ${completed}/${total} tasks\n`);
		}

		console.log('[AI RESPONSE]\n');
		console.log(result.result);
		console.log('\n');

		console.log(`[*] Execution Mode: ${result.mode.toUpperCase()}`);
		console.log(`[*] Work Directory: ${workDir}\n`);

		console.log('===========================================');
		console.log('[+] TASK COMPLETE');
		console.log('===========================================\n');

		process.exit(0);
	} catch (error) {
		console.error('\n[!] Error:');
		console.error(error);
		console.log('');
		process.exit(1);
	}
}
