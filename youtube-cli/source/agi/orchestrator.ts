import OpenAI from 'openai';
import { getConfig } from '../llm-config.js';
import { loadQwenCredentials, getValidAccessToken } from '../qwen-oauth.js';
import { KanbanColumn, KanbanTask, UtilityScore } from './types.js';
import { SpecializedAgent, AgentType } from './specialized-agents.js';
import { IntentionAnalyzer } from './intention-analyzer.js';
import { PromptEngineer } from './prompt-engineer.js';
import { AutomationAgent } from './automation-agent.js';

/**
 * ORQUESTRADOR CENTRAL DO FLUI
 * 
 * O cérebro do sistema AGI. Responsável por:
 * 1. Decompor tarefas em sub-tarefas atômicas
 * 2. Selecionar e atribuir Agentes Especializados
 * 3. Gerar prompts dinâmicos otimizados
 * 4. Monitorar execução e replanejar quando necessário
 */
export class CentralOrchestrator {
	private openai: OpenAI;
	private kanban: Map<string, KanbanTask> = new Map();
	private agents: Map<AgentType, SpecializedAgent> = new Map();
	private intentionAnalyzer: IntentionAnalyzer;
	private promptEngineer: PromptEngineer;
	private automationAgent: AutomationAgent;
	private taskIdCounter = 0;

	constructor() {
		this.intentionAnalyzer = new IntentionAnalyzer();
		this.promptEngineer = new PromptEngineer();
		this.automationAgent = new AutomationAgent();
		this.initializeOpenAI();
		this.initializeAgents();
	}

	private async initializeOpenAI(): Promise<void> {
		const config = getConfig();
		const qwenCreds = loadQwenCredentials();
		let endpoint = config.endpoint;
		let apiKey = config.apiKey || 'not-needed';

		if (qwenCreds?.access_token) {
			const validToken = await getValidAccessToken();
			if (validToken) {
				apiKey = validToken;
				const resourceUrl = qwenCreds.resource_url || 'portal.qwen.ai';
				endpoint = `https://${resourceUrl}/v1`;
			}
		}

		this.openai = new OpenAI({ baseURL: endpoint, apiKey });
	}

	private initializeAgents(): void {
		// Inicializar agentes especializados
		this.agents.set('research', new SpecializedAgent('research', this.openai));
		this.agents.set('code', new SpecializedAgent('code', this.openai));
		this.agents.set('automation', new SpecializedAgent('automation', this.openai));
		this.agents.set('analysis', new SpecializedAgent('analysis', this.openai));
		this.agents.set('synthesis', new SpecializedAgent('synthesis', this.openai));
	}

	/**
	 * PONTO DE ENTRADA PRINCIPAL
	 * Recebe o prompt do usuário e orquestra toda a execução
	 */
	async orchestrate(
		userPrompt: string,
		workDir: string,
		onProgress?: (message: string, kanban?: KanbanTask[]) => void
	): Promise<string> {
		try {
			// FASE 1: Análise de Intenção
			onProgress?.('🧠 Analisando intenção e extraindo requisitos...');
			const intention = await this.intentionAnalyzer.analyze(userPrompt, this.openai);

			// FASE 2: Criar tarefa principal no Kanban (Coluna 1: Recebido)
			const mainTask = this.createTask(
				intention.mainGoal,
				'received',
				undefined,
				{ intention }
			);
			onProgress?.('📋 Tarefa recebida no Kanban', this.getKanbanSnapshot());

			// FASE 3: Planejamento - Decompor em sub-tarefas (Coluna 2: Planejamento)
			await this.moveTask(mainTask.id, 'planning');
			onProgress?.('🎯 Planejando decomposição de tarefas...', this.getKanbanSnapshot());
			
			const subTasks = await this.decomposeTask(mainTask, intention);
			
			// FASE 4: Mover sub-tarefas para Fila de Execução (Coluna 3)
			for (const subTask of subTasks) {
				await this.moveTask(subTask.id, 'execution_queue');
			}
			await this.moveTask(mainTask.id, 'in_progress');
			onProgress?.('⚡ Sub-tarefas na fila de execução', this.getKanbanSnapshot());

			// FASE 5: Executar sub-tarefas sequencialmente
			const results: Map<string, string> = new Map();
			
			for (const subTask of subTasks) {
				const result = await this.executeSubTask(subTask, workDir, onProgress);
				results.set(subTask.id, result);
			}

			// FASE 6: Integração e Entrega (Coluna 8)
			const finalResult = await this.synthesizeResults(mainTask, subTasks, results);
			await this.moveTask(mainTask.id, 'delivery');
			onProgress?.('✅ Tarefa concluída e entregue!', this.getKanbanSnapshot());

			return finalResult;

		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			return `Erro na orquestração: ${errorMsg}`;
		}
	}

