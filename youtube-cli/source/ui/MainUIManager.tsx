/**
 * MainUIManager - Gerenciador principal da UI com todos os novos componentes
 * 
 * Integra:
 * - ToolExecutionBox: Box dinâmico para cada tool
 * - DynamicKanbanBox: Kanban dinâmico e elegante
 * - FluiFeedbackBox: Feedback breve do FLUI
 * - UserQuestionBox: Sistema de perguntas ao usuário
 */

import React, { useState, useEffect } from 'react';
import { Box } from 'ink';
import { ToolExecutionBox } from '../components/v2/ToolExecutionBox.js';
import { DynamicKanbanBox, DynamicKanbanTask } from '../components/v2/DynamicKanbanBox.js';
import { FluiFeedbackBox } from '../components/v2/FluiFeedbackBox.js';
import { UserQuestionBox } from '../components/v2/UserQuestionBox.js';
import type { FluiFeedback, ToolExecution, UserQuestion } from '../agi/types.js';

interface MainUIManagerProps {
	// Estado de tools em execução
	toolExecutions: ToolExecution[];
	
	// Estado do Kanban
	kanbanTasks: DynamicKanbanTask[];
	showKanban: boolean;
	
	// Feedbacks do FLUI
	feedbacks: FluiFeedback[];
	maxFeedbacks?: number;
	
	// Sistema de perguntas
	currentQuestion?: UserQuestion;
	onAnswerQuestion?: (answer: string) => void;
}

/**
 * MainUIManager Component
 */
export const MainUIManager: React.FC<MainUIManagerProps> = ({
	toolExecutions,
	kanbanTasks,
	showKanban,
	feedbacks,
	maxFeedbacks = 3,
	currentQuestion,
	onAnswerQuestion
}) => {
	const [questionAnswer, setQuestionAnswer] = useState('');
	
	// Limitar feedbacks recentes
	const recentFeedbacks = feedbacks.slice(-maxFeedbacks);
	
	return (
		<Box flexDirection="column">
			{/* FEEDBACKS DO FLUI (últimos N) */}
			{recentFeedbacks.map((feedback, idx) => (
				<FluiFeedbackBox
					key={`${feedback.timestamp}-${idx}`}
					message={feedback.message}
					type={feedback.type}
				/>
			))}
			
			{/* KANBAN (se ativo) */}
			{showKanban && kanbanTasks.length > 0 && (
				<DynamicKanbanBox
					tasks={kanbanTasks}
					title="KANBAN"
					compact={false}
				/>
			)}
			
			{/* TOOL EXECUTIONS (todas as tools ativas) */}
			{toolExecutions.map((toolExec) => (
				<ToolExecutionBox
					key={toolExec.id}
					name={toolExec.name}
					args={toolExec.args}
					status={toolExec.status}
					result={toolExec.result}
					startTime={toolExec.startTime}
					endTime={toolExec.endTime}
				/>
			))}
			
			{/* PERGUNTA AO USUÁRIO (se houver) */}
			{currentQuestion && onAnswerQuestion && (
				<UserQuestionBox
					question={currentQuestion.question}
					placeholder={currentQuestion.placeholder}
					value={questionAnswer}
					onChange={setQuestionAnswer}
					onSubmit={(answer) => {
						onAnswerQuestion(answer);
						setQuestionAnswer('');
					}}
				/>
			)}
		</Box>
	);
};

MainUIManager.displayName = 'MainUIManager';
