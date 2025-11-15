import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface Props {
	onSelect: (command: string) => void;
}

const COMMANDS = [
	{ cmd: '/llm', desc: 'Configurar autenticacao LLM' },
	{ cmd: '/config', desc: 'Ajustar configuracoes' },
	{ cmd: '/tools', desc: 'Ver ferramentas disponiveis' },
	{ cmd: '/mcp', desc: 'Gerenciar MCPs (Model Context Protocol)' },
	{ cmd: '/clear-memory', desc: 'Limpar memoria e resetar conversa' },
	{ cmd: '/exit', desc: 'Sair da aplicacao' }
];

export const CommandSuggestions: React.FC<Props> = React.memo(({ onSelect }) => {
	const [selectedIndex, setSelectedIndex] = useState(0);
	
	useInput((input, key) => {
		if (key.upArrow) {
			setSelectedIndex(prev => Math.max(0, prev - 1));
		} else if (key.downArrow) {
			setSelectedIndex(prev => Math.min(COMMANDS.length - 1, prev + 1));
			} else if (key.return) {
				onSelect(COMMANDS[selectedIndex].cmd);
				return true; // Stop propagation of the Enter key
			}
	});
	
	return (
		<Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
			<Box marginBottom={1}>
				<Text color="cyan" bold>[COMANDOS]</Text>
			</Box>
			{COMMANDS.map(({ cmd, desc }, index) => (
				<Box key={cmd} marginY={0}>
					<Text color={index === selectedIndex ? 'cyan' : 'yellow'} bold={index === selectedIndex}>
						{index === selectedIndex ? '> ' : '  '}
						{cmd}
					</Text>
					<Text color={index === selectedIndex ? 'white' : 'gray'}> - {desc}</Text>
				</Box>
			))}
			<Box marginTop={1}>
				<Text color="gray" dimColor>Use ⬆️⬇️ e Enter para selecionar | ESC para cancelar</Text>
			</Box>
		</Box>
	);
});
