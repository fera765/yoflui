import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

interface MCPToolDefinition {
	name: string;
	description: string;
	inputSchema: {
		type: string;
		properties: Record<string, any>;
		required?: string[];
	};
}

interface MCPServerInfo {
	name: string;
	version: string;
	protocolVersion: string;
}

interface MCPProcess {
	id: string;
	packageName: string;
	process: ChildProcess;
	info: MCPServerInfo | null;
	tools: MCPToolDefinition[];
	isReady: boolean;
	messageId: number;
	pendingRequests: Map<number, { resolve: Function; reject: Function }>;
	buffer: string;
}

export class MCPClient extends EventEmitter {
	private mcpProcesses: Map<string, MCPProcess> = new Map();

	async startMCPServer(packageName: string): Promise<string> {
		const mcpId = `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		const command = packageName.startsWith('npx ') ? packageName.slice(4) : packageName;
		const args = command.split(' ');
		const mainCmd = args[0];
		const cmdArgs = args.slice(1);

		const cleanEnv = { ...process.env };
		delete cleanEnv.npm_config_version_commit_hooks;
		delete cleanEnv.npm_config_version_tag_prefix;
		delete cleanEnv.npm_config_version_git_message;
		delete cleanEnv.npm_config_argv;
		delete cleanEnv.npm_config_version_git_tag;

		const childProcess = spawn('npx', ['-y', mainCmd, ...cmdArgs], {
			stdio: ['pipe', 'pipe', 'pipe'],
			env: { ...cleanEnv, NODE_ENV: 'production' },
		});

		const mcpProcess: MCPProcess = {
			id: mcpId,
			packageName: command,
			process: childProcess,
			info: null,
			tools: [],
			isReady: false,
			messageId: 0,
			pendingRequests: new Map(),
			buffer: '',
		};

		this.mcpProcesses.set(mcpId, mcpProcess);

		childProcess.stdout?.on('data', (data: Buffer) => {
			this.handleMCPOutput(mcpId, data);
		});

	childProcess.stderr?.on('data', (data: Buffer) => {
		const text = data.toString();
		if (!text.includes('npm warn') && !text.includes('npm notice')) {
			console.error(`[MCP ${mcpId}] stderr:`, text);
		}
	});

		childProcess.on('error', (error) => {
			console.error(`[MCP ${mcpId}] Process error:`, error);
			this.emit('error', { mcpId, error });
		});

		childProcess.on('close', (code) => {
			console.log(`[MCP ${mcpId}] Process closed with code ${code}`);
			this.mcpProcesses.delete(mcpId);
			this.emit('close', { mcpId, code });
		});

		try {
			await this.initializeMCP(mcpId);
			await this.discoverTools(mcpId);
			return mcpId;
		} catch (error) {
			this.stopMCPServer(mcpId);
			throw error;
		}
	}

	private handleMCPOutput(mcpId: string, data: Buffer): void {
		const mcpProcess = this.mcpProcesses.get(mcpId);
		if (!mcpProcess) return;

		mcpProcess.buffer += data.toString();

		const lines = mcpProcess.buffer.split('\n');
		mcpProcess.buffer = lines.pop() || '';

		for (const line of lines) {
			if (!line.trim()) continue;

			try {
				const message = JSON.parse(line);
				this.handleMCPMessage(mcpId, message);
			} catch (error) {
				console.error(`[MCP ${mcpId}] Failed to parse message:`, line);
			}
		}
	}

	private handleMCPMessage(mcpId: string, message: any): void {
		const mcpProcess = this.mcpProcesses.get(mcpId);
		if (!mcpProcess) return;

		if (message.id !== undefined && mcpProcess.pendingRequests.has(message.id)) {
			const { resolve, reject } = mcpProcess.pendingRequests.get(message.id)!;
			mcpProcess.pendingRequests.delete(message.id);

			if (message.error) {
				reject(new Error(message.error.message || 'MCP request failed'));
			} else {
				resolve(message.result);
			}
		}
	}

	private async sendMCPRequest(mcpId: string, method: string, params?: any): Promise<any> {
		const mcpProcess = this.mcpProcesses.get(mcpId);
		if (!mcpProcess) {
			throw new Error(`MCP process ${mcpId} not found`);
		}

		const messageId = ++mcpProcess.messageId;
		const request = {
			jsonrpc: '2.0',
			id: messageId,
			method,
			params: params || {},
		};

		return new Promise((resolve, reject) => {
			mcpProcess.pendingRequests.set(messageId, { resolve, reject });

			const requestStr = JSON.stringify(request) + '\n';
			mcpProcess.process.stdin?.write(requestStr);

			const timeoutMs = method === 'initialize' ? 30000 : 15000;
			setTimeout(() => {
				if (mcpProcess.pendingRequests.has(messageId)) {
					mcpProcess.pendingRequests.delete(messageId);
					reject(new Error(`MCP request timeout: ${method}`));
				}
			}, timeoutMs);
		});
	}

	private async initializeMCP(mcpId: string): Promise<void> {
		await new Promise(resolve => setTimeout(resolve, 2000));

		try {
			const result = await this.sendMCPRequest(mcpId, 'initialize', {
				protocolVersion: '2024-11-05',
				capabilities: {
					tools: {},
				},
				clientInfo: {
					name: 'flui-cli',
					version: '1.0.0',
				},
			});

			const mcpProcess = this.mcpProcesses.get(mcpId);
			if (mcpProcess) {
				mcpProcess.info = {
					name: result.serverInfo?.name || 'Unknown',
					version: result.serverInfo?.version || '0.0.0',
					protocolVersion: result.protocolVersion || '2024-11-05',
				};
				mcpProcess.isReady = true;
			}

			try {
				await this.sendMCPRequest(mcpId, 'notifications/initialized', {});
			} catch (notifError) {
				console.log(`[MCP ${mcpId}] Initialized notification not supported, continuing...`);
			}
		} catch (error) {
			throw new Error(`Failed to initialize MCP: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private async discoverTools(mcpId: string): Promise<void> {
		try {
			const result = await this.sendMCPRequest(mcpId, 'tools/list');

			const mcpProcess = this.mcpProcesses.get(mcpId);
			if (mcpProcess && result.tools) {
				mcpProcess.tools = result.tools.map((tool: any) => ({
					name: tool.name,
					description: tool.description || '',
					inputSchema: tool.inputSchema || { type: 'object', properties: {} },
				}));
			}
		} catch (error) {
			console.error(`[MCP ${mcpId}] Failed to discover tools:`, error);
			throw error;
		}
	}

	async callMCPTool(mcpId: string, toolName: string, args: any): Promise<any> {
		try {
			const result = await this.sendMCPRequest(mcpId, 'tools/call', {
				name: toolName,
				arguments: args,
			});

			return result;
		} catch (error) {
			throw new Error(`MCP tool call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	getMCPInfo(mcpId: string): MCPProcess | null {
		return this.mcpProcesses.get(mcpId) || null;
	}

	getAllMCPs(): Array<{ id: string; packageName: string; info: MCPServerInfo | null; toolCount: number; isReady: boolean }> {
		return Array.from(this.mcpProcesses.values()).map(mcp => ({
			id: mcp.id,
			packageName: mcp.packageName,
			info: mcp.info,
			toolCount: mcp.tools.length,
			isReady: mcp.isReady,
		}));
	}

	getToolsForMCP(mcpId: string): MCPToolDefinition[] {
		const mcp = this.mcpProcesses.get(mcpId);
		return mcp ? mcp.tools : [];
	}

	stopMCPServer(mcpId: string): void {
		const mcpProcess = this.mcpProcesses.get(mcpId);
		if (mcpProcess) {
			mcpProcess.process.kill('SIGTERM');
			setTimeout(() => {
				if (mcpProcess.process.killed === false) {
					mcpProcess.process.kill('SIGKILL');
				}
			}, 5000);
			this.mcpProcesses.delete(mcpId);
		}
	}

	stopAllMCPs(): void {
		for (const mcpId of this.mcpProcesses.keys()) {
			this.stopMCPServer(mcpId);
		}
	}
}

export const mcpClient = new MCPClient();

process.on('exit', () => mcpClient.stopAllMCPs());
process.on('SIGINT', () => mcpClient.stopAllMCPs());
process.on('SIGTERM', () => mcpClient.stopAllMCPs());
