/**
 * TIPOS DO SISTEMA AGI
 */

/**
 * Colunas do Kanban Autônomo (8 Colunas)
 */
export type KanbanColumn =
	| 'received'          // 1. Recebido
	| 'planning'          // 2. Planejamento
	| 'execution_queue'   // 3. Fila de Execução
	| 'in_progress'       // 4. Em Andamento
	| 'review'            // 5. Revisão
	| 'completed'         // 6. Concluído/Integração
	| 'replanning'        // 7. Replanejamento
	| 'delivery';         // 8. Entrega

/**
 * Task do Kanban AGI
 */
export interface KanbanTask {
	id: string;
	title: string;
	column: KanbanColumn;
	status: 'todo' | 'in_progress' | 'done'; // Para compatibilidade com UI existente
	description?: string;
	parentId?: string; // ID da tarefa pai (se for sub-tarefa)
	metadata: {
		agentType?: string;
		dependencies?: string[];
		tools?: string[];
		validation?: string;
		estimatedCost?: number;
		result?: string;
		strategy?: string;
		intention?: any;
		[key: string]: any;
	};
	createdAt: number;
	updatedAt: number;
}

/**
 * Utility Score (Custo-Benefício)
 */
export interface UtilityScore {
	quality: number;      // 0-100
	time: number;         // Em segundos ou unidade de tempo
	resources: number;    // Custo em tokens/recursos
	utility: number;      // Qualidade / (Tempo * Recursos)
}

/**
 * Intenção Analisada
 */
export interface AnalyzedIntention {
	mainGoal: string;
	constraints: string[];
	successCriteria: string[];
	outputFormat: string;
	complexity: 'simple' | 'medium' | 'complex';
	estimatedSubTasks: number;
}

/**
 * Resultado de Agente
 */
export interface AgentResult {
	success: boolean;
	result: string;
	confidence: number;
	toolsUsed: string[];
	executionTime: number;
	error?: string;
}

/**
 * Prompt de 4 Blocos
 */
export interface FourBlockPrompt {
	identity: string;       // Bloco 1: Identidade e Função
	context: string;        // Bloco 2: Contexto e Objetivo
	tools: string;          // Bloco 3: Ferramentas e Automação
	output: string;         // Bloco 4: Formato de Saída e Validação
}
