# Exemplo Prático de Integração no App.tsx

Este arquivo mostra exatamente como integrar todos os novos componentes no `app.tsx` existente.

## Modificações Necessárias

### 1. Adicionar Imports

```tsx
// No topo do arquivo app.tsx, adicionar:
import { MainUIManager } from './ui/MainUIManager.js';
import { useUIManager } from './ui/hooks/useUIManager.ts';
import { CentralOrchestratorV2 } from './agi/orchestrator-v2.js';
import type { FluiFeedback, ToolExecution } from './agi/types.js';
```

### 2. Adicionar Estado do UI Manager

```tsx
// Dentro do componente App(), adicionar:
const {
	state: uiState,
	updateToolExecution,
	updateKanbanTasks,
	addFeedback,
	answerQuestion,
	toolExecutionsArray,
	showKanban,
	clearAll: clearUIState
} = useUIManager();
```

### 3. Inicializar Orchestrator V2 com Callbacks

```tsx
// Substituir ou adicionar junto com o orchestrator existente:
if (!centralOrchestrator) {
	centralOrchestrator = new CentralOrchestratorV2();
	
	// Configurar callbacks para UI em tempo real
	centralOrchestrator.setCallbacks({
		onFeedback: (feedback: FluiFeedback) => {
			addFeedback(feedback);
		},
		onToolExecution: (toolExec: ToolExecution) => {
			updateToolExecution(toolExec);
		}
	});
}
```

### 4. Modificar handleSubmit para Usar Orchestrator V2

```tsx
const handleSubmit = useCallback(async () => {
	if (!input.trim() || busy) return;
	
	const userMsg = input.trim();
	setInput('');
	setBusy(true);
	
	// Adicionar mensagem do usuário
	const userMsgObj: ChatMessage = {
		id: generateId('user'),
		role: 'user',
		content: userMsg
	};
	addMessage(userMsgObj);
	
	// Limpar estado anterior da UI
	clearUIState();
	
	try {
		if (agiMode && centralOrchestrator) {
			// Usar Orchestrator V2 com nova UI
			const result = await centralOrchestrator.orchestrate(
				userMsg,
				process.cwd(),
				(message, kanban) => {
					// Atualizar kanban se fornecido
					if (kanban) {
						updateKanbanTasks(kanban);
					}
					
					// Se houver mensagem de progresso, pode adicionar como info
					if (message && message.trim() !== '') {
						// Opcional: adicionar como mensagem de info
						// addMessage({ id: generateId('info'), role: 'assistant', content: message });
					}
				}
			);
			
			// Adicionar resposta final
			addMessage({
				id: generateId('assistant'),
				role: 'assistant',
				content: result.result
			});
		} else {
			// Fluxo existente para modo não-AGI
			// ... código existente ...
		}
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		addMessage({
			id: generateId('error'),
			role: 'assistant',
			content: `❌ Erro: ${errorMsg}`
		});
	} finally {
		setBusy(false);
	}
}, [input, busy, agiMode, addMessage, clearUIState, updateKanbanTasks]);
```

### 5. Renderizar MainUIManager na UI

```tsx
// No return do componente App, adicionar o MainUIManager antes ou depois do ChatTimeline:

return (
	<KeypressProvider>
		<Box flexDirection="column" height="100%" width="100%">
			{screen === 'chat' && (
				<>
					{/* Timeline de mensagens existente */}
					<ChatTimeline 
						messages={msgs} 
						terminalWidth={stdout?.columns || 80}
					/>
					
					{/* NOVA UI DINÂMICA - Adicionar aqui */}
					<MainUIManager
						toolExecutions={toolExecutionsArray}
						kanbanTasks={uiState.kanbanTasks}
						showKanban={showKanban && agiMode}
						feedbacks={uiState.feedbacks}
						maxFeedbacks={3}
						currentQuestion={uiState.currentQuestion}
						onAnswerQuestion={answerQuestion}
					/>
					
					{/* OrchestrationView ANTIGO - pode ser removido se quiser usar apenas o novo */}
					{/* 
					{agiMode && agiKanban.length > 0 && (
						<OrchestrationView tasks={agiKanban} />
					)}
					*/}
					
					{/* Input existente */}
					<ChatInput
						value={input}
						onChange={changeInput}
						onSubmit={handleSubmit}
						busy={busy}
						apiConnected={apiConnected}
						agiMode={agiMode}
					/>
					
					{/* Comandos e Automações existentes */}
					{cmds && <CommandSuggestions onSelect={selectCmd} />}
					{showAutomations && <AutomationSelector onSelect={selectAutomation} />}
				</>
			)}
			
			{/* Outras telas existentes */}
			{screen === 'auth' && <NewAuthScreen onBack={() => setScreen('chat')} />}
			{screen === 'config' && <ConfigScreen onBack={() => setScreen('chat')} />}
			{screen === 'tools' && <ToolsScreen onBack={() => setScreen('chat')} />}
			{screen === 'mcp' && <MCPScreen onBack={() => setScreen('chat')} />}
			
			{/* AutomationUI existente */}
			{automationUI?.active && (
				<AutomationUI {...automationUI} onClose={() => setAutomationUI(null)} />
			)}
		</Box>
	</KeypressProvider>
);
```

