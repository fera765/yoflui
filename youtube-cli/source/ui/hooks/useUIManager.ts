/**
 * useUIManager - Hook para gerenciar estado da UI
 * 
 * Gerencia:
 * - Tool executions em tempo real
 * - Kanban tasks
 * - Feedbacks do FLUI
 * - Perguntas ao usuário
 */

import { useState, useCallback } from 'react';
import type { FluiFeedback, ToolExecution, UserQuestion, KanbanTask } from '../../agi/types.js';
import type { DynamicKanbanTask } from '../../components/v2/DynamicKanbanBox.js';

export interface UIManagerState {
	toolExecutions: Map<string, ToolExecution>;
	kanbanTasks: DynamicKanbanTask[];
	feedbacks: FluiFeedback[];
	currentQuestion?: UserQuestion;
	questionResolver?: (answer: string) => void;
}

export function useUIManager() {
	const [state, setState] = useState<UIManagerState>({
		toolExecutions: new Map(),
		kanbanTasks: [],
		feedbacks: [],
		currentQuestion: undefined,
		questionResolver: undefined
	});
	
	/**
	 * Adicionar/atualizar tool execution
	 */
	const updateToolExecution = useCallback((toolExec: ToolExecution) => {
		setState(prev => {
			const newMap = new Map(prev.toolExecutions);
			newMap.set(toolExec.id, toolExec);
			return { ...prev, toolExecutions: newMap };
		});
	}, []);
	
	/**
	 * Remover tool execution (quando concluída há muito tempo)
	 */
	const removeToolExecution = useCallback((toolId: string) => {
		setState(prev => {
			const newMap = new Map(prev.toolExecutions);
			newMap.delete(toolId);
			return { ...prev, toolExecutions: newMap };
		});
	}, []);
	
	/**
	 * Atualizar kanban tasks
	 */
	const updateKanbanTasks = useCallback((tasks: KanbanTask[]) => {
		const dynamicTasks: DynamicKanbanTask[] = tasks.map(task => ({
			id: task.id,
			title: task.title,
			status: task.status,
			column: task.column,
			description: task.metadata?.description,
			metadata: task.metadata
		}));
		
		setState(prev => ({ ...prev, kanbanTasks: dynamicTasks }));
	}, []);
	
	/**
	 * Adicionar feedback
	 */
	const addFeedback = useCallback((feedback: FluiFeedback) => {
		setState(prev => ({
			...prev,
			feedbacks: [...prev.feedbacks, feedback]
		}));
	}, []);
	
	/**
	 * Limpar feedbacks antigos
	 */
	const clearOldFeedbacks = useCallback((maxAge: number = 30000) => {
		const now = Date.now();
		setState(prev => ({
			...prev,
			feedbacks: prev.feedbacks.filter(f => now - f.timestamp < maxAge)
		}));
	}, []);
	
	/**
	 * Fazer pergunta ao usuário
	 */
	const askUser = useCallback((question: UserQuestion): Promise<string> => {
		return new Promise((resolve) => {
			setState(prev => ({
				...prev,
				currentQuestion: question,
				questionResolver: resolve
			}));
		});
	}, []);
	
	/**
	 * Responder pergunta
	 */
	const answerQuestion = useCallback((answer: string) => {
		setState(prev => {
			if (prev.questionResolver) {
				prev.questionResolver(answer);
			}
			return {
				...prev,
				currentQuestion: undefined,
				questionResolver: undefined
			};
		});
	}, []);
	
	/**
	 * Limpar tudo
	 */
	const clearAll = useCallback(() => {
		setState({
			toolExecutions: new Map(),
			kanbanTasks: [],
			feedbacks: [],
			currentQuestion: undefined,
			questionResolver: undefined
		});
	}, []);
	
	return {
		state,
		updateToolExecution,
		removeToolExecution,
		updateKanbanTasks,
		addFeedback,
		clearOldFeedbacks,
		askUser,
		answerQuestion,
		clearAll,
		
		// Computed values
		toolExecutionsArray: Array.from(state.toolExecutions.values()),
		showKanban: state.kanbanTasks.length > 0,
		hasQuestion: !!state.currentQuestion
	};
}
