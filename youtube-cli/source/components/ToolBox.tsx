import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

interface ToolBoxProps {
	name: string;
	args: any;
	status: 'running' | 'complete' | 'error';
	result?: string;
}

const SPINNER_FRAMES = ['|', '/', '-', '\\'];

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

export const ToolBox: React.FC<ToolBoxProps> = React.memo(({ name, args, status, result }) => {
	const [frame, setFrame] = useState(0);
	
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
	
	if (result && isEdit) {
		const { diffLines, totalAdded, totalRemoved } = parseEditDiff(result);
		const visibleLines = diffLines.slice(0, 16);
		const hasMore = diffLines.length > 16;
		
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
			displayContent += `\n---------- +${diffLines.length - 16} linhas ----------`;
		}
	} else if (result) {
		const lines = result.split('\n').slice(0, 16);
		displayContent = lines.join('\n');
		if (result.split('\n').length > 16) {
			displayContent += `\n---------- +${result.split('\n').length - 16} linhas ----------`;
		}
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
				</Box>
			)}
		</Box>
	);
});
