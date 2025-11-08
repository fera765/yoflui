/**
 * UserQuestionBox - Sistema de Perguntas ao Usuário
 * 
 * Permite ao FLUI solicitar informações adicionais ao usuário
 * durante a execução de tarefas
 */

import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

export interface UserQuestionBoxProps {
	question: string;
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
	onSubmit: (value: string) => void;
}

/**
 * UserQuestionBox Component
 */
export const UserQuestionBox: React.FC<UserQuestionBoxProps> = ({
	question,
	placeholder = 'Digite sua resposta...',
	value,
	onChange,
	onSubmit
}) => {
	return (
		<Box 
			flexDirection="column" 
			borderStyle="round" 
			borderColor="yellow"
			paddingX={2}
			paddingY={1}
			marginY={1}
		>
			{/* Pergunta do FLUI */}
			<Box marginBottom={1}>
				<Text color="yellow" bold>❓ FLUI precisa de informações:</Text>
			</Box>
			
			<Box marginBottom={1}>
				<Text color="white">{question}</Text>
			</Box>
			
			{/* Input do usuário */}
			<Box>
				<Text color="cyan" bold>Você › </Text>
				<TextInput
					value={value}
					onChange={onChange}
					onSubmit={onSubmit}
					placeholder={placeholder}
				/>
			</Box>
			
			<Box marginTop={1}>
				<Text color="gray" dimColor italic>
					Pressione Enter para enviar
				</Text>
			</Box>
		</Box>
	);
};

UserQuestionBox.displayName = 'UserQuestionBox';
