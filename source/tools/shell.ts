import { spawn, ChildProcess } from 'child_process';
import { validateShellCommand, getSafeWorkingDirectory } from '../security/security.js';

interface ActiveProcess {
	process: ChildProcess;
	command: string;
	startTime: number;
	logs: string;
	errorLogs: string;
	isRunning: boolean;
}

const activeProcesses = new Map<string, ActiveProcess>();
let processCounter = 0;

export const shellToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'execute_shell',
		description: 'Execute a shell command. Dangerous commands (rm -rf /, format, shutdown, etc.) and commands outside workspace are blocked. All commands execute within workspace root.',
		parameters: {
			type: 'object',
			properties: {
				command: { type: 'string', description: 'Shell command to execute' },
				timeout: { type: 'number', description: 'Optional timeout in milliseconds (default: 30000)' },
				interactive: { type: 'boolean', description: 'If true, keeps process alive for stdin input (default: false)' },
			},
			required: ['command'],
		},
	},
};

export const shellInputToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'shell_input',
		description: 'Send input (stdin) to a running interactive shell process',
		parameters: {
			type: 'object',
			properties: {
				processId: { type: 'string', description: 'Process ID returned by execute_shell' },
				input: { type: 'string', description: 'Input to send (e.g., "yes", "\\n" for enter, text)' },
			},
			required: ['processId', 'input'],
		},
	},
};

export const shellStatusToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'shell_status',
		description: 'Get current logs and status of a running shell process',
		parameters: {
			type: 'object',
			properties: {
				processId: { type: 'string', description: 'Process ID to check' },
			},
			required: ['processId'],
		},
	},
};

export async function executeShellTool(
	command: string,
	timeout: number = 30000,
	interactive: boolean = false
): Promise<string> {
	// Validate shell command
	const validation = validateShellCommand(command);
	if (!validation.valid) {
		return `Error: ${validation.error}`;
	}
	
	const processId = `shell-${++processCounter}-${Date.now()}`;
	const safeWorkingDir = getSafeWorkingDirectory();

	return new Promise((resolve, reject) => {
		const childProcess = spawn(command, {
			shell: true,
			stdio: ['pipe', 'pipe', 'pipe'],
			cwd: safeWorkingDir, // Always execute in workspace root
		});

		const processData: ActiveProcess = {
			process: childProcess,
			command,
			startTime: Date.now(),
			logs: '',
			errorLogs: '',
			isRunning: true,
		};

		activeProcesses.set(processId, processData);

		let timeoutHandle: NodeJS.Timeout | null = null;

		if (!interactive) {
			timeoutHandle = setTimeout(() => {
				if (processData.isRunning) {
					childProcess.kill('SIGTERM');
					setTimeout(() => {
						if (processData.isRunning) {
							childProcess.kill('SIGKILL');
						}
					}, 5000);
				}
			}, timeout);
		}

		childProcess.stdout?.on('data', (data: Buffer) => {
			const text = data.toString();
			processData.logs += text;
		});

		childProcess.stderr?.on('data', (data: Buffer) => {
			const text = data.toString();
			processData.errorLogs += text;
		});

		childProcess.on('error', (error) => {
			processData.isRunning = false;
			if (timeoutHandle) clearTimeout(timeoutHandle);
			activeProcesses.delete(processId);
			reject(new Error(`Process error: ${error.message}`));
		});

		childProcess.on('close', (code) => {
			processData.isRunning = false;
			if (timeoutHandle) clearTimeout(timeoutHandle);

			const output = processData.logs;
			const errors = processData.errorLogs;
			
			activeProcesses.delete(processId);

			if (code === 0) {
				resolve(output || 'Command completed successfully');
			} else {
				resolve(`Exit code ${code}\nOutput: ${output}\nErrors: ${errors}`);
			}
		});

		if (interactive) {
			setTimeout(() => {
				if (processData.isRunning) {
					const currentLogs = processData.logs + processData.errorLogs;
					resolve(
						`Interactive process started (ID: ${processId})\n` +
						`Use shell_input to send stdin, shell_status to check logs.\n\n` +
						`Current output:\n${currentLogs || '[No output yet]'}`
					);
				}
			}, 1000);
		}
	});
}

export async function executeShellInputTool(processId: string, input: string): Promise<string> {
	const processData = activeProcesses.get(processId);

	if (!processData) {
		return `Error: Process ${processId} not found or already terminated. Active processes: ${Array.from(activeProcesses.keys()).join(', ') || 'none'}`;
	}

	if (!processData.isRunning) {
		return `Error: Process ${processId} is no longer running`;
	}

	try {
		const stdin = processData.process.stdin;
		if (!stdin || stdin.destroyed) {
			return `Error: stdin not available for process ${processId}`;
		}

		stdin.write(input);
		if (!input.endsWith('\n')) {
			stdin.write('\n');
		}

		await new Promise(resolve => setTimeout(resolve, 500));

		const currentLogs = processData.logs + processData.errorLogs;
		return `Input sent to ${processId}\n\nCurrent output:\n${currentLogs}`;
	} catch (error: any) {
		return `Error sending input: ${error.message}`;
	}
}

export async function executeShellStatusTool(processId: string): Promise<string> {
	const processData = activeProcesses.get(processId);

	if (!processData) {
		return `Error: Process ${processId} not found. Active processes: ${Array.from(activeProcesses.keys()).join(', ') || 'none'}`;
	}

	const status = processData.isRunning ? 'RUNNING' : 'STOPPED';
	const duration = Date.now() - processData.startTime;
	const logs = processData.logs + processData.errorLogs;

	return (
		`Process: ${processId}\n` +
		`Status: ${status}\n` +
		`Command: ${processData.command}\n` +
		`Duration: ${Math.floor(duration / 1000)}s\n\n` +
		`Output:\n${logs || '[No output yet]'}`
	);
}

export function cleanupProcess(processId: string): void {
	const processData = activeProcesses.get(processId);
	if (processData && processData.isRunning) {
		processData.process.kill('SIGTERM');
		setTimeout(() => {
			if (processData.isRunning) {
				processData.process.kill('SIGKILL');
			}
		}, 5000);
	}
	activeProcesses.delete(processId);
}

export function cleanupAllProcesses(): void {
	for (const processId of activeProcesses.keys()) {
		cleanupProcess(processId);
	}
}

process.on('exit', cleanupAllProcesses);
process.on('SIGINT', cleanupAllProcesses);
process.on('SIGTERM', cleanupAllProcesses);