	/**
	 * DECOMPOSIÇÃO DE TAREFA (Chain of Thought Avançado)
	 * Quebra a tarefa principal em sub-tarefas atômicas
	 */
	private async decomposeTask(
		mainTask: KanbanTask,
		intention: any
	): Promise<KanbanTask[]> {
		const decompositionPrompt = `Você é o Orquestrador Central do FLUI, um AGI superior.

TAREFA PRINCIPAL: ${mainTask.title}
OBJETIVO: ${intention.mainGoal}
RESTRIÇÕES: ${JSON.stringify(intention.constraints)}
CRITÉRIOS DE SUCESSO: ${JSON.stringify(intention.successCriteria)}

Decomponha esta tarefa em sub-tarefas ATÔMICAS e SEQUENCIAIS.

Para cada sub-tarefa, defina:
1. Título claro e específico
2. Tipo de agente necessário (research, code, automation, analysis, synthesis)
3. Dependências (IDs de sub-tarefas que devem ser concluídas antes)
4. Ferramentas necessárias
5. Critério de validação

Retorne APENAS um JSON array no formato:
[
  {
    "title": "string",
    "agentType": "research|code|automation|analysis|synthesis",
    "dependencies": ["task-id"],
    "tools": ["tool1", "tool2"],
    "validation": "critério de sucesso",
    "estimatedCost": 1-10 (1=barato, 10=caro)
  }
]`;

		const response = await this.openai.chat.completions.create({
			model: getConfig().model,
			messages: [{ role: 'user', content: decompositionPrompt }],
			temperature: 0.3, // Baixa temperatura para planejamento preciso
		});

		const content = response.choices[0]?.message?.content || '[]';
		const subTasksData = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

		// Criar sub-tarefas no Kanban
		const subTasks: KanbanTask[] = [];
		for (const data of subTasksData) {
			const subTask = this.createTask(
				data.title,
				'planning',
				mainTask.id,
				{
					agentType: data.agentType,
					dependencies: data.dependencies,
					tools: data.tools,
					validation: data.validation,
					estimatedCost: data.estimatedCost,
				}
			);
			subTasks.push(subTask);
		}

		return subTasks;
	}

	/**
	 * EXECUÇÃO DE SUB-TAREFA
	 * Seleciona agente, gera prompt otimizado, executa e valida
	 */
	private async executeSubTask(
		subTask: KanbanTask,
		workDir: string,
		onProgress?: (message: string, kanban?: KanbanTask[]) => void
	): Promise<string> {
		// Mover para "Em Andamento" (Coluna 4)
		await this.moveTask(subTask.id, 'in_progress');
		onProgress?.(
			`🔧 Executando: ${subTask.title}`,
			this.getKanbanSnapshot()
		);

		// Selecionar agente especializado
		const agentType = subTask.metadata.agentType as AgentType;
		const agent = this.agents.get(agentType);

		if (!agent) {
			throw new Error(`Agente não encontrado: ${agentType}`);
		}

		// Gerar prompt dinâmico de 4 blocos
		const agentPrompt = this.promptEngineer.generateAgentPrompt(
			agent.type,
			subTask,
			this.getContextForTask(subTask),
			workDir
		);

		try {
			// Executar com o agente especializado
			const result = await agent.execute(agentPrompt, subTask.metadata.tools);

			// Mover para Revisão (Coluna 5)
			await this.moveTask(subTask.id, 'review');
			onProgress?.(
				`🔍 Revisando: ${subTask.title}`,
				this.getKanbanSnapshot()
			);

			// Validar resultado
			const isValid = await this.validateResult(subTask, result);

			if (isValid) {
				// Mover para Concluído/Integração (Coluna 6)
				await this.moveTask(subTask.id, 'completed');
				subTask.metadata.result = result;
				onProgress?.(
					`✅ Concluído: ${subTask.title}`,
					this.getKanbanSnapshot()
				);
				return result;
			} else {
				// Mover para Replanejamento (Coluna 7)
				await this.moveTask(subTask.id, 'replanning');
				onProgress?.(
					`🔄 Replanejando: ${subTask.title}`,
					this.getKanbanSnapshot()
				);
				
				// Replanejar e executar novamente
				return await this.replanAndExecute(subTask, workDir, onProgress);
			}

		} catch (error) {
			// Erro na execução - mover para Replanejamento
			await this.moveTask(subTask.id, 'replanning');
			onProgress?.(
				`⚠️ Erro em: ${subTask.title} - Replanejando...`,
				this.getKanbanSnapshot()
			);
			
			return await this.replanAndExecute(subTask, workDir, onProgress);
		}
	}

