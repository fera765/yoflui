import { runAutonomousAgent } from './source/autonomous-agent.js';
import { setConfig } from './source/llm-config.js';
import { join } from 'path';

async function testAutonomous() {
	// Set config
	setConfig({
		endpoint: 'http://localhost:4000/v1',
		apiKey: '',
		model: 'gemini',
		maxVideos: 7,
		maxCommentsPerVideo: 10,
	});

	console.log('?? Testing Autonomous Agent with Tools...\n');

	const workDir = join(process.cwd(), 'work', `test-${Date.now()}`);

	try {
		const result = await runAutonomousAgent({
			userMessage: 'Create a simple hello world Node.js script in hello.js',
			workDir,
			onProgress: (msg) => {
				console.log(`   ${msg}`);
			},
		});

		console.log('\n? Agent Result:');
		console.log(result);
		console.log(`\n?? Work directory: ${workDir}`);
	} catch (error) {
		console.error('\n? Error:', error);
		process.exit(1);
	}
}

testAutonomous();
