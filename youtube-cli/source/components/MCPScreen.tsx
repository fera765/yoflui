import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { mcpManager } from '../mcp/mcp-manager.js';

interface MCPScreenProps {
	onClose: () => void;
}

export const MCPScreen: React.FC<MCPScreenProps> = ({ onClose }) => {
	const [mcps, setMcps] = useState<Array<any>>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [mode, setMode] = useState<'list' | 'install'>('list');
	const [packageName, setPackageName] = useState('');
	const [installing, setInstalling] = useState(false);
	const [message, setMessage] = useState('');

	useEffect(() => {
		loadMCPs();
	}, []);

	const loadMCPs = () => {
		const installed = mcpManager.getInstalledMCPs();
		setMcps(installed);
	};

	useInput((input, key) => {
		if (key.escape) {
			if (mode === 'install') {
				setMode('list');
				setPackageName('');
				setMessage('');
			} else {
				onClose();
			}
			return;
		}

		if (mode === 'list') {
			if (key.upArrow) {
				setSelectedIndex(prev => Math.max(0, prev - 1));
			} else if (key.downArrow) {
				setSelectedIndex(prev => Math.min(mcps.length, prev + 1));
			} else if (key.return) {
				if (selectedIndex === mcps.length) {
					setMode('install');
				} else {
					handleUninstall(mcps[selectedIndex].packageName);
				}
			}
		}
	});

	const handleInstall = async () => {
		if (!packageName.trim() || installing) return;

		setInstalling(true);
		setMessage('Installing MCP...');

		try {
			const result = await mcpManager.installMCP(packageName);
			
			if (result.success) {
				setMessage(`? MCP installed successfully!`);
				loadMCPs();
				setTimeout(() => {
					setMode('list');
					setPackageName('');
					setMessage('');
				}, 2000);
			} else {
				setMessage(`? Error: ${result.error}`);
			}
		} catch (error) {
			setMessage(`? Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			setInstalling(false);
		}
	};

	const handleUninstall = async (pkg: string) => {
		const result = await mcpManager.uninstallMCP(pkg);
		if (result.success) {
			setMessage(`? MCP ${pkg} uninstalled`);
			loadMCPs();
			setTimeout(() => setMessage(''), 2000);
		} else {
			setMessage(`? Error: ${result.error}`);
		}
	};

	if (mode === 'install') {
		return (
			<Box flexDirection="column" padding={2}>
				<Box marginBottom={1}>
					<Text color="cyan" bold>[MCP INSTALL]</Text>
				</Box>

				<Box marginBottom={1}>
					<Text color="gray">Enter package name (with or without npx):</Text>
				</Box>

				<Box marginBottom={1} borderStyle="round" borderColor="cyan" paddingX={1}>
					<Text color="magenta">&gt; </Text>
					<TextInput
						value={packageName}
						onChange={setPackageName}
						onSubmit={handleInstall}
						placeholder="e.g., @pinkpixel/mcpollinations"
					/>
				</Box>

				{message && (
					<Box marginBottom={1}>
						<Text color={message.startsWith('?') ? 'green' : message.startsWith('?') ? 'red' : 'yellow'}>
							{message}
						</Text>
					</Box>
				)}

				{installing && (
					<Box>
						<Text color="yellow">Installing... This may take a moment.</Text>
					</Box>
				)}

				<Box marginTop={1}>
					<Text color="gray" dimColor>Press ESC to cancel | Enter to install</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" padding={2}>
			<Box marginBottom={2}>
				<Text color="cyan" bold>[MCP MANAGER]</Text>
				<Text color="gray"> - Installed: {mcps.length}</Text>
			</Box>

			{mcps.length === 0 ? (
				<Box marginBottom={2}>
					<Text color="gray">No MCPs installed yet.</Text>
				</Box>
			) : (
				<Box flexDirection="column" marginBottom={2}>
					{mcps.map((mcp, index) => (
						<Box key={mcp.packageName} marginY={0}>
							<Text color={index === selectedIndex ? 'cyan' : 'white'} bold={index === selectedIndex}>
								{index === selectedIndex ? '> ' : '  '}
								{mcp.packageName}
							</Text>
							<Text color={mcp.isActive ? 'green' : 'red'}> [{mcp.isActive ? 'ACTIVE' : 'STOPPED'}]</Text>
							<Text color="yellow"> {mcp.toolCount} tools</Text>
							{mcp.serverInfo && (
								<Text color="gray"> - {mcp.serverInfo.name} v{mcp.serverInfo.version}</Text>
							)}
						</Box>
					))}
				</Box>
			)}

			<Box marginBottom={1} borderStyle="round" borderColor={selectedIndex === mcps.length ? 'cyan' : 'gray'} paddingX={2} paddingY={1}>
				<Text color={selectedIndex === mcps.length ? 'cyan' : 'green'} bold={selectedIndex === mcps.length}>
					{selectedIndex === mcps.length ? '> ' : '  '}
					[+ Install New MCP]
				</Text>
			</Box>

			{message && (
				<Box marginBottom={1}>
					<Text color={message.startsWith('?') ? 'green' : 'red'}>{message}</Text>
				</Box>
			)}

			<Box marginTop={1}>
				<Text color="gray" dimColor>
					Use ⬆️⬇️ to navigate | Enter to select | ESC to close
					{mcps.length > 0 && selectedIndex < mcps.length && ' | Enter on MCP to uninstall'}
				</Text>
			</Box>
		</Box>
	);
};