	/**
	 * REPLANEJAMENTO AUTOMÁTICO
	 * Gera nova estratégia e tenta novamente
	 */
	private async replanAndExecute(
		subTask: KanbanTask,
		workDir: string,
		onProgress?: (message: string, kanban?: KanbanTask[]) => void
	): Promise<string> {
		const replanPrompt = `A sub-tarefa "${subTask.title}" falhou ou não passou na validação.

VALIDAÇÃO ESPERADA: ${subTask.metadata.validation}
RESULTADO ANTERIOR: ${subTask.metadata.result || 'Falha na execução'}

Gere uma NOVA ESTRATÉGIA para executar esta sub-tarefa com sucesso.
Considere:
1. Usar ferramentas diferentes
2. Dividir em passos menores
3. Adicionar verificações intermediárias

Retorne um JSON:
{
  "newStrategy": "descrição da nova estratégia",
  "newTools": ["tool1", "tool2"],
  "newAgentType": "research|code|automation|analysis|synthesis"
}`;

		const response = await this.openai.chat.completions.create({
			model: getConfig().model,
			messages: [{ role: 'user', content: replanPrompt }],
			temperature: 0.5,
		});

		const content = response.choices[0]?.message?.content || '{}';
		const newPlan = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

		// Atualizar sub-tarefa com nova estratégia
		subTask.metadata.agentType = newPlan.newAgentType;
		subTask.metadata.tools = newPlan.newTools;
		subTask.metadata.strategy = newPlan.newStrategy;

		// Mover de volta para fila de execução
		await this.moveTask(subTask.id, 'execution_queue');
		
		// Tentar executar novamente
		return await this.executeSubTask(subTask, workDir, onProgress);
	}

	/**
	 * VALIDAÇÃO DE RESULTADO
	 * Verifica se o resultado atende aos critérios
	 */
	private async validateResult(subTask: KanbanTask, result: string): Promise<boolean> {
		const validationPrompt = `Você é um Validador Rigoroso.

SUB-TAREFA: ${subTask.title}
CRITÉRIO DE VALIDAÇÃO: ${subTask.metadata.validation}
RESULTADO OBTIDO: ${result.substring(0, 1000)}

O resultado atende COMPLETAMENTE ao critério de validação?

Retorne APENAS um JSON:
{
  "isValid": true/false,
  "confidence": 0-100,
  "reason": "explicação breve"
}`;

		const response = await this.openai.chat.completions.create({
			model: getConfig().model,
			messages: [{ role: 'user', content: validationPrompt }],
			temperature: 0.1,
		});

		const content = response.choices[0]?.message?.content || '{"isValid": false, "confidence": 0}';
		const validation = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

		return validation.isValid && validation.confidence >= 80;
	}

	/**
	 * SÍNTESE DE RESULTADOS
	 * Integra todos os resultados das sub-tarefas
	 */
	private async synthesizeResults(
		mainTask: KanbanTask,
		subTasks: KanbanTask[],
		results: Map<string, string>
	): Promise<string> {
		const synthesisAgent = this.agents.get('synthesis');
		if (!synthesisAgent) {
			throw new Error('Agente de síntese não encontrado');
		}

		const synthesisPrompt = `Você é o Agente de Síntese Final.

TAREFA PRINCIPAL: ${mainTask.title}
OBJETIVO: ${mainTask.metadata.intention?.mainGoal}

RESULTADOS DAS SUB-TAREFAS:
${Array.from(results.entries()).map(([id, result], idx) => {
	const subTask = subTasks.find(t => t.id === id);
	return `${idx + 1}. ${subTask?.title}:\n${result}\n`;
}).join('\n')}

Sintetize todos os resultados em uma resposta final COMPLETA e COERENTE que atenda ao objetivo principal.

Formato de saída: ${mainTask.metadata.intention?.outputFormat || 'Texto claro e estruturado'}`;

		return await synthesisAgent.execute(synthesisPrompt, []);
	}

	/**
	 * UTILITY SCORE (Custo-Benefício)
	 * Calcula a pontuação utilitária de uma estratégia
	 */
	private calculateUtilityScore(
		qualityScore: number,
		timeCost: number,
		resourceCost: number
	): UtilityScore {
		// Utility = Qualidade / (Tempo * Recursos)
		const utility = qualityScore / (timeCost * resourceCost);
		
		return {
			quality: qualityScore,
			time: timeCost,
			resources: resourceCost,
			utility,
		};
	}

	// ==================== GERENCIAMENTO DO KANBAN ====================

	private createTask(
		title: string,
		column: KanbanColumn,
		parentId?: string,
		metadata?: any
	): KanbanTask {
		const task: KanbanTask = {
			id: `task-${++this.taskIdCounter}`,
			title,
			column,
			status: column === 'completed' ? 'done' : column === 'in_progress' ? 'in_progress' : 'todo',
			parentId,
			metadata: metadata || {},
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		this.kanban.set(task.id, task);
		return task;
	}

	private async moveTask(taskId: string, newColumn: KanbanColumn): Promise<void> {
		const task = this.kanban.get(taskId);
		if (!task) return;

		task.column = newColumn;
		task.updatedAt = Date.now();

		// Atualizar status para compatibilidade com UI
		if (newColumn === 'completed' || newColumn === 'delivery') {
			task.status = 'done';
		} else if (newColumn === 'in_progress') {
			task.status = 'in_progress';
		} else {
			task.status = 'todo';
		}
	}

	private getKanbanSnapshot(): KanbanTask[] {
		return Array.from(this.kanban.values());
	}

	private getContextForTask(subTask: KanbanTask): any {
		// Buscar resultados de dependências
		const dependencies = subTask.metadata.dependencies || [];
		const contextData: any = {};

		for (const depId of dependencies) {
			const depTask = this.kanban.get(depId);
			if (depTask?.metadata.result) {
				contextData[depId] = depTask.metadata.result;
			}
		}

		return contextData;
	}
}
