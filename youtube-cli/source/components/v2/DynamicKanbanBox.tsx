/**
 * DynamicKanbanBox - Kanban Dinâmico e Elegante
 * 
 * Características:
 * - Atualização em tempo real sem piscar
 * - Tasks marcadas com cores dinâmicas (laranja = em andamento, verde = concluído)
 * - UI elegante e compacta
 * - Suporte para múltiplas colunas do workflow AGI
 */

import React from 'react';
import { Box, Text } from 'ink';

export interface DynamicKanbanTask {
	id: string;
	title: string;
	status: 'todo' | 'in_progress' | 'done';
	column?: string;
	description?: string;
	metadata?: any;
}

interface DynamicKanbanBoxProps {
	tasks: DynamicKanbanTask[];
	title?: string;
	compact?: boolean;
}

/**
 * Configuração de cores e ícones por coluna
 */
const COLUMN_CONFIG = {
	received: {
		label: '📥 Recebido',
		color: 'cyan',
		icon: '📥',
		bgIcon: '⚪'
	},
	planning: {
		label: '🎯 Planejamento',
		color: 'blue',
		icon: '📋',
		bgIcon: '⚪'
	},
	execution_queue: {
		label: '⏳ Fila',
		color: 'magenta',
		icon: '⏳',
		bgIcon: '⚪'
	},
	in_progress: {
		label: '🔧 Em Andamento',
		color: 'yellow',
		icon: '🟠',
		bgIcon: '🟠'
	},
	review: {
		label: '🔍 Revisão',
		color: 'blue',
		icon: '🔍',
		bgIcon: '⚪'
	},
	completed: {
		label: '✅ Concluído',
		color: 'green',
		icon: '✓',
		bgIcon: '✅'
	},
	replanning: {
		label: '🔄 Replanejamento',
		color: 'red',
		icon: '🔄',
		bgIcon: '🔴'
	},
	delivery: {
		label: '🚀 Entrega',
		color: 'green',
		icon: '🚀',
		bgIcon: '✅'
	},
	// Fallback para status genéricos
	todo: {
		label: 'A Fazer',
		color: 'gray',
		icon: '⚪',
		bgIcon: '⚪'
	},
	done: {
		label: 'Concluído',
		color: 'green',
		icon: '✓',
		bgIcon: '✅'
	}
};

/**
 * Obter configuração de coluna
 */
const getColumnConfig = (columnOrStatus: string) => {
	return COLUMN_CONFIG[columnOrStatus as keyof typeof COLUMN_CONFIG] || COLUMN_CONFIG.todo;
};

/**
 * Calcular progresso
 */
const calculateProgress = (tasks: DynamicKanbanTask[]): {
	total: number;
	completed: number;
	inProgress: number;
	percentage: number;
} => {
	const total = tasks.length;
	const completed = tasks.filter(t => 
		t.status === 'done' || 
		t.column === 'completed' || 
		t.column === 'delivery'
	).length;
	const inProgress = tasks.filter(t => 
		t.status === 'in_progress' || 
		t.column === 'in_progress'
	).length;
	const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
	
	return { total, completed, inProgress, percentage };
};

/**
 * Agrupar tasks por coluna/status
 */
const groupTasksByColumn = (tasks: DynamicKanbanTask[]): Map<string, DynamicKanbanTask[]> => {
	const groups = new Map<string, DynamicKanbanTask[]>();
	
	for (const task of tasks) {
		const key = task.column || task.status;
		if (!groups.has(key)) {
			groups.set(key, []);
		}
		groups.get(key)!.push(task);
	}
	
	return groups;
};

/**
 * DynamicKanbanBox Component
 */
export const DynamicKanbanBox: React.FC<DynamicKanbanBoxProps> = React.memo(({
	tasks,
	title = 'KANBAN',
	compact = false
}) => {
	const progress = calculateProgress(tasks);
	const groupedTasks = groupTasksByColumn(tasks);
	
	// Ordem de colunas para exibição
	const columnOrder = [
		'received', 'planning', 'execution_queue', 'in_progress',
		'review', 'completed', 'replanning', 'delivery'
	];
	
	return (
		<Box 
			flexDirection="column" 
			borderStyle="round" 
			borderColor="#8B5CF6"
			paddingX={1}
			paddingY={1}
			marginY={1}
		>
			{/* HEADER com progresso */}
			<Box justifyContent="space-between" width="100%">
				<Text color="#A78BFA" bold>📋 {title.toUpperCase()}</Text>
				<Box>
					<Text color="#10B981" bold>{progress.percentage}%</Text>
					<Text color="gray" dimColor> ({progress.completed}/{progress.total})</Text>
				</Box>
			</Box>
			
			{/* BARRA DE PROGRESSO */}
			{!compact && (
				<Box marginTop={1} marginBottom={1}>
					<Text color="gray">[</Text>
					<Text color="green">{'█'.repeat(Math.floor(progress.percentage / 5))}</Text>
					<Text color="gray">{'░'.repeat(20 - Math.floor(progress.percentage / 5))}</Text>
					<Text color="gray">]</Text>
				</Box>
			)}
			
			{/* TASKS POR COLUNA */}
			{columnOrder.map(columnKey => {
				const columnTasks = groupedTasks.get(columnKey);
				if (!columnTasks || columnTasks.length === 0) return null;
				
				const config = getColumnConfig(columnKey);
				
				return (
					<Box key={columnKey} flexDirection="column" marginTop={1}>
						{/* Cabeçalho da coluna */}
						<Text color={config.color} bold>
							{config.icon} {config.label} ({columnTasks.length})
						</Text>
						
						{/* Tasks da coluna */}
						{columnTasks.map((task, idx) => {
							const taskConfig = getColumnConfig(task.column || task.status);
							
							return (
								<Box key={task.id} marginLeft={2} flexDirection="column">
									<Box>
										<Text color={taskConfig.color}>
											{taskConfig.bgIcon} {task.title}
										</Text>
									</Box>
									{!compact && task.description && (
										<Box marginLeft={2}>
											<Text color="gray" dimColor>
												{task.description}
											</Text>
										</Box>
									)}
								</Box>
							);
						})}
					</Box>
				);
			})}
			
			{/* ESTATÍSTICAS (se não houver tasks, mostrar mensagem) */}
			{tasks.length === 0 && (
				<Box marginTop={1} justifyContent="center">
					<Text color="gray" dimColor italic>Nenhuma tarefa no momento</Text>
				</Box>
			)}
			
			{/* FOOTER com estatísticas detalhadas (se não compact) */}
			{!compact && tasks.length > 0 && (
				<Box 
					marginTop={1} 
					borderStyle="single" 
					borderColor="#6B7280" 
					paddingX={1}
				>
					<Text color="gray" dimColor>
						Total: {progress.total} | Em andamento: {progress.inProgress} | Concluídas: {progress.completed}
					</Text>
				</Box>
			)}
		</Box>
	);
}, (prevProps, nextProps) => {
	// Re-renderizar apenas se tasks mudarem significativamente
	if (prevProps.tasks.length !== nextProps.tasks.length) return false;
	
	// Verificar se status de alguma task mudou
	return prevProps.tasks.every((task, idx) => {
		const nextTask = nextProps.tasks[idx];
		return (
			task.id === nextTask?.id &&
			task.status === nextTask?.status &&
			task.column === nextTask?.column
		);
	});
});

DynamicKanbanBox.displayName = 'DynamicKanbanBox';