## Código Completo da Integração

```tsx
// ============================================
// EXEMPLO COMPLETO - app.tsx com nova UI
// ============================================

import React, { useState, useCallback, useEffect } from 'react';
import { Box, useInput, useStdout } from 'ink';
import { ChatTimeline, type ChatMessage } from './components/ChatComponents.js';
import { AutomationUI } from './ui/AutomationUI.js';
import { ChatInput } from './input/index.js';
import { KeypressProvider } from './input/index.js';
import { CommandSuggestions } from './components/CommandSuggestions.js';
import { AutomationSelector } from './components/AutomationSelector.js';
import { NewAuthScreen } from './components/NewAuthScreen.js';
import { ConfigScreen } from './components/ConfigScreen.js';
import { ToolsScreen } from './components/ToolsScreen.js';
import { MCPScreen } from './components/MCPScreen.js';
import { getConfig } from './llm-config.js';

// NOVO: Imports para nova UI
import { MainUIManager } from './ui/MainUIManager.js';
import { useUIManager } from './ui/hooks/useUIManager.ts';
import { CentralOrchestratorV2 } from './agi/orchestrator-v2.js';
import type { FluiFeedback, ToolExecution } from './agi/types.js';

// ... outros imports existentes ...

let centralOrchestrator: CentralOrchestratorV2 | null = null;

export default function App() {
	// Estados existentes
	const [screen, setScreen] = useState<Screen>('chat');
	const [msgs, setMsgs] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState('');
	const [busy, setBusy] = useState(false);
	const [cmds, setCmds] = useState(false);
	const [showAutomations, setShowAutomations] = useState(false);
	const [apiConnected, setApiConnected] = useState(false);
	const [agiMode, setAgiMode] = useState(true);
	const [automationUI, setAutomationUI] = useState<any | null>(null);
	
	// NOVO: UI Manager para nova UI
	const {
		state: uiState,
		updateToolExecution,
		updateKanbanTasks,
		addFeedback,
		answerQuestion,
		toolExecutionsArray,
		showKanban,
		clearAll: clearUIState
	} = useUIManager();
	
	const { stdout } = useStdout();
	
	// Inicializar Orchestrator V2 com callbacks
	if (!centralOrchestrator) {
		centralOrchestrator = new CentralOrchestratorV2();
		
		centralOrchestrator.setCallbacks({
			onFeedback: (feedback: FluiFeedback) => {
				addFeedback(feedback);
			},
			onToolExecution: (toolExec: ToolExecution) => {
				updateToolExecution(toolExec);
			}
		});
	}
	
	// ... handlers existentes (changeInput, selectCmd, etc.) ...
	
	// MODIFICADO: handleSubmit para usar nova UI
	const handleSubmit = useCallback(async () => {
		if (!input.trim() || busy) return;
		
		const userMsg = input.trim();
		setInput('');
		setBusy(true);
		
		const userMsgObj: ChatMessage = {
			id: generateId('user'),
			role: 'user',
			content: userMsg
		};
		addMessage(userMsgObj);
		
		clearUIState(); // Limpar UI anterior
		
		try {
			if (agiMode && centralOrchestrator) {
				const result = await centralOrchestrator.orchestrate(
					userMsg,
					process.cwd(),
					(message, kanban) => {
						if (kanban) {
							updateKanbanTasks(kanban);
						}
					}
				);
				
				addMessage({
					id: generateId('assistant'),
					role: 'assistant',
					content: result.result
				});
			} else {
				// Modo não-AGI (código existente)
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			addMessage({
				id: generateId('error'),
				role: 'assistant',
				content: `❌ Erro: ${errorMsg}`
			});
		} finally {
			setBusy(false);
		}
	}, [input, busy, agiMode, addMessage, clearUIState, updateKanbanTasks]);
	
	return (
		<KeypressProvider>
			<Box flexDirection="column" height="100%" width="100%">
				{screen === 'chat' && (
					<>
						<ChatTimeline 
							messages={msgs} 
							terminalWidth={stdout?.columns || 80}
						/>
						
						{/* NOVA UI DINÂMICA */}
						<MainUIManager
							toolExecutions={toolExecutionsArray}
							kanbanTasks={uiState.kanbanTasks}
							showKanban={showKanban && agiMode}
							feedbacks={uiState.feedbacks}
							maxFeedbacks={3}
							currentQuestion={uiState.currentQuestion}
							onAnswerQuestion={answerQuestion}
						/>
						
						<ChatInput
							value={input}
							onChange={changeInput}
							onSubmit={handleSubmit}
							busy={busy}
							apiConnected={apiConnected}
							agiMode={agiMode}
						/>
						
						{cmds && <CommandSuggestions onSelect={selectCmd} />}
						{showAutomations && <AutomationSelector onSelect={selectAutomation} />}
					</>
				)}
				
				{screen === 'auth' && <NewAuthScreen onBack={() => setScreen('chat')} />}
				{screen === 'config' && <ConfigScreen onBack={() => setScreen('chat')} />}
				{screen === 'tools' && <ToolsScreen onBack={() => setScreen('chat')} />}
				{screen === 'mcp' && <MCPScreen onBack={() => setScreen('chat')} />}
				
				{automationUI?.active && (
					<AutomationUI {...automationUI} onClose={() => setAutomationUI(null)} />
				)}
			</Box>
		</KeypressProvider>
	);
}
```

