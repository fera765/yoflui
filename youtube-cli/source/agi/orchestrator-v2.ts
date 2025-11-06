import OpenAI from 'openai';
import { getConfig } from '../llm-config.js';
import { loadQwenCredentials, getValidAccessToken } from '../qwen-oauth.js';
import { KanbanColumn, KanbanTask, UtilityScore, FluiFeedback, ToolExecution } from './types.js';
import { SpecializedAgent, AgentType, ToolExecutionCallback } from './specialized-agents.js';
import { IntentionAnalyzer } from './intention-analyzer.js';
import { PromptEngineer } from './prompt-engineer.js';
import { AutomationAgent } from './automation-agent.js';
import { DualModeCoordinator, ExecutionMode } from './dual-mode-coordinator.js';
import { ProactiveErrorDetector } from './proactive-error-detector.js';
import { OutputOptimizer } from './output-optimizer.js';
import { FeedbackGenerator } from './feedback-generator.js';
import {
	loadOrCreateContext,
	recordIntermediateResult,
	recordResourceCreated,
	getContextForNextStep,
	resetExecutionState,
	updateContextCarryover,
} from '../context-manager.js';
import { getAllToolDefinitions } from '../tools/index.js';
import { ShortCircuitExecutor } from './short-circuit-executor.js';

/**
 * ORQUESTRADOR CENTRAL V2 - FLUI AGI SUPERIOR
 * 
 * Refinamentos implementados:
 * 1. ✅ Coordenação Cirúrgica com Memória Perfeita
 * 2. ✅ Raciocínio Deliberativo e Proativo
 * 3. ✅ Otimização de Output e Economia de Tokens
 * 4. ✅ Dualidade de Comportamento (AGI vs Assistente)
 * 
 * O cérebro do sistema AGI. Responsável por:
 * 1. Detectar modo de execução (Assistant vs AGI)
 * 2. Decompor tarefas em sub-tarefas atômicas
 * 3. Manter contexto perfeito entre todas as etapas
 * 4. Detectar e corrigir erros proativamente
 * 5. Otimizar output para economia de tokens
 * 6. Selecionar e atribuir Agentes Especializados
 * 7. Gerar prompts dinâmicos otimizados
 * 8. Monitorar execução e replanejar quando necessário
 */
export class CentralOrchestratorV2 {
	private openai: OpenAI | null = null;
	private kanban: Map<string, KanbanTask> = new Map();
	private agents: Map<AgentType, SpecializedAgent> = new Map();
	private intentionAnalyzer: IntentionAnalyzer | null = null;
	private promptEngineer: PromptEngineer;
	private automationAgent: AutomationAgent;
	private dualModeCoordinator: DualModeCoordinator | null = null;
	private errorDetector: ProactiveErrorDetector | null = null;
	private outputOptimizer: OutputOptimizer;
	private feedbackGenerator: FeedbackGenerator | null = null;
	private shortCircuit: ShortCircuitExecutor;
	private taskIdCounter = 0;
	private initialized = false;
	private replanAttempts: Map<string, number> = new Map();
	private workDir: string = process.cwd();
	private onFeedback?: (feedback: FluiFeedback) => void;
	private onToolExecution?: (toolExec: ToolExecution) => void;

	constructor() {
		this.promptEngineer = new PromptEngineer();
		this.automationAgent = new AutomationAgent();
		this.outputOptimizer = new OutputOptimizer();
		this.shortCircuit = new ShortCircuitExecutor();
	}
	
	/**
	 * Configurar callbacks para UI
	 */
	setCallbacks(callbacks: {
		onFeedback?: (feedback: FluiFeedback) => void;
		onToolExecution?: (toolExec: ToolExecution) => void;
	}) {
		this.onFeedback = callbacks.onFeedback;
		this.onToolExecution = callbacks.onToolExecution;
	}

