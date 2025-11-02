import { spawn } from 'child_process';

console.log('=== Testing MCP @pinkpixel/mcpollinations ===\n');

const mcpProcess = spawn('npx', ['-y', '@pinkpixel/mcpollinations'], {
	stdio: ['pipe', 'pipe', 'pipe'],
});

let buffer = '';
let messageId = 0;

mcpProcess.stdout.on('data', (data) => {
	buffer += data.toString();
	const lines = buffer.split('\n');
	buffer = lines.pop() || '';

	for (const line of lines) {
		if (!line.trim()) continue;
		try {
			const msg = JSON.parse(line);
			console.log('Received:', JSON.stringify(msg, null, 2));
		} catch (e) {
			console.log('Raw output:', line);
		}
	}
});

mcpProcess.stderr.on('data', (data) => {
	console.error('stderr:', data.toString());
});

function sendRequest(method, params = {}) {
	const request = {
		jsonrpc: '2.0',
		id: ++messageId,
		method,
		params,
	};
	console.log('\nSending:', JSON.stringify(request, null, 2));
	mcpProcess.stdin.write(JSON.stringify(request) + '\n');
}

setTimeout(() => {
	console.log('\n1. Initializing MCP...');
	sendRequest('initialize', {
		protocolVersion: '2024-11-05',
		capabilities: { tools: {} },
		clientInfo: { name: 'flui-test', version: '1.0.0' },
	});
}, 1000);

setTimeout(() => {
	console.log('\n2. Sending initialized notification...');
	sendRequest('initialized');
}, 2000);

setTimeout(() => {
	console.log('\n3. Listing tools...');
	sendRequest('tools/list');
}, 3000);

setTimeout(() => {
	console.log('\n? Test complete. Check output above.');
	mcpProcess.kill();
	process.exit(0);
}, 5000);

mcpProcess.on('error', (error) => {
	console.error('Process error:', error);
	process.exit(1);
});
