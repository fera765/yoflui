#!/usr/bin/env node
/**
 * Test All Message Types Rendering
 * Verificar se todos os tipos de mensagem renderizam corretamente
 */

import React from 'react';
import { render, Box, Text } from 'ink';
import { ChatTimeline } from './dist/ui/components/ChatTimeline.js';

const testMessages = [
	{
		id: 'msg-1',
		role: 'user' as const,
		content: 'Ol?! Esta ? uma mensagem de teste do usu?rio.'
	},
	{
		id: 'msg-2',
		role: 'assistant' as const,
		content: 'Ol?! Esta ? uma resposta do assistente.\nCom m?ltiplas linhas para testar.\nA renderiza??o est? funcionando corretamente!'
	},
	{
		id: 'msg-3',
		role: 'tool' as const,
		content: '',
		toolCall: {
			name: 'test_automation',
			args: { param1: 'value1', param2: 'value2' },
			status: 'complete' as const,
			result: 'Tool executada com sucesso! Resultado aqui.'
		}
	},
	{
		id: 'msg-4',
		role: 'kanban' as const,
		content: '',
		kanban: [
			{ id: 'task-1', title: 'Tarefa completada', status: 'done' as const },
			{ id: 'task-2', title: 'Tarefa em progresso', status: 'in_progress' as const },
			{ id: 'task-3', title: 'Tarefa pendente', status: 'todo' as const }
		]
	},
	{
		id: 'msg-5',
		role: 'assistant' as const,
		content: 'Outra mensagem do assistente para confirmar que tudo est? funcionando!'
	}
];

const App = () => (
	<Box flexDirection="column" padding={1}>
		<Box marginBottom={1}>
			<Text bold color="cyan">[ TESTE DE RENDERIZA??O DE MENSAGENS ]</Text>
		</Box>
		
		<ChatTimeline messages={testMessages} />
		
		<Box marginTop={2} borderStyle="single" borderColor="green" paddingX={2}>
			<Text color="green">
				? Se voc? v? todas as mensagens acima (user, assistant, tool, kanban), o sistema est? funcionando!
			</Text>
		</Box>
	</Box>
);

render(<App />);

// Auto-exit ap?s 5 segundos
setTimeout(() => {
	console.log('\n? Teste conclu?do! Se todas as mensagens apareceram, o sistema est? funcionando corretamente.');
	process.exit(0);
}, 5000);
