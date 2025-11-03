#!/usr/bin/env node

/**
 * Script de debug para testar renderiza??o de mensagens
 */

const messages = [
  {
    id: '1',
    role: 'user',
    content: 'Ol?, teste de mensagem do usu?rio'
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Ol?! Esta ? uma resposta do assistente.\nCom m?ltiplas linhas.\nPara testar a renderiza??o.'
  },
  {
    id: '3',
    role: 'tool',
    content: '',
    toolCall: {
      name: 'test_tool',
      args: { param: 'value' },
      status: 'complete',
      result: 'Tool executado com sucesso'
    }
  },
  {
    id: '4',
    role: 'kanban',
    content: '',
    kanban: [
      { id: 'task1', title: 'Tarefa 1', status: 'done' },
      { id: 'task2', title: 'Tarefa 2', status: 'in_progress' },
      { id: 'task3', title: 'Tarefa 3', status: 'todo' }
    ]
  }
];

console.log('Testing message conversion...\n');

// Simular convers?o
messages.forEach((msg, idx) => {
  console.log(`Message ${idx + 1}:`);
  console.log(`  Role: ${msg.role}`);
  console.log(`  Content: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
  
  // Simular convers?o para HistoryItem
  if (msg.role === 'assistant') {
    console.log(`  -> Converted to: AssistantHistoryItem`);
    console.log(`     text: "${msg.content}"`);
  } else if (msg.role === 'user') {
    console.log(`  -> Converted to: UserHistoryItem`);
  } else if (msg.role === 'tool') {
    console.log(`  -> Converted to: ToolHistoryItem`);
    console.log(`     tool: ${JSON.stringify(msg.toolCall, null, 2).substring(0, 100)}`);
  } else if (msg.role === 'kanban') {
    console.log(`  -> Converted to: KanbanHistoryItem`);
  }
  
  console.log('');
});

console.log('All messages processed successfully!');
