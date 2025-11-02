import { mcpClient } from './mcp-client.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface InstalledMCP {
	packageName: string;
	installedAt: number;
	lastUsed: number;
}

interface MCPConfig {
	mcps: InstalledMCP[];
}

export class MCPManager {
	private configPath: string;
	private config: MCPConfig;
	private activeMCPs: Map<string, string> = new Map();

	constructor() {
		const configDir = join(homedir(), '.flui');
		this.configPath = join(configDir, 'mcp-config.json');
		this.config = this.loadConfig();
	}

	private loadConfig(): MCPConfig {
		if (existsSync(this.configPath)) {
			try {
				const data = readFileSync(this.configPath, 'utf-8');
				return JSON.parse(data);
			} catch (error) {
				console.error('Failed to load MCP config:', error);
			}
		}
		return { mcps: [] };
	}

	private saveConfig(): void {
		try {
			const configDir = join(homedir(), '.flui');
			if (!existsSync(configDir)) {
				require('fs').mkdirSync(configDir, { recursive: true });
			}
			writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
		} catch (error) {
			console.error('Failed to save MCP config:', error);
		}
	}

	async installMCP(packageName: string): Promise<{ success: boolean; error?: string; mcpId?: string }> {
		try {
			const cleanPackageName = packageName.trim();
			
			const existing = this.config.mcps.find(m => m.packageName === cleanPackageName);
			if (existing) {
				return { success: false, error: 'MCP already installed' };
			}

			const mcpId = await mcpClient.startMCPServer(cleanPackageName);

			const mcpInfo = mcpClient.getMCPInfo(mcpId);
			if (!mcpInfo || !mcpInfo.isReady) {
				mcpClient.stopMCPServer(mcpId);
				return { success: false, error: 'Failed to initialize MCP server' };
			}

			if (mcpInfo.tools.length === 0) {
				mcpClient.stopMCPServer(mcpId);
				return { success: false, error: 'MCP has no tools available' };
			}

			this.config.mcps.push({
				packageName: cleanPackageName,
				installedAt: Date.now(),
				lastUsed: Date.now(),
			});
			this.saveConfig();

			this.activeMCPs.set(cleanPackageName, mcpId);

			return { success: true, mcpId };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error during installation',
			};
		}
	}

	async uninstallMCP(packageName: string): Promise<{ success: boolean; error?: string }> {
		const index = this.config.mcps.findIndex(m => m.packageName === packageName);
		if (index === -1) {
			return { success: false, error: 'MCP not found' };
		}

		const mcpId = this.activeMCPs.get(packageName);
		if (mcpId) {
			mcpClient.stopMCPServer(mcpId);
			this.activeMCPs.delete(packageName);
		}

		this.config.mcps.splice(index, 1);
		this.saveConfig();

		return { success: true };
	}

	async startAllMCPs(): Promise<void> {
		for (const mcp of this.config.mcps) {
			try {
				const mcpId = await mcpClient.startMCPServer(mcp.packageName);
				this.activeMCPs.set(mcp.packageName, mcpId);
				mcp.lastUsed = Date.now();
			} catch (error) {
				console.error(`Failed to start MCP ${mcp.packageName}:`, error);
			}
		}
		this.saveConfig();
	}

	getInstalledMCPs(): Array<{
		packageName: string;
		installedAt: number;
		isActive: boolean;
		toolCount: number;
		serverInfo: any;
	}> {
		return this.config.mcps.map(mcp => {
			const mcpId = this.activeMCPs.get(mcp.packageName);
			const mcpInfo = mcpId ? mcpClient.getMCPInfo(mcpId) : null;

			return {
				packageName: mcp.packageName,
				installedAt: mcp.installedAt,
				isActive: mcpId !== undefined && mcpInfo?.isReady === true,
				toolCount: mcpInfo?.tools.length || 0,
				serverInfo: mcpInfo?.info || null,
			};
		});
	}

	getAllMCPTools(): Array<{
		mcpId: string;
		mcpPackage: string;
		toolName: string;
		description: string;
		inputSchema: any;
	}> {
		const allTools: Array<any> = [];

		for (const [packageName, mcpId] of this.activeMCPs) {
			const tools = mcpClient.getToolsForMCP(mcpId);
			for (const tool of tools) {
				allTools.push({
					mcpId,
					mcpPackage: packageName,
					toolName: tool.name,
					description: tool.description,
					inputSchema: tool.inputSchema,
				});
			}
		}

		return allTools;
	}

	getMCPIdForPackage(packageName: string): string | null {
		return this.activeMCPs.get(packageName) || null;
	}

	async callMCPTool(packageName: string, toolName: string, args: any): Promise<any> {
		const mcpId = this.activeMCPs.get(packageName);
		if (!mcpId) {
			throw new Error(`MCP ${packageName} is not active`);
		}

		return await mcpClient.callMCPTool(mcpId, toolName, args);
	}
}

export const mcpManager = new MCPManager();
