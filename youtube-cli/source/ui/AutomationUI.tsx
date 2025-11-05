/**
 * AutomationUI - UI Elegante para Execução de Automações
 * Designer 100% novo, sem herdar código antigo
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface AutomationUIProps {
	automationName: string;
	description: string;
	status: 'running' | 'complete' | 'error';
	duration?: number;
	currentStep?: string;
	llmMessages: Array<{
		timestamp: number;
		content: string;
		type: 'thinking' | 'response';
	}>;
	toolExecutions: Array<{
		name: string;
		status: 'running' | 'complete' | 'error';
		result?: string;
		startTime: number;
		endTime?: number;
	}>;
}

const TOOL_ICONS: Record<string, string> = {
	find_files: '🔍',
	write_file: '📝',
	read_file: '📖',
	execute_shell: '🔧',
	web_scraper: '🌐',
	default: '⚙️'
};

const getIcon = (name: string) => {
	const key = Object.keys(TOOL_ICONS).find(k => name.includes(k));
	return key ? TOOL_ICONS[key] : TOOL_ICONS.default;
};

const formatDuration = (ms: number) => {
	const s = ms / 1000;
	return s < 1 ? `${Math.round(ms)}ms` : `${s.toFixed(1)}s`;
};

export const AutomationUI: React.FC<AutomationUIProps> = ({
	automationName,
	description,
	status,
	duration,
	currentStep,
	llmMessages,
	toolExecutions
}) => {
	const [frame, setFrame] = useState(0);
	
	useEffect(() => {
		if (status === 'running') {
			const interval = setInterval(() => {
				setFrame(prev => (prev + 1) % 4);
			}, 200);
			return () => clearInterval(interval);
		}
	}, [status]);

	const borderColor = status === 'complete' ? 'green' : status === 'error' ? 'red' : 'yellow';
	const statusIcon = status === 'complete' ? '✅' : status === 'error' ? '❌' : '⚙️';
	
	// Últimas 3 mensagens da LLM
	const recentLLM = llmMessages.slice(-3);
	
	// Últimas 5 tools
	const recentTools = toolExecutions.slice(-5);

	return (
		<Box flexDirection="column" marginY={1}>
			{/* HEADER PRINCIPAL */}
			<Box 
				borderStyle="double" 
				borderColor={borderColor} 
				paddingX={2} 
				paddingY={1}
				flexDirection="column"
			>
				<Box>
					{status === 'running' && (
						<Text color="yellow">
							<Spinner type="dots" /> 
						</Text>
					)}
					<Text color={borderColor} bold>
						{statusIcon} {automationName.toUpperCase()}
					</Text>
					{duration && status !== 'running' && (
						<Text color="gray"> ({formatDuration(duration)})</Text>
					)}
				</Box>
				<Box marginTop={1}>
					<Text color="cyan" dimColor>{description}</Text>
				</Box>
			</Box>

			{/* STEP ATUAL */}
			{currentStep && status === 'running' && (
				<Box 
					marginTop={1} 
					paddingX={2} 
					paddingY={1}
					borderStyle="single"
					borderColor="cyan"
				>
					<Text color="cyan">⚡ {currentStep}</Text>
				</Box>
			)}

			{/* MENSAGENS DA LLM */}
			{recentLLM.length > 0 && (
				<Box marginTop={1} flexDirection="column">
					<Box 
						paddingX={2} 
						paddingY={1}
						borderStyle="round"
						borderColor="blue"
					>
						<Box flexDirection="column" width="100%">
							<Box marginBottom={1}>
								<Text color="blue" bold>🧠 LLM REASONING</Text>
							</Box>
							{recentLLM.map((msg, idx) => (
								<Box key={idx} marginTop={idx > 0 ? 1 : 0} flexDirection="column">
									<Box>
										<Text color="gray" dimColor>
											[{new Date(msg.timestamp).toLocaleTimeString()}]
										</Text>
									</Box>
									<Box marginLeft={2}>
										<Text color="white">{msg.content}</Text>
									</Box>
								</Box>
							))}
							{llmMessages.length > 3 && (
								<Box marginTop={1}>
									<Text color="gray" italic>
										... +{llmMessages.length - 3} mensagens anteriores
									</Text>
								</Box>
							)}
						</Box>
					</Box>
				</Box>
			)}

			{/* TOOLS EXECUTADAS */}
			{recentTools.length > 0 && (
				<Box marginTop={1} flexDirection="column">
					{recentTools.map((tool, idx) => {
						const toolBorder = tool.status === 'complete' ? 'green' : 
						                   tool.status === 'error' ? 'red' : 'yellow';
						const icon = getIcon(tool.name);
						const dur = tool.endTime ? formatDuration(tool.endTime - tool.startTime) : '...';

						return (
							<Box 
								key={idx}
								marginTop={idx > 0 ? 1 : 0}
								paddingX={2}
								paddingY={1}
								borderStyle="round"
								borderColor={toolBorder}
							>
								<Box flexDirection="column" width="100%">
									<Box>
										{tool.status === 'running' && (
											<Text color="yellow">
												<Spinner type="dots" /> 
											</Text>
										)}
										<Text color={toolBorder} bold>
											{icon} {tool.name.replace(/_/g, ' ').toUpperCase()}
										</Text>
										{tool.endTime && (
											<Text color="gray"> ({dur})</Text>
										)}
									</Box>
									{tool.result && tool.status === 'complete' && (
										<Box marginTop={1}>
											<Text color="gray">─────────────────────────</Text>
										</Box>
									)}
									{tool.result && tool.status === 'complete' && (
										<Box marginTop={1} flexDirection="column">
											{tool.result.split('\n').slice(0, 3).map((line, i) => (
												<Text key={i} color="white">{line}</Text>
											))}
											{tool.result.split('\n').length > 3 && (
												<Text color="gray" italic>
													... +{tool.result.split('\n').length - 3} linhas
												</Text>
											)}
										</Box>
									)}
									{tool.result && tool.status === 'error' && (
										<Box marginTop={1}>
											<Text color="red">{tool.result.substring(0, 100)}</Text>
										</Box>
									)}
								</Box>
							</Box>
						);
					})}
					{toolExecutions.length > 5 && (
						<Box marginTop={1} paddingX={2}>
							<Text color="gray" italic>
								... +{toolExecutions.length - 5} tools executadas anteriormente
							</Text>
						</Box>
					)}
				</Box>
			)}
		</Box>
	);
};
