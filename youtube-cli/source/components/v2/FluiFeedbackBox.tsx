/**
 * FluiFeedbackBox - Feedback Breve do FLUI
 * 
 * Exibe mensagens curtas (máx 30 palavras) do FLUI explicando
 * o que está prestes a fazer antes de executar cada ação
 */

import React from 'react';
import { Box, Text } from 'ink';

export interface FluiFeedbackBoxProps {
	message: string;
	type?: 'info' | 'action' | 'success' | 'thinking';
}

const TYPE_CONFIG = {
	info: {
		icon: 'ℹ️',
		color: 'cyan',
		prefix: 'FLUI'
	},
	action: {
		icon: '🎯',
		color: 'yellow',
		prefix: 'FLUI'
	},
	success: {
		icon: '✨',
		color: 'green',
		prefix: 'FLUI'
	},
	thinking: {
		icon: '🧠',
		color: 'magenta',
		prefix: 'FLUI'
	}
};

/**
 * FluiFeedbackBox Component
 */
export const FluiFeedbackBox: React.FC<FluiFeedbackBoxProps> = React.memo(({
	message,
	type = 'info'
}) => {
	const config = TYPE_CONFIG[type];
	
	return (
		<Box marginY={1}>
			<Text color={config.color}>
				{config.icon} <Text bold>{config.prefix}</Text> › {message}
			</Text>
		</Box>
	);
});

FluiFeedbackBox.displayName = 'FluiFeedbackBox';
