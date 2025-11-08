# Guia de Integração - Nova UI Dinâmica

## Visão Geral

A nova UI foi completamente reconstruída para fornecer feedback visual em tempo real, com componentes elegantes e dinâmicos para todas as tools e funcionalidades do FLUI.

## Componentes Criados

### 1. ToolExecutionBox (`source/components/v2/ToolExecutionBox.tsx`)

Box dinâmico para exibir execução de todas as tools em tempo real.

**Características:**
- Box pequeno com borda estilo kanban
- Ícone + nome da tool + argumento principal
- Log com últimas 10 linhas visíveis + "n linhas ocultas"
- Atualização em tempo real sem piscar
- Borda verde + check (✓) no sucesso
- Borda vermelha + X (✗) no erro
- Borda amarela + spinner enquanto executando
- Duração da execução

**Uso:**
```tsx
import { ToolExecutionBox } from './components/v2/ToolExecutionBox.js';

<ToolExecutionBox
  name="write_file"
  args={{ file_path: "/path/to/file.txt", content: "..." }}
  status="running" // ou 'complete', 'error', 'waiting'
  result="Arquivo criado com sucesso"
  startTime={Date.now()}
  endTime={Date.now() + 1000}
/>
```

### 2. DynamicKanbanBox (`source/components/v2/DynamicKanbanBox.tsx`)

Kanban dinâmico e elegante com atualização em tempo real.

**Características:**
- Atualização em tempo real sem piscar
- Tasks marcadas com cores dinâmicas (laranja = em andamento, verde = concluído)
- Barra de progresso
- Suporte para 8 colunas do workflow AGI
- Modo compacto opcional

**Uso:**
```tsx
import { DynamicKanbanBox } from './components/v2/DynamicKanbanBox.js';

<DynamicKanbanBox
  tasks={kanbanTasks}
  title="KANBAN"
  compact={false}
/>
```

### 3. FluiFeedbackBox (`source/components/v2/FluiFeedbackBox.tsx`)

Feedback breve (máx 30 palavras) do FLUI antes de cada ação.

**Características:**
- Mensagens curtas e diretas
- Tipos: 'info', 'action', 'success', 'thinking'
- Ícones e cores dinâmicas

**Uso:**
```tsx
import { FluiFeedbackBox } from './components/v2/FluiFeedbackBox.js';

<FluiFeedbackBox
  message="Vou ler o arquivo package.json para entender as dependências."
  type="action"
/>
```

### 4. UserQuestionBox (`source/components/v2/UserQuestionBox.tsx`)

Sistema de perguntas ao usuário durante execução.

**Características:**
- Permite ao FLUI solicitar informações adicionais
- Input com placeholder
- Enter para enviar

**Uso:**
```tsx
import { UserQuestionBox } from './components/v2/UserQuestionBox.js';

<UserQuestionBox
  question="Qual nome você deseja dar ao arquivo?"
  placeholder="Digite o nome..."
  value={answer}
  onChange={setAnswer}
  onSubmit={handleSubmit}
/>
```

### 5. MainUIManager (`source/ui/MainUIManager.tsx`)

Componente integrador que gerencia todos os elementos da UI.

**Uso:**
```tsx
import { MainUIManager } from './ui/MainUIManager.js';

<MainUIManager
  toolExecutions={toolExecutionsArray}
  kanbanTasks={kanbanTasks}
  showKanban={true}
  feedbacks={feedbacks}
  maxFeedbacks={3}
  currentQuestion={question}
  onAnswerQuestion={handleAnswer}
/>
```

### 6. useUIManager (`source/ui/hooks/useUIManager.ts`)

Hook para gerenciar estado da UI de forma simples.

**Uso:**
```tsx
import { useUIManager } from './ui/hooks/useUIManager.js';

const {
  state,
  updateToolExecution,
  updateKanbanTasks,
  addFeedback,
  askUser,
  answerQuestion,
  toolExecutionsArray,
  showKanban
} = useUIManager();
```

## Integração com Orchestrator V2

O orchestrator foi atualizado para suportar callbacks de feedback e tool execution.

### 1. Configurar Callbacks

```typescript
import { CentralOrchestratorV2 } from './agi/orchestrator-v2.js';
import { FluiFeedback, ToolExecution } from './agi/types.js';

const orchestrator = new CentralOrchestratorV2();

orchestrator.setCallbacks({
  onFeedback: (feedback: FluiFeedback) => {
    // Adicionar feedback na UI
    addFeedback(feedback);
  },
  onToolExecution: (toolExec: ToolExecution) => {
    // Atualizar tool execution na UI
    updateToolExecution(toolExec);
  }
});
```

### 2. Executar com Callbacks

```typescript
const result = await orchestrator.orchestrate(
  userPrompt,
  workDir,
  (message, kanban) => {
    // Atualizar kanban se fornecido
    if (kanban) {
      updateKanbanTasks(kanban);
    }
  }
);
```

## Exemplo Completo de Integração no App

