# ?? INVESTIGA??O - Mensagens Duplicadas

## Problema Reportado
Mensagens do usu?rio aparecem m?ltiplas vezes na timeline.

## C?digo Atual (app.tsx linha 93)

```typescript
// Add user message to timeline (only if not a command)
setMessages(prev => [...prev, { role: 'user', content: msg }]);
setIsProcessing(true);

try {
    const response = await runAutonomousAgent({
        userMessage: msg,
        workDir,
        onProgress: (progress) => {
            // Silent in interactive mode
        },
        onKanbanUpdate: (tasks) => {
            setMessages(prev => {
                const filtered = prev.filter(m => m.role !== 'kanban');
                return [...filtered, { role: 'kanban', content: '', kanban: tasks }];
            });
        },
        onToolExecute: (toolName, args) => {
            setMessages(prev => [
                ...prev,
                {
                    role: 'tool',
                    content: '',
                    toolCall: { name: toolName, args, status: 'running' },
                },
            ]);
        },
        // ...
    });
}
```

## Poss?veis Causas

### Causa 1: React Re-renders
React pode estar causando m?ltiplos re-renders quando `setMessages` ? chamado v?rias vezes em sequ?ncia.

### Causa 2: Callbacks sendo chamados m?ltiplas vezes
Os callbacks `onToolExecute`, `onKanbanUpdate`, etc. podem estar sendo chamados m?ltiplas vezes.

### Causa 3: QuantumTimeline renderizando mensagens duplicadas
O componente pode estar renderizando a mesma mensagem m?ltiplas vezes.

## An?lise do C?digo

### app.tsx - handleSubmit()
```typescript
Line 93: setMessages(prev => [...prev, { role: 'user', content: msg }]);
         ? Adiciona mensagem do usu?rio UMA vez
         
Line 151: setMessages(prev => [...prev, { role: 'assistant', content: response }]);
          ? Adiciona resposta UMA vez
```

### Callbacks que modificam messages:
1. `onKanbanUpdate` - Filtra e adiciona kanban
2. `onToolExecute` - Adiciona tool running
3. `onToolComplete` - Atualiza tool existente (n?o adiciona)

## Investiga??o Necess?ria

1. ? Verificar se `setMessages` est? sendo chamado m?ltiplas vezes
2. ? Verificar se React est? causando re-renders
3. ? Verificar QuantumTimeline renderiza??o
4. ? Verificar se h? algum efeito colateral nos callbacks
