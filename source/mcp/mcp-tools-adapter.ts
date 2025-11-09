import { mcpManager } from './mcp-manager.js';

export function getMCPToolDefinitions(): Array<{
	type: 'function';
	function: {
		name: string;
		description: string;
		parameters: any;
	};
}> {
	const mcpTools = mcpManager.getAllMCPTools();

	return mcpTools.map(tool => ({
		type: 'function' as const,
		function: {
			name: `mcp_${tool.mcpPackage.replace(/[^a-zA-Z0-9]/g, '_')}_${tool.toolName}`,
			description: `[MCP: ${tool.mcpPackage}] ${tool.description}`,
			parameters: {
				type: 'object',
				properties: tool.inputSchema.properties || {},
				required: tool.inputSchema.required || [],
			},
		},
	}));
}

export async function executeMCPTool(toolName: string, args: any): Promise<string> {
	if (!toolName.startsWith('mcp_')) {
		throw new Error('Not an MCP tool');
	}

	const parts = toolName.split('_');
	if (parts.length < 3) {
		throw new Error('Invalid MCP tool name format');
	}

	parts.shift();
	
	let mcpPackagePart = '';
	let actualToolName = '';
	
	for (let i = 0; i < parts.length; i++) {
		const testPackage = parts.slice(0, i + 1).join('_');
		const testTool = parts.slice(i + 1).join('_');
		
		const installedMCPs = mcpManager.getInstalledMCPs();
		const matchingMCP = installedMCPs.find(mcp => 
			mcp.packageName.replace(/[^a-zA-Z0-9]/g, '_') === testPackage
		);
		
		if (matchingMCP) {
			mcpPackagePart = matchingMCP.packageName;
			actualToolName = testTool;
			break;
		}
	}

	if (!mcpPackagePart || !actualToolName) {
		throw new Error(`Could not resolve MCP tool: ${toolName}`);
	}

	try {
		const result = await mcpManager.callMCPTool(mcpPackagePart, actualToolName, args);
		
		if (result.content && Array.isArray(result.content)) {
			return result.content.map((item: any) => {
				if (item.type === 'text') return item.text;
				if (item.type === 'image') return `[Image: ${item.data}]`;
				if (item.type === 'resource') return `[Resource: ${item.uri}]`;
				return JSON.stringify(item);
			}).join('\n');
		}

		return JSON.stringify(result, null, 2);
	} catch (error) {
		return `Error calling MCP tool: ${error instanceof Error ? error.message : 'Unknown error'}`;
	}
}

export function isMCPTool(toolName: string): boolean {
	return toolName.startsWith('mcp_');
}
