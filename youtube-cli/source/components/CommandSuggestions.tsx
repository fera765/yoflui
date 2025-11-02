import React from 'react';
import { Box, Text } from 'ink';

interface Props {
	onSelect: (command: string) => void;
}

const COMMANDS = [
	{ cmd: '/llm', desc: 'Configurar autenticacao LLM' },
	{ cmd: '/config', desc: 'Ajustar configuracoes' },
	{ cmd: '/tools', desc: 'Ver ferramentas disponiveis' },
	{ cmd: '/exit', desc: 'Sair da aplicacao' }
];

export const CommandSuggestions: React.FC<Props> = React.memo(({ onSelect }) => {
	return (
		<Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
			<Box marginBottom={1}>
				<Text color="cyan" bold>[COMANDOS]</Text>
			</Box>
			{COMMANDS.map(({ cmd, desc }) => (
				<Box key={cmd} marginY={0}>
					<Text color="yellow" bold>{cmd}</Text>
					<Text color="gray"> - {desc}</Text>
				</Box>
			))}
			<Box marginTop={1}>
				<Text color="gray" dimColor>Digite o comando ou pressione ESC</Text>
			</Box>
		</Box>
	);
});
