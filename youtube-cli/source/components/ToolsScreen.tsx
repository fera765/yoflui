import React from 'react';
import { Box, Text, useInput } from 'ink';
import { ALL_TOOL_DEFINITIONS } from '../tools/index.js';

interface Props {
	onClose: () => void;
}

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

export const ToolsScreen: React.FC<Props> = ({ onClose }) => {
	useInput((input, key) => {
		if (key.escape || input === 'q') {
			onClose();
		}
	});

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			<Box marginBottom={1}>
				<Text color={MONOKAI.blue} bold>?? AVAILABLE TOOLS ({ALL_TOOL_DEFINITIONS.length})</Text>
			</Box>

			{ALL_TOOL_DEFINITIONS.map((tool, idx) => {
				const funcDef = (tool as any).function;
				const name = funcDef.name;
				const description = funcDef.description || 'No description';
				const params = funcDef.parameters?.properties || {};
				const required = funcDef.parameters?.required || [];

				return (
					<Box
						key={idx}
						borderStyle="round"
						borderColor={MONOKAI.border}
						paddingX={2}
						paddingY={1}
						flexDirection="column"
						marginBottom={1}
					>
						<Box>
							<Text color={MONOKAI.green} bold>
								? {name}
							</Text>
						</Box>

						<Box marginTop={0.5} marginLeft={2}>
							<Text color={MONOKAI.fg}>{description}</Text>
						</Box>

						{Object.keys(params).length > 0 && (
							<Box flexDirection="column" marginTop={1} marginLeft={2}>
								<Text color={MONOKAI.comment}>Parameters:</Text>
								{Object.entries(params).map(([paramName, paramDef]: [string, any]) => (
									<Box key={paramName} marginLeft={2}>
										<Text color={MONOKAI.yellow}>
											{paramName}
											{required.includes(paramName) && (
												<Text color={MONOKAI.pink}>*</Text>
											)}
										</Text>
										<Text color={MONOKAI.comment}> - {paramDef.description || paramDef.type}</Text>
									</Box>
								))}
							</Box>
						)}
					</Box>
				);
			})}

			<Box marginTop={1} justifyContent="center">
				<Text color={MONOKAI.comment}>[ESC or Q to close]</Text>
			</Box>
		</Box>
	);
};
