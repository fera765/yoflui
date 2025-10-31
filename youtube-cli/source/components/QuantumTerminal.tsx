import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import type { KanbanTask } from '../tools/kanban.js';

export interface Message {
	role: 'user' | 'assistant' | 'tool' | 'kanban';
	content: string;
	toolCall?: {
		name: string;
		args: any;
		status: 'running' | 'complete' | 'error';
		result?: string;
		progress?: number;
	};
	kanban?: KanbanTask[];
}

// Monokai Dark Colors
const MONOKAI = {
	bg: '#272822',
	bg2: '#1e1f1c',
	fg: '#f8f8f2',
	comment: '#75715e',
	yellow: '#e6db74',
	orange: '#fd971f',
	pink: '#f92672',
	purple: '#ae81ff',
	blue: '#66d9ef',
	green: '#a6e22e',
	border: '#3e3d32',
};

const UserMessage: React.FC<{ text: string }> = ({ text }) => (
	<Box flexDirection="column" marginTop={1} marginBottom={1}>
		<Box>
			<Text color={MONOKAI.blue} bold>&gt; </Text>
			<Text color={MONOKAI.fg}>{text}</Text>
		</Box>
	</Box>
);

const QuantumKanban: React.FC<{ tasks: KanbanTask[] }> = ({ tasks }) => {
	// Order tasks: done first, then in_progress, then todo
	const doneTasks = tasks.filter(t => t.status === 'done');
	const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
	const todoTasks = tasks.filter(t => t.status === 'todo');
	
	const orderedTasks = [...doneTasks, ...inProgressTasks, ...todoTasks];

	const getTaskIcon = (status: string) => {
		if (status === 'done') return '?'; // Filled circle
		if (status === 'in_progress') return '?'; // Filled circle
		return '?'; // Empty circle
	};

	const getTaskColor = (status: string) => {
		if (status === 'done') return MONOKAI.green;
		if (status === 'in_progress') return MONOKAI.orange;
		return MONOKAI.fg; // white/default
	};

	return (
		<Box borderStyle="round" borderColor={MONOKAI.border} paddingX={2} paddingY={1} flexDirection="column" marginY={1}>
			<Box marginBottom={1}>
				<Text color={MONOKAI.blue} bold>[TASK BOARD]</Text>
				<Text color={MONOKAI.comment}> {doneTasks.length}/{tasks.length} completed</Text>
			</Box>
			
			{orderedTasks.map(task => (
				<Box key={task.id} marginLeft={1}>
					<Text color={getTaskColor(task.status)}>{getTaskIcon(task.status)} </Text>
					<Text color={getTaskColor(task.status)}>{task.title}</Text>
				</Box>
			))}
		</Box>
	);
};