## Resultado Visual Esperado

Quando o usuário executar uma tarefa como "analise o projeto", verá:

```
┌─────────────────────────────────────────────────────┐
│ Você › analise o projeto                            │
└─────────────────────────────────────────────────────┘

🎯 FLUI › Vou analisar "analise o projeto" e criar um plano de ação para executar com excelência.

┌─ 📋 KANBAN ─────────────────────────── 0% (0/3) ────┐
│ [░░░░░░░░░░░░░░░░░░░░]                              │
│                                                      │
│ 🎯 Planejamento (3)                                  │
│   ⚪ Analisar estrutura do projeto                   │
│   ⚪ Ler dependências                                │
│   ⚪ Criar relatório                                 │
└──────────────────────────────────────────────────────┘

🎯 FLUI › Vou ler o diretório para entender a estrutura do projeto.

┌─ 📂 Read Folder → /workspace ────────────────────┐
│ ⟳ Listando arquivos... 0.5s                     │
└──────────────────────────────────────────────────┘

[Kanban atualiza em tempo real]
[Tool box atualiza em tempo real]
[Feedbacks aparecem conforme progresso]

✨ FLUI › Muito bem! Todas as tarefas foram finalizadas com sucesso.

┌─────────────────────────────────────────────────────┐
│ FLUI › Realizei análise completa do projeto...      │
└─────────────────────────────────────────────────────┘
```

## Notas Importantes

1. **Compatibilidade**: O código mantém total compatibilidade com a UI existente
2. **Modo AGI**: A nova UI só aparece quando `agiMode` está ativo
3. **Performance**: Todos os componentes são otimizados com React.memo
4. **Cleanup**: Use `clearUIState()` antes de cada nova execução para limpar estado anterior
5. **OrchestrationView**: Pode ser removido ou mantido como fallback

## Testes Recomendados

1. Ativar modo AGI: `/agi`
2. Executar tarefa simples: "crie um arquivo teste.txt"
3. Executar tarefa complexa: "analise este projeto"
4. Executar tarefa com erro: "leia arquivo-inexistente.txt"
5. Observar atualizações em tempo real

## Troubleshooting

### Se não aparecer nada:
- Verificar se `agiMode` está true
- Verificar se callbacks estão configurados
- Verificar console para erros

### Se UI piscar:
- Verificar se está usando `React.memo` nos componentes
- Verificar se `clearUIState()` é chamado apenas uma vez por execução

### Se tools não aparecerem:
- Verificar se `onToolExecution` callback está configurado
- Verificar se agents têm `setToolExecutionCallback` configurado

---

**Integração completa e pronta para uso!** 🚀
