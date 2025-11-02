import React, { useState, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';

interface ToolBoxProps {
	name: string;
	args: any;
	status: 'running' | 'complete' | 'error';
	result?: string;
}

const SPINNER_FRAMES = ['|', '/', '-', '\\'];
const MAX_VISIBLE_LINES = 10;

const parseEditDiff = (result: string) => {
	const lines = result.split('\n');
	const diffLines: Array<{lineNum: number; type: 'add' | 'remove' | 'same'; content: string}> = [];
	let lineNum = 1;
	let totalAdded = 0;
	let totalRemoved = 0;
	
	for (const line of lines) {
		if (line.startsWith('+ ')) {
			diffLines.push({ lineNum: lineNum++, type: 'add', content: line.substring(2) });
			totalAdded++;
		} else if (line.startsWith('- ')) {
			diffLines.push({ lineNum: lineNum++, type: 'remove', content: line.substring(2) });
			totalRemoved++;
		} else if (line.trim()) {
			diffLines.push({ lineNum: lineNum++, type: 'same', content: line });
		}
	}
	
	return { diffLines, totalAdded, totalRemoved };
};

const truncateToVisibleLines = (text: string, terminalWidth: number): { truncated: string; hiddenCount: number } => {
	const lines = text.split('\n');
	let visibleLineCount = 0;
	const resultLines: string[] = [];
	
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineLength = line.length;
		const wrappedLines = Math.ceil(lineLength / Math.max(terminalWidth - 10, 40));
		
		if (visibleLineCount + wrappedLines > MAX_VISIBLE_LINES) {
			const hiddenCount = lines.length - i;
			return { truncated: resultLines.join('\n'), hiddenCount };
		}
		
		resultLines.push(line);
		visibleLineCount += wrappedLines;
	}
	
	return { truncated: resultLines.join('\n'), hiddenCount: 0 };
};

const truncateJSON = (text: string, maxChars: number = 2000): string => {
	if (text.length <= maxChars) return text;
	
	try {
		const parsed = JSON.parse(text);
		return JSON.stringify(parsed, null, 2).substring(0, maxChars) + '\n... [truncado]';
	} catch {
		return text.substring(0, maxChars) + '\n... [truncado]';
	}
};

export const ToolBox: React.FC<ToolBoxProps> = React.memo(({ name, args, status, result }) => {
	const [frame, setFrame] = useState(0);
	const { stdout } = useStdout();
	const terminalWidth = stdout?.columns || 80;
	
	useEffect(() => {
		if (status === 'running') {
			const interval = setInterval(() => {
				setFrame(prev => (prev + 1) % SPINNER_FRAMES.length);
			}, 100);
			return () => clearInterval(interval);
		}
	}, [status]);
	
	const icon = status === 'running' ? SPINNER_FRAMES[frame] : status === 'error' ? '[X]' : '[OK]';
	const iconColor = status === 'running' ? 'cyan' : status === 'error' ? 'red' : 'green';
	const toolName = name.toUpperCase();
	
	const fileName = args?.file_path || args?.path || '';
	const isEdit = name === 'edit_file';
	
	let displayContent = '';
	let totalLinesInfo = '';
	let hiddenLinesCount = 0;
	
	if (result && isEdit) {
		const { diffLines, totalAdded, totalRemoved } = parseEditDiff(result);
		const visibleLines = diffLines.slice(0, MAX_VISIBLE_LINES);
		const hasMore = diffLines.length > MAX_VISIBLE_LINES;
		
		if (totalAdded > 0 && totalRemoved > 0) {
			totalLinesInfo = `+${totalAdded}/-${totalRemoved}`;
		} else if (totalAdded > 0) {
			totalLinesInfo = `+${totalAdded}`;
		} else if (totalRemoved > 0) {
			totalLinesInfo = `-${totalRemoved}`;
		}
		
		displayContent = visibleLines.map(l => {
			const prefix = l.type === 'add' ? '+' : l.type === 'remove' ? '-' : ' ';
			return `${String(l.lineNum).padStart(3)} ${prefix} ${l.content}`;
		}).join('\n');
		
		if (hasMore) {
			hiddenLinesCount = diffLines.length - MAX_VISIBLE_LINES;
		}
	} else if (result) {
		let processedResult = result;
		
		if (result.length > 10000) {
			processedResult = truncateJSON(result, 2000);
		}
		
		const { truncated, hiddenCount } = truncateToVisibleLines(processedResult, terminalWidth);
		displayContent = truncated;
		hiddenLinesCount = hiddenCount;
	}
	
	return (
		<Box flexDirection="column" borderStyle="round" borderColor={iconColor} paddingX={2} paddingY={1} marginY={1}>
			<Box marginBottom={displayContent ? 1 : 0}>
				<Text color={iconColor} bold>{icon} </Text>
				<Text color="white" bold>{toolName}</Text>
				{fileName && <Text color="white">: {fileName}</Text>}
				{totalLinesInfo && <Text color="yellow"> ({totalLinesInfo})</Text>}
			</Box>
			
			{displayContent && (
				<Box flexDirection="column">
					{displayContent.split('\n').map((line, idx) => {
						if (isEdit) {
							const isAdd = line.includes(' + ');
							const isRemove = line.includes(' - ');
							const color = isAdd ? 'green' : isRemove ? 'red' : 'white';
							
							return <Text key={idx} color={color}>{line}</Text>;
						}
						
						return <Text key={idx} color="white">{line}</Text>;
					})}
					{hiddenLinesCount > 0 && (
						<Text color="gray">... +{hiddenLinesCount} linhas ocultas</Text>
					)}
				</Box>
			)}
		</Box>
	);
}, (prevProps, nextProps) => {
	return (
		prevProps.name === nextProps.name &&
		prevProps.status === nextProps.status &&
		prevProps.result === nextProps.result
	);
});