	/**
	 * INICIALIZAÇÃO ASSÍNCRONA
	 */
	private async initialize(): Promise<void> {
		if (this.initialized) return;

		try {
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

			// Inicializar componentes do sistema superior
			this.intentionAnalyzer = new IntentionAnalyzer();
			this.dualModeCoordinator = new DualModeCoordinator(this.openai);
			this.errorDetector = new ProactiveErrorDetector(this.openai);
			this.feedbackGenerator = new FeedbackGenerator(this.openai);

			// Inicializar agentes especializados com callbacks
			const toolCallback: ToolExecutionCallback = (toolExec) => {
				if (this.onToolExecution) {
					this.onToolExecution(toolExec);
				}
			};
			
			this.agents.set('research', new SpecializedAgent('research', this.openai));
			this.agents.set('code', new SpecializedAgent('code', this.openai));
			this.agents.set('automation', new SpecializedAgent('automation', this.openai));
			this.agents.set('analysis', new SpecializedAgent('analysis', this.openai));
			this.agents.set('synthesis', new SpecializedAgent('synthesis', this.openai));
			
			// Configurar callbacks em todos os agentes
			for (const agent of this.agents.values()) {
				agent.setToolExecutionCallback(toolCallback);
			}

			this.initialized = true;
		} catch (error) {
			throw new Error(`Falha ao inicializar Orquestrador V2: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * PONTO DE ENTRADA PRINCIPAL - COM DETECÇÃO DE MODO
	 * 
	 * Novo fluxo:
	 * 1. Detectar modo (Assistant vs AGI)
	 * 2. Rotear para execução apropriada
	 * 3. Otimizar output final
	 */
	async orchestrate(
		userPrompt: string,
		workDir: string,
		onProgress?: (message: string, kanban?: KanbanTask[]) => void
	): Promise<{ result: string; mode: 'assistant' | 'agi' }> {
		try {
			await this.initialize();
			this.workDir = workDir;

			if (!this.openai || !this.intentionAnalyzer || !this.dualModeCoordinator) {
				throw new Error('Orquestrador não inicializado corretamente');
			}

			// NOVO: Resetar estado de execução para nova tarefa
			resetExecutionState(workDir);

			// FASE -1: SHORT-CIRCUIT para comandos simples e diretos
			const shortCircuitResult = await this.shortCircuit.tryShortCircuit(userPrompt, workDir);
			
			if (shortCircuitResult.handled) {
				onProgress?.(`⚡ Execução direta (short-circuit): ${shortCircuitResult.toolUsed}`);
				return { result: shortCircuitResult.result || '', mode: 'agi' };
			}

			// FASE 0: DECISÃO DE MODO (Assistant vs AGI)
			onProgress?.('🧠 Analisando complexidade da tarefa...');
			const modeDecision = await this.dualModeCoordinator.decidExecutionMode(userPrompt);

			onProgress?.(`📊 Modo detectado: ${modeDecision.mode.toUpperCase()} (${modeDecision.confidence}% confiança)`);

			// ROTEAMENTO DE MODO
			if (modeDecision.mode === 'assistant') {
				// MODO ASSISTENTE: Resposta direta, sem orquestração
				onProgress?.('💬 Executando em modo assistente (resposta direta)...');
				const directResponse = await this.dualModeCoordinator.executeAssistantMode(userPrompt);
				
				// Otimizar output
				const optimized = this.outputOptimizer.optimizeOutput(
					directResponse,
					'assistant_mode',
					'Resposta Direta',
					true
				);
				
				return { result: optimized.conciseSummary, mode: 'assistant' };
			}

			// MODO AGI: Orquestração completa
			const agiResult = await this.executeAGIMode(userPrompt, workDir, onProgress);
			return { result: agiResult, mode: 'agi' };

		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			return { result: `❌ Erro na orquestração: ${errorMsg}`, mode: 'agi' };
		}
	}

	/**
	 * EXECUÇÃO EM MODO AGI (Orquestração Completa)
	 */
	private async executeAGIMode(
		userPrompt: string,
		workDir: string,
		onProgress?: (message: string, kanban?: KanbanTask[]) => void
	): Promise<string> {
		if (!this.openai || !this.intentionAnalyzer) {
			throw new Error('Sistema não inicializado');
		}

		// FASE 1: Análise de Intenção (silencioso)
		const intention = await this.intentionAnalyzer.analyze(userPrompt, this.openai);

		// Prever possíveis problemas (silencioso)
		if (this.errorDetector) {
			const potentialIssues = await this.errorDetector.predictPotentialIssues(
				intention.mainGoal,
				[]
			);
		}

		// FEEDBACK: Informar criação do kanban
		if (this.feedbackGenerator && this.onFeedback) {
			const feedback = this.feedbackGenerator.generateKanbanCreationFeedback(userPrompt);
			this.onFeedback(feedback);
		}
		
		// FASE 2: Criar tarefa principal no Kanban
		const mainTask = this.createTask(
			intention.mainGoal,
			'received',
			undefined,
			{ intention }
		);
		// Enviar primeiro update do Kanban
		onProgress?.('', this.getKanbanSnapshot());

		// FASE 3: Planejamento - Decompor em sub-tarefas
		await this.moveTask(mainTask.id, 'planning');
		onProgress?.('', this.getKanbanSnapshot());
		
		const subTasks = await this.decomposeTask(mainTask, intention, userPrompt);

		// NOVO: Atualizar execution state com total de steps
		const context = loadOrCreateContext(undefined, workDir);
		context.executionState.totalSteps = subTasks.length;
		
		// FASE 4: Mover sub-tarefas para Fila de Execução
		for (const subTask of subTasks) {
			await this.moveTask(subTask.id, 'execution_queue');
		}
		await this.moveTask(mainTask.id, 'in_progress');
		// Update Kanban: tasks na fila
		onProgress?.('', this.getKanbanSnapshot());

		// FASE 5: Executar sub-tarefas sequencialmente COM CONTEXTO PERFEITO
		const results: Map<string, string> = new Map();
		
		for (let i = 0; i < subTasks.length; i++) {
			const subTask = subTasks[i];
			
			// Injetar contexto de etapas anteriores (silencioso)
			const contextData = getContextForNextStep(workDir);
			
			// Executar com detecção proativa de erros
			const result = await this.executeSubTaskWithErrorDetection(
				subTask,
				workDir,
				contextData,
				onProgress
			);
			
			results.set(subTask.id, result);
			
			// NOVO: Registrar resultado intermediário para próximas etapas
			recordIntermediateResult(
				subTask.id,
				subTask.title,
				result,
				subTask.metadata.tools || [],
				!result.includes('Error:'),
				workDir
			);
		}

		// FASE 6: Integração e Entrega
		const finalResult = await this.synthesizeResults(mainTask, subTasks, results);
		await this.moveTask(mainTask.id, 'delivery');

		// Update final do Kanban (todas tasks concluídas)
		onProgress?.('', this.getKanbanSnapshot());

		// Gerar resumo otimizado
		const resourcesCreated = context.executionState.resourcesCreated.map(
			r => `${r.type}: ${r.identifier}`
		);
		
		const optimizedSummary = this.outputOptimizer.generateExecutionSummary(
			mainTask.title,
			context.executionState.completedTasks.length,
			context.executionState.totalSteps,
			resourcesCreated,
			finalResult
		);

		// RESULTADO FINAL vem DEPOIS do Kanban completo
		return optimizedSummary;
	}

	/**
	 * NOVO: Execução de Sub-Tarefa COM DETECÇÃO PROATIVA DE ERROS E FEEDBACK
	 */
	private async executeSubTaskWithErrorDetection(
		subTask: KanbanTask,
		workDir: string,
		contextData: string,
		onProgress?: (message: string, kanban?: KanbanTask[]) => void
	): Promise<string> {
		// FEEDBACK: Informar o que vai fazer
		if (this.feedbackGenerator && this.onFeedback) {
			const feedback = await this.feedbackGenerator.generateToolExecutionFeedback(
				subTask.metadata.tools?.[0] || 'synthesis',
				{},
				subTask.title
			);
			this.onFeedback(feedback);
		}
		
		// Mover para "Em Andamento"
		await this.moveTask(subTask.id, 'in_progress');
		
		// NOVO: Progress otimizado
		const progressMsg = this.outputOptimizer.formatProgress(
			this.kanban.get(subTask.id)?.metadata.stepIndex || 0,
			subTask.metadata.totalSteps || 0,
			subTask.title,
			'in_progress'
		);
		onProgress?.(progressMsg, this.getKanbanSnapshot());

		// Selecionar agente especializado
		const agentType = subTask.metadata.agentType as AgentType;
		const agent = this.agents.get(agentType);

		if (!agent) {
			throw new Error(`Agente não encontrado: ${agentType}`);
		}

		// NOVO: VALIDAÇÃO PROATIVA - Verificar estratégia ANTES de executar
		if (this.errorDetector && subTask.metadata.tools && subTask.metadata.tools.length > 0) {
			const availableTools = getAllToolDefinitions().map((t: any) => t.function.name);
			const validation = await this.errorDetector.validateExecutionStrategy(
				subTask.metadata.tools[0], // Tool principal
				{}, // Args serão preenchidos pelo agent
				subTask.title,
				availableTools
			);
			
			if (!validation.isValid) {
				onProgress?.(`⚠️ Estratégia inválida detectada: ${validation.issues.join(', ')}`);
				throw new Error(`Validação falhou: ${validation.issues.join(', ')}`);
			}
		}
		
		// Gerar prompt dinâmico COM CONTEXTO INJETADO
		const agentPrompt = this.promptEngineer.generateAgentPrompt(
			agent.type,
			subTask,
			{ contextData, previousResults: this.getContextForTask(subTask) },
			workDir
		);

		try {
			// Executar agente
			const result = await agent.execute(agentPrompt, subTask.metadata.tools, workDir);

			// NOVO: DETECÇÃO PROATIVA DE ERROS
			if (this.errorDetector) {
				const errorAnalysis = await this.errorDetector.analyzeToolResult(
					agentType,
					subTask.metadata.tools || [],
					result,
					subTask.title
				);

				if (errorAnalysis.hasError && errorAnalysis.autoFixable) {
					onProgress?.(`⚠️ Erro detectado em ${subTask.title}, tentando autocorreção...`);
					
					// Tentar autocorreção
					const correction = await this.errorDetector.attemptAutoCorrection(
						errorAnalysis,
						agentType,
						subTask.metadata.tools || [],
						subTask.title
					);

					if (correction.corrected && correction.newArgs) {
						onProgress?.(`🔧 Aplicando correção automática...`);
						// Re-executar com nova estratégia
						return await agent.execute(
							correction.newStrategy || agentPrompt,
							subTask.metadata.tools,
							workDir
						);
					}
				}
			}

			// Mover para Revisão
			await this.moveTask(subTask.id, 'review');
			
			// Validar resultado
			const isValid = await this.validateResult(subTask, result);

			if (isValid) {
				await this.moveTask(subTask.id, 'completed');
				subTask.metadata.result = result;
				
				// FEEDBACK: Tarefa concluída
				if (this.feedbackGenerator && this.onFeedback) {
					const feedback = this.feedbackGenerator.generateTaskCompletionFeedback(
						subTask.title,
						true
					);
					this.onFeedback(feedback);
				}
				
				const completedMsg = this.outputOptimizer.formatProgress(
					subTask.metadata.stepIndex || 0,
					subTask.metadata.totalSteps || 0,
					subTask.title,
					'completed'
				);
				onProgress?.(completedMsg, this.getKanbanSnapshot());
				
				return result;
			} else {
				// Replanejamento se validação falhar
				return await this.handleValidationFailure(subTask, result, workDir, onProgress);
			}

		} catch (error) {
			return await this.handleExecutionError(subTask, error, workDir, onProgress);
		}
	}

	/**
	 * Tratar falha de validação
	 */
	private async handleValidationFailure(
		subTask: KanbanTask,
		result: string,
		workDir: string,
		onProgress?: (message: string, kanban?: KanbanTask[]) => void
	): Promise<string> {
		const attempts = this.replanAttempts.get(subTask.id) || 0;
		
		if (attempts >= 3) {
			// Aceitar resultado após 3 tentativas
			await this.moveTask(subTask.id, 'completed');
			subTask.metadata.result = result;
			onProgress?.(
				`⚠️ Aceitando resultado após ${attempts} tentativas: ${subTask.title}`,
				this.getKanbanSnapshot()
			);
			return result;
		}
		
		// Replanejar
		this.replanAttempts.set(subTask.id, attempts + 1);
		await this.moveTask(subTask.id, 'replanning');
		onProgress?.(
			`🔄 Replanejando (${attempts + 1}/3): ${subTask.title}`,
			this.getKanbanSnapshot()
		);
		
		return await this.replanAndExecute(subTask, workDir, onProgress);
	}

	/**
	 * Tratar erro de execução
	 */
	private async handleExecutionError(
		subTask: KanbanTask,
		error: any,
		workDir: string,
		onProgress?: (message: string, kanban?: KanbanTask[]) => void
	): Promise<string> {
		const attempts = this.replanAttempts.get(subTask.id) || 0;
		
		if (attempts >= 3) {
			const errorMsg = `Falha após ${attempts} tentativas: ${error instanceof Error ? error.message : String(error)}`;
			await this.moveTask(subTask.id, 'completed');
			subTask.metadata.result = errorMsg;
			onProgress?.(`⚠️ ${errorMsg}`, this.getKanbanSnapshot());
			return errorMsg;
		}
		
		this.replanAttempts.set(subTask.id, attempts + 1);
		await this.moveTask(subTask.id, 'replanning');
		onProgress?.(
			`⚠️ Erro em: ${subTask.title} - Replanejando (${attempts + 1}/3)...`,
			this.getKanbanSnapshot()
		);
		
		return await this.replanAndExecute(subTask, workDir, onProgress);
	}

	/**
	 * DECOMPOSIÇÃO DE TAREFA (mantida do original, com melhorias)
	 */
	private async decomposeTask(
		mainTask: KanbanTask,
		intention: any,
		userPrompt: string
	): Promise<KanbanTask[]> {
		if (!this.openai) throw new Error('OpenAI not initialized');

		const config = getConfig();
		
		const availableTools = [
			'write_file', 'read_file', 'edit_file', 'execute_shell',
			'find_files', 'search_text', 'read_folder', 
			'web_scraper', 'web_scraper_with_context',
			'intelligent_web_research', 'keyword_suggestions',
			'save_memory', 'search_youtube_comments'
		];
		
		const lowerGoal = intention.mainGoal.toLowerCase();
		const isComparison = lowerGoal.includes('compare') || lowerGoal.includes('vantagens') || 
			lowerGoal.includes('desvantagens') || lowerGoal.includes('diferença') || 
			lowerGoal.includes(' vs ') || lowerGoal.includes('versus');
		
		// CRÍTICO: Detectar se tarefa requer ferramentas do sistema
		const requiresTools = lowerGoal.includes('criar arquivo') || lowerGoal.includes('create file') ||
			lowerGoal.includes('escrever arquivo') || lowerGoal.includes('write file') ||
			lowerGoal.includes('ler arquivo') || lowerGoal.includes('read file') ||
			lowerGoal.includes('listar') || lowerGoal.includes('list') ||
			lowerGoal.includes('executar') || lowerGoal.includes('execute') ||
			lowerGoal.includes('buscar arquivo') || lowerGoal.includes('find file');
		
		const isSimpleTask = (intention.complexity === 'simple' || intention.estimatedSubTasks <= 2 || isComparison) && !requiresTools;
		
		if (isSimpleTask) {
			return [{
				id: `task-${++this.taskIdCounter}`,
				title: mainTask.title,
				column: 'planning',
				status: 'todo',
				parentId: mainTask.id,
				metadata: {
					agentType: 'synthesis',
					dependencies: [],
					tools: [],
					validation: intention.successCriteria?.[0] || 'Resposta clara e precisa',
					estimatedCost: 1,
					stepIndex: 0,
					totalSteps: 1,
				},
				createdAt: Date.now(),
				updatedAt: Date.now(),
			}];
		}
		
		const decompositionPrompt = `Você é o Orquestrador Central do FLUI AGI Superior.

🎯 PROMPT ORIGINAL DO USUÁRIO (CRÍTICO - Preserve TODOS os detalhes específicos):
"""
${userPrompt}
"""

TAREFA PRINCIPAL: ${mainTask.title}
OBJETIVO: ${intention.mainGoal}
RESTRIÇÕES: ${JSON.stringify(intention.constraints)}
CRITÉRIOS DE SUCESSO: ${JSON.stringify(intention.successCriteria)}

FERRAMENTAS DISPONÍVEIS:
${availableTools.join(', ')}

⚠️ REGRAS CRÍTICAS DE DECOMPOSIÇÃO:

1. CRIAR/ESCREVER ARQUIVO:
   → agentType: "code"
   → tools: ["write_file"]
   → Exemplo: Criar arquivo.txt → {"agentType":"code", "tools":["write_file"]}

2. LER ARQUIVO:
   → agentType: "code"
   → tools: ["read_file"]

3. LISTAR ARQUIVOS/DIRETÓRIOS:
   → agentType: "code"
   → tools: ["find_files", "read_folder"]

4. EXECUTAR COMANDO SHELL:
   → agentType: "automation"
   → tools: ["execute_shell"]

5. PESQUISA WEB:
   → agentType: "research"
   → tools: ["web_scraper", "intelligent_web_research"]

6. ANÁLISE/COMPARAÇÃO SEM FERRAMENTAS:
   → agentType: "synthesis"
   → tools: []

❌ NUNCA use agentType="synthesis" com tools=[] para tarefas que MODIFICAM ou LEEM o sistema!

⚠️ **CRÍTICO:** Ao criar sub-tarefas, PRESERVE todos os detalhes específicos do prompt original:
   - Nomes de arquivos EXATOS
   - Conteúdos EXATOS
   - Parâmetros específicos
   - Valores numéricos
   
NÃO REFORMULE de forma genérica! Use os detalhes EXATOS do prompt original!

Decomponha em sub-tarefas ATÔMICAS e SEQUENCIAIS.

Retorne APENAS JSON array:
[
  {
    "title": "string",
    "agentType": "research|code|automation|analysis|synthesis",
    "dependencies": ["task-id"],
    "tools": ["tool1"],
    "validation": "critério de sucesso",
    "estimatedCost": 1-10
  }
]`;

		const response = await this.openai.chat.completions.create({
			model: config.model || 'qwen-max',
			messages: [{ role: 'user', content: decompositionPrompt }],
			temperature: 0.3,
		});

		const content = response.choices[0]?.message?.content || '[]';
		
		let subTasksData: any[];
		try {
			const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
			subTasksData = JSON.parse(cleanContent);
			
			subTasksData = subTasksData.map(task => ({
				...task,
				tools: (task.tools || []).filter((tool: string) => availableTools.includes(tool))
			}));
		} catch (error) {
			subTasksData = [{
				title: mainTask.title,
				agentType: 'synthesis',
				dependencies: [],
				tools: [],
				validation: intention.successCriteria?.[0] || 'Tarefa completada',
				estimatedCost: 5,
			}];
		}

		// CRIAR SUB-TAREFAS COM VALIDAÇÃO E FALLBACK CRÍTICO
		const subTasks: KanbanTask[] = [];
		for (let i = 0; i < subTasksData.length; i++) {
			const data = subTasksData[i];
			
			// FALLBACK CRÍTICO: Detectar e corrigir ferramentas vazias
			let finalTools = data.tools || [];
			let finalAgentType = data.agentType || 'synthesis';
			
			const taskLower = (data.title || '').toLowerCase();
			
			// Se tarefa claramente requer ferramenta mas tools está vazio, corrigir!
			if (finalTools.length === 0) {
				if (taskLower.includes('criar arquivo') || taskLower.includes('escrever arquivo') || 
				    taskLower.includes('create file') || taskLower.includes('write file') ||
				    taskLower.includes('criar um arquivo') || taskLower.includes('crie um arquivo')) {
					finalTools = ['write_file'];
					finalAgentType = 'code';
					console.log(`[FALLBACK] Corrigido: "${data.title}" → tools=["write_file"], agentType="code"`);
				} else if (taskLower.includes('ler arquivo') || taskLower.includes('read file')) {
					finalTools = ['read_file'];
					finalAgentType = 'code';
					console.log(`[FALLBACK] Corrigido: "${data.title}" → tools=["read_file"]`);
				} else if (taskLower.includes('listar') || taskLower.includes('list')) {
					finalTools = ['find_files', 'read_folder'];
					finalAgentType = 'code';
					console.log(`[FALLBACK] Corrigido: "${data.title}" → tools=["find_files"]`);
				} else if (taskLower.includes('executar') || taskLower.includes('execute') || taskLower.includes('run')) {
					finalTools = ['execute_shell'];
					finalAgentType = 'automation';
					console.log(`[FALLBACK] Corrigido: "${data.title}" → tools=["execute_shell"]`);
				}
			}
			
			const subTask = this.createTask(
				data.title,
				'planning',
				mainTask.id,
				{
					agentType: finalAgentType,
					dependencies: data.dependencies,
					tools: finalTools,
					validation: data.validation,
					estimatedCost: data.estimatedCost,
					stepIndex: i,
					totalSteps: subTasksData.length,
				}
			);
			subTasks.push(subTask);
		}

		return subTasks;
	}

	/**
	 * REPLANEJAMENTO AUTOMÁTICO (mantido do original)
	 */
	private async replanAndExecute(
		subTask: KanbanTask,
		workDir: string,
		onProgress?: (message: string, kanban?: KanbanTask[]) => void
	): Promise<string> {
		if (!this.openai) throw new Error('OpenAI not initialized');

		const config = getConfig();
		const replanPrompt = `A sub-tarefa "${subTask.title}" falhou.

VALIDAÇÃO ESPERADA: ${subTask.metadata.validation}
RESULTADO ANTERIOR: ${subTask.metadata.result || 'Falha na execução'}

Gere uma NOVA ESTRATÉGIA.

Retorne JSON:
{
  "newStrategy": "descrição",
  "newTools": ["tool1"],
  "newAgentType": "research|code|automation|analysis|synthesis"
}`;

		const response = await this.openai.chat.completions.create({
			model: config.model || 'qwen-max',
			messages: [{ role: 'user', content: replanPrompt }],
			temperature: 0.5,
		});

		let newPlan: any;
		try {
			const content = response.choices[0]?.message?.content || '{}';
			const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
			newPlan = JSON.parse(cleanContent);
			
			if (newPlan.newTools) {
				newPlan.newTools = newPlan.newTools.filter((tool: string) => 
					!tool.includes('web_search') && !tool.includes('fact_')
				);
			}
		} catch (error) {
			newPlan = {
				newStrategy: 'Usar conhecimento interno sem ferramentas',
				newTools: [],
				newAgentType: 'synthesis'
			};
		}

		subTask.metadata.agentType = newPlan.newAgentType;
		subTask.metadata.tools = newPlan.newTools;
		subTask.metadata.strategy = newPlan.newStrategy;

		await this.moveTask(subTask.id, 'execution_queue');
		
		return await this.executeSubTaskWithErrorDetection(subTask, workDir, '', onProgress);
	}

	/**
	 * VALIDAÇÃO DE RESULTADO (mantida do original, otimizada)
	 */
	private async validateResult(subTask: KanbanTask, result: string): Promise<boolean> {
		if (!this.openai) return true;

		const hasContent = result && result.length > 50;
		const noError = !result.toLowerCase().includes('error:') && 
		                !result.toLowerCase().includes('failed') &&
						!result.toLowerCase().includes('falha após');
		
		if (hasContent && noError) {
			return true;
		}

		if (!hasContent || result.length < 20) {
			return false;
		}

		const config = getConfig();
		const validationPrompt = `Validador Rigoroso.

SUB-TAREFA: ${subTask.title}
CRITÉRIO: ${subTask.metadata.validation}
RESULTADO: ${result.substring(0, 1000)}

Retorne JSON:
{
  "isValid": true/false,
  "confidence": 0-100,
  "reason": "explicação"
}`;

		const response = await this.openai.chat.completions.create({
			model: config.model || 'qwen-max',
			messages: [{ role: 'user', content: validationPrompt }],
			temperature: 0.1,
		});

		try {
			const content = response.choices[0]?.message?.content || '{"isValid": false}';
			const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
			const validation = JSON.parse(cleanContent);
			
			return validation.isValid && validation.confidence >= 70;
		} catch (error) {
			return true;
		}
	}

	/**
	 * SÍNTESE DE RESULTADOS (mantida do original)
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

Sintetize em resposta COMPLETA e COERENTE.

Formato: ${mainTask.metadata.intention?.outputFormat || 'Texto estruturado'}`;

		return await synthesisAgent.execute(synthesisPrompt, []);
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

	/**
	 * MEMÓRIA PERFEITA: Obter contexto COMPLETO para próxima tarefa
	 * 
	 * Usa getContextForNextStep do Context Manager para injetar:
	 * - Todas as tarefas completadas
	 * - Todos os recursos criados
	 * - Resultados intermediários relevantes
	 * - Context carryover entre etapas
	 */
	private getContextForTask(subTask: KanbanTask): any {
		// Obter contexto completo do Context Manager
		const fullContext = getContextForNextStep(this.workDir || process.cwd());
		
		// Adicionar também dependências diretas (para compatibilidade)
		const dependencies = subTask.metadata.dependencies || [];
		const directDeps: any = {};

		for (const depId of dependencies) {
			const depTask = this.kanban.get(depId);
			if (depTask?.metadata.result) {
				directDeps[depId] = depTask.metadata.result;
			}
		}

		// Combinar contexto completo + dependências diretas
		return {
			fullMemory: fullContext, // Memória completa de TUDO que foi feito
			directDependencies: directDeps, // Deps diretas desta task
		};
	}
}
