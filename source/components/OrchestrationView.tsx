import React from 'react';
import { Box, Text } from 'ink';
import { KanbanTask } from '../agi/types.js';

interface Props {
	tasks: KanbanTask[];
}

/**
 * VISUALIZAÇÃO DA ORQUESTRAÇÃO AGI
 * 
 * Mostra o Kanban de 8 colunas com todas as tarefas em tempo real
 */
export const OrchestrationView: React.FC<Props> = ({ tasks }) => {
	const columns = [
		{ key: 'received', title: '📥 RECEBIDO', color: '#9CA3AF' },
		{ key: 'planning', title: '🎯 PLANEJAMENTO', color: '#60A5FA' },
		{ key: 'execution_queue', title: '⚡ FILA', color: '#FBBF24' },
		{ key: 'in_progress', title: '🔧 EM ANDAMENTO', color: '#F59E0B' },
		{ key: 'review', title: '🔍 REVISÃO', color: '#8B5CF6' },
		{ key: 'completed', title: '✅ CONCLUÍDO', color: '#10B981' },
		{ key: 'replanning', title: '🔄 REPLANEJAMENTO', color: '#EF4444' },
		{ key: 'delivery', title: '🚀 ENTREGA', color: '#059669' },
	];

	return (
		<Box flexDirection="column" borderStyle="double" borderColor="#8B5CF6" paddingX={2} paddingY={1} marginY={1}>
			<Box marginBottom={1}>
				<Text bold color="#A78BFA">🧠 ORQUESTRAÇÃO AGI - KANBAN AUTÔNOMO</Text>
			</Box>

			{columns.map(column => {
				const columnTasks = tasks.filter(t => t.column === column.key);
				
				if (columnTasks.length === 0) return null;

				return (
					<Box key={column.key} flexDirection="column" marginBottom={1}>
						<Text bold color={column.color}>
							{column.title} ({columnTasks.length})
						</Text>
						
						{columnTasks.map(task => (
							<Box key={task.id} marginLeft={2} flexDirection="column">
								<Text color="#E5E7EB">
									• {task.title}
								</Text>
								
								{task.metadata.agentType && (
									<Text color="#9CA3AF" dimColor>
									  └ Agente: {task.metadata.agentType}
									</Text>
								)}
								
								{task.metadata.estimatedCost && (
									<Text color="#9CA3AF" dimColor>
									  └ Custo: {task.metadata.estimatedCost}/10
									</Text>
								)}
							</Box>
						))}
					</Box>
				);
			})}

			{/* Estatísticas */}
			<Box marginTop={1} borderStyle="single" borderColor="#6B7280" paddingX={1}>
				<Text color="#9CA3AF">
					Total: {tasks.length} tarefas | 
					Concluídas: {tasks.filter(t => t.column === 'completed' || t.column === 'delivery').length} | 
					Em execução: {tasks.filter(t => t.column === 'in_progress').length}
				</Text>
			</Box>
		</Box>
	);
};
