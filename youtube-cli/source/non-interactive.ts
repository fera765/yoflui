/**
 * Non-interactive mode for CLI
 * Usage: npm run start --prompt "Your question here"
 */

import { setConfig, getConfig } from './llm-config.js';
import { runAutonomousAgent } from './autonomous-agent.js';
import { loadQwenCredentials } from './qwen-oauth.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { KanbanTask } from './tools/kanban.js';

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
	console.log('[*] AUTONOMOUS AI AGENT - NON-INTERACTIVE');
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

	console.log('[*] Processing...\n');

	try {
		const workDir = join(process.cwd(), 'work', `task-${Date.now()}`);
		let currentKanban: KanbanTask[] = [];
		
		const response = await runAutonomousAgent({
			userMessage: prompt,
			workDir,
			onProgress: (message) => {
				console.log(`    ${message}`);
			},
			onKanbanUpdate: (tasks) => {
				currentKanban = tasks;
				console.log('\n[TASK BOARD UPDATE]');
				const todo = tasks.filter(t => t.status === 'todo').length;
				const inProgress = tasks.filter(t => t.status === 'in_progress').length;
				const done = tasks.filter(t => t.status === 'done').length;
				console.log(`    o Pending: ${todo} | o In Progress: ${inProgress} | + Done: ${done}`);
				console.log('');
			},
			onToolExecute: (toolName, args) => {
				console.log(`\n[>] TOOL: ${toolName.toUpperCase()}`);
				console.log(`    Args: ${JSON.stringify(args).substring(0, 100)}...`);
			},
			onToolComplete: (toolName, args, result, error) => {
				if (error) {
					console.log(`    [x] Error: ${result.substring(0, 100)}`);
				} else {
					console.log(`    [+] Success`);
				}
			},
		});

		console.log('\n===========================================');
		console.log('[+] FINAL RESULTS');
		console.log('===========================================\n');

		if (currentKanban.length > 0) {
			console.log('[TASK SUMMARY]');
			const done = currentKanban.filter(t => t.status === 'done').length;
			const total = currentKanban.length;
			console.log(`    [+] Completed: ${done}/${total} tasks\n`);
		}

		console.log('[AI RESPONSE]\n');
		console.log(response);
		console.log('\n');

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