```tsx
import React, { useState, useCallback } from 'react';
import { Box } from 'ink';
import { MainUIManager } from './ui/MainUIManager.js';
import { useUIManager } from './ui/hooks/useUIManager.js';
import { CentralOrchestratorV2 } from './agi/orchestrator-v2.js';
import type { FluiFeedback, ToolExecution } from './agi/types.js';

export default function App() {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  
  const {
    state,
    updateToolExecution,
    updateKanbanTasks,
    addFeedback,
    answerQuestion,
    toolExecutionsArray,
    showKanban
  } = useUIManager();
  
  const orchestrator = new CentralOrchestratorV2();
  
  // Configurar callbacks
  orchestrator.setCallbacks({
    onFeedback: (feedback: FluiFeedback) => {
      addFeedback(feedback);
    },
    onToolExecution: (toolExec: ToolExecution) => {
      updateToolExecution(toolExec);
    }
  });
  
  const handleSubmit = useCallback(async (userInput: string) => {
    if (!userInput.trim() || busy) return;
    
    setBusy(true);
    
    try {
      const result = await orchestrator.orchestrate(
        userInput,
        process.cwd(),
        (message, kanban) => {
          if (kanban) {
            updateKanbanTasks(kanban);
          }
        }
      );
      
      // Exibir resultado final
      console.log(result);
    } catch (error) {
      console.error(error);
    } finally {
      setBusy(false);
    }
  }, [busy, orchestrator, updateKanbanTasks]);
  
  return (
    <Box flexDirection="column">
      {/* UI Manager com todos os componentes */}
      <MainUIManager
        toolExecutions={toolExecutionsArray}
        kanbanTasks={state.kanbanTasks}
        showKanban={showKanban}
        feedbacks={state.feedbacks}
        maxFeedbacks={3}
        currentQuestion={state.currentQuestion}
        onAnswerQuestion={answerQuestion}
      />
      
      {/* Resto da UI... */}
    </Box>
  );
}
```

## Fluxo Completo de Feedback

### Exemplo: Analisar Projeto

**Usuário:** "analise o projeto"

**FLUI:** (FluiFeedbackBox)
```
🎯 FLUI › Vou analisar "analise o projeto" e criar um plano de ação para executar com excelência.
```

**(DynamicKanbanBox é exibido com primeira task em laranja)**

**FLUI:** (FluiFeedbackBox)
```
🎯 FLUI › Vou ler o diretório para entender a estrutura do projeto.
```

**(ToolExecutionBox aparece com borda amarela + spinner)**
```
┌─ 📂 Read Folder → /workspace ───────────────┐
│ ⟳ Executando... 1.2s                       │
│                                             │
│ Listing directory contents...              │
│ Found 15 files and 8 directories           │
└─────────────────────────────────────────────┘
```

**(ToolExecutionBox muda para borda verde + check)**
```
┌─ 📂 Read Folder → /workspace ───────────────┐
│ Listagem completa do diretório             │
│ - package.json                              │
│ - tsconfig.json                             │
│ - source/                                   │
│ ...                                         │
│ (10 linhas ocultas)                    ✓ 2.1s│
└─────────────────────────────────────────────┘
```

**FLUI:** (FluiFeedbackBox)
```
✨ FLUI › Concluí com sucesso: Ler estrutura do diretório
```

**(DynamicKanbanBox atualiza: primeira task verde ✅, segunda task laranja 🟠)**

**FLUI:** (FluiFeedbackBox)
```
🎯 FLUI › Vou ler o package.json para entender as dependências.
```

**(E assim por diante...)**

## Notas Importantes

1. **Sem Piscar**: Todos os componentes usam `React.memo` e comparações otimizadas para evitar re-renders desnecessários

2. **Tempo Real**: Atualizações acontecem instantaneamente quando o estado muda

3. **Feedback Limitado**: Por padrão, mostra apenas os últimos 3 feedbacks para não poluir a tela

4. **Tool Boxes**: Cada tool tem seu próprio box que aparece durante execução e permanece visível após conclusão

5. **Kanban Dinâmico**: Atualiza automaticamente conforme tasks mudam de coluna

6. **Sistema de Perguntas**: Bloqueia execução até o usuário responder (quando necessário)

## Próximos Passos

Para integrar completamente no `app.tsx`:

1. Importar `useUIManager` hook
2. Configurar callbacks no orchestrator
3. Substituir `OrchestrationView` por `MainUIManager`
4. Testar com diferentes tipos de tarefas
5. Ajustar estilos conforme necessário

## Arquivos Criados/Modificados

### Novos Arquivos:
- `source/components/v2/ToolExecutionBox.tsx`
- `source/components/v2/DynamicKanbanBox.tsx`
- `source/components/v2/FluiFeedbackBox.tsx`
- `source/components/v2/UserQuestionBox.tsx`
- `source/components/v2/index.ts`
- `source/ui/MainUIManager.tsx`
- `source/ui/hooks/useUIManager.ts`
- `source/agi/feedback-generator.ts`
- `source/agi/user-interaction-manager.ts`

### Arquivos Modificados:
- `source/agi/types.ts` - Adicionados novos tipos
- `source/agi/specialized-agents.ts` - Adicionado callback de tool execution
- `source/agi/orchestrator-v2.ts` - Adicionado suporte para callbacks e feedback

## Conclusão

A nova UI oferece uma experiência visual rica e dinâmica, com feedback em tempo real para todas as operações do FLUI. O sistema é modular, extensível e fácil de integrar com o código existente.
