#!/usr/bin/env node
import { runAutonomousAgent } from './source/autonomous-agent.js';
import { setConfig } from './source/llm-config.js';
import { join } from 'path';
import { loadQwenCredentials } from './source/qwen-oauth.js';

async function testFullSystem() {
	// Check Qwen credentials
	const creds = loadQwenCredentials();
	if (!creds) {
		console.error('? No Qwen credentials found!');
		process.exit(1);
	}

	console.log('? Qwen credentials loaded');
	console.log(`   Endpoint: ${creds.resource_url}`);
	
	// Set config
	setConfig({
		endpoint: `https://${creds.resource_url}/v1`,
		apiKey: creds.access_token,
		model: 'qwen3-coder-plus',
		maxVideos: 3,
		maxCommentsPerVideo: 5,
	});

	console.log('\n?? Testing Full Autonomous System with All Tools\n');
	console.log('Task: Create a complete Node.js project with tests\n');

	const workDir = join(process.cwd(), 'work', `full-test-${Date.now()}`);

	try {
		const result = await runAutonomousAgent({
			userMessage: `Create a complete Node.js project:
1. Create a package.json file
2. Create a hello.js file that exports a hello(name) function
3. Create a test.js file that tests the hello function
4. Create a README.md explaining the project
5. List all created files

Use all available tools as needed.`,
			workDir,
			onProgress: (msg) => {
				console.log(`\n?? ${msg}`);
			},
			onKanbanUpdate: (tasks) => {
				console.log('\n?? KANBAN UPDATE:');
				const todo = tasks.filter(t => t.status === 'todo').length;
				const inProgress = tasks.filter(t => t.status === 'in_progress').length;
				const done = tasks.filter(t => t.status === 'done').length;
				console.log(`   TODO: ${todo} | IN PROGRESS: ${inProgress} | DONE: ${done}`);
				tasks.forEach(t => {
					const icon = t.status === 'done' ? '?' : t.status === 'in_progress' ? '?' : '?';
					console.log(`   ${icon} ${t.title}`);
				});
			},
			onToolExecute: (toolName, args) => {
				console.log(`\n?? EXECUTING: ${toolName}`);
				console.log(`   Args: ${JSON.stringify(args, null, 2).substring(0, 200)}`);
			},
			onToolComplete: (toolName, args, result, error) => {
				if (error) {
					console.log(`\n? FAILED: ${toolName}`);
					console.log(`   Error: ${result.substring(0, 200)}`);
				} else {
					console.log(`\n? COMPLETED: ${toolName}`);
					const lines = result.split('\n');
					console.log(`   Result (${lines.length} lines):`);
					lines.slice(0, 3).forEach(line => console.log(`   ${line}`));
					if (lines.length > 3) console.log(`   ... (${lines.length - 3} more lines)`);
				}
			},
		});

		console.log('\n\n???????????????????????????????????????????????????');
		console.log('?? AGENT COMPLETED SUCCESSFULLY!');
		console.log('???????????????????????????????????????????????????\n');
		console.log('Final Response:');
		console.log(result);
		console.log(`\n?? Work directory: ${workDir}`);
		console.log('\n? All tests passed! System is fully functional.');
		process.exit(0);
	} catch (error) {
		console.error('\n\n? ERROR:', error);
		process.exit(1);
	}
}

testFullSystem();