const QuantumTool: React.FC<{
	name: string;
	args: any;
	status: 'running' | 'complete' | 'error';
	result?: string;
	progress?: number;
}> = ({ name, args, status, result, progress }) => {
	const getIcon = () => {
		switch (name) {
			case 'write_file': return '[WRITE]';
			case 'read_file': return '[READ]';
			case 'edit_file': return '[EDIT]';
			case 'execute_shell': return '[SHELL]';
			case 'find_files': return '[FIND]';
			case 'search_text': return '[SEARCH]';
			case 'read_folder': return '[FOLDER]';
			case 'update_kanban': return '[KANBAN]';
			case 'web_fetch': return '[FETCH]';
			case 'search_youtube_comments': return '[YOUTUBE]';
			default: return '[TOOL]';
		}
	};

	const getStatusIcon = () => {
		if (status === 'running') return '>';
		if (status === 'complete') return '+';
		return 'x';
	};

	const getColor = () => {
		if (status === 'running') return MONOKAI.orange;
		if (status === 'complete') return MONOKAI.green;
		return MONOKAI.pink;
	};

	const getStatusText = () => {
		if (status === 'running') return 'RUNNING';
		if (status === 'complete') return 'DONE';
		return 'ERROR';
	};

	// Progress bar
	const renderProgressBar = () => {
		if (status !== 'running') return null;
		const prog = progress || 50;
		const filled = Math.floor((prog / 100) * 20);
		const empty = 20 - filled;
		return (
			<Box marginLeft={2} marginTop={1}>
				<Text color={MONOKAI.green}>{'='.repeat(filled)}</Text>
				<Text color={MONOKAI.comment}>{'-'.repeat(empty)}</Text>
				<Text color={MONOKAI.purple}> {prog}%</Text>
			</Box>
		);
	};

	// Get first 3 lines of output for running, or first 5 for complete
	const getOutputLines = () => {
		if (!result) return [];
		const lines = result.split('\n').filter(l => l.trim());
		if (status === 'running') return lines.slice(0, 3);
		return lines.slice(0, 5);
	};

	const formatArgValue = (value: any): string => {
		if (typeof value === 'string') return value.substring(0, 60);
		return JSON.stringify(value).substring(0, 60);
	};

	return (
		<Box borderStyle="round" borderColor={getColor()} paddingX={2} paddingY={1} flexDirection="column" marginY={1}>
			<Box>
				<Text color={getColor()} bold>
					{getIcon()} {name.replace('_', ' ').toUpperCase()}  {getStatusIcon()} {getStatusText()}
				</Text>
			</Box>

			{/* Args */}
			{Object.entries(args).slice(0, 2).map(([key, value]) => (
				<Box key={key} marginLeft={1} marginTop={0.5}>
					<Text color={MONOKAI.comment}>  {key}: </Text>
					<Text color={MONOKAI.purple}>{formatArgValue(value)}</Text>
				</Box>
			))}

			{/* Progress bar for running */}
			{renderProgressBar()}

			{/* Output lines */}
			{result && getOutputLines().length > 0 && (
				<Box flexDirection="column" marginTop={1} borderStyle="single" borderColor={MONOKAI.border} paddingX={1}>
					{getOutputLines().map((line, idx) => (
						<Box key={idx}>
							<Text color={status === 'error' ? MONOKAI.pink : MONOKAI.yellow}>{line}</Text>
						</Box>
					))}
				</Box>
			)}

			{result && result.split('\n').length > 5 && status === 'complete' && (
				<Box marginLeft={1} marginTop={0.5}>
					<Text color={MONOKAI.comment} dimColor>... +{result.split('\n').length - 5} more lines</Text>
				</Box>
			)}
		</Box>
	);
};

const AIResponse: React.FC<{ text: string }> = ({ text }) => (
	<Box flexDirection="column" marginY={1} paddingX={1}>
		<Text color={MONOKAI.blue}>{text}</Text>
	</Box>
);

export const QuantumTimeline: React.FC<{ messages: Message[] }> = ({ messages }) => {
	if (messages.length === 0) {
		return (
			<Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} paddingY={5}>
				<Text color={MONOKAI.blue} bold>[ READY ]</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			{messages.map((msg, idx) => {
				if (msg.role === 'user') {
					return <UserMessage key={idx} text={msg.content} />;
				}

				if (msg.role === 'kanban' && msg.kanban) {
					return <QuantumKanban key={idx} tasks={msg.kanban} />;
				}

				if (msg.role === 'tool' && msg.toolCall) {
					return (
						<QuantumTool
							key={idx}
							name={msg.toolCall.name}
							args={msg.toolCall.args}
							status={msg.toolCall.status}
							result={msg.toolCall.result}
							progress={msg.toolCall.progress}
						/>
					);
				}

				if (msg.role === 'assistant') {
					return <AIResponse key={idx} text={msg.content} />;
				}

				return null;
			})}
		</Box>
	);
};

export const QuantumInput: React.FC<{
	value: string;
	onChange: (val: string) => void;
	onSubmit: () => void;
	isProcessing: boolean;
}> = ({ value, onChange, onSubmit, isProcessing }) => (
	<Box flexDirection="column">
		<Box borderStyle="round" borderColor={MONOKAI.border} paddingX={2} paddingY={1} marginX={2} marginBottom={1}>
			{isProcessing ? (
				<>
					<Text color={MONOKAI.orange}><Spinner type="dots" /></Text>
					<Text color={MONOKAI.comment}> Processing...</Text>
				</>
			) : (
				<>
					<Text color={MONOKAI.pink} bold>&gt; </Text>
					<TextInput
						value={value}
						onChange={onChange}
						onSubmit={onSubmit}
						placeholder=""
					/>
				</>
			)}
		</Box>
	</Box>
);
