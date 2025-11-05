import OpenAI from 'openai';
import { AgentResult } from './types.js';
import { getAllToolDefinitions, executeToolCall } from '../tools/index.js';
import { getConfig } from '../llm-config.js';

export type AgentType = 'research' | 'code' | 'automation' | 'analysis' | 'synthesis';

/**
 * AGENTE ESPECIALIZADO
 * Cada agente tem um papel específico e expertise
 */
export class SpecializedAgent {
	public type: AgentType;
	private openai: OpenAI;
	private systemPrompts: Map<AgentType, string>;

	constructor(type: AgentType, openai: OpenAI) {
		this.type = type;
		this.openai = openai;
		this.systemPrompts = this.initializeSystemPrompts();
	}

	private initializeSystemPrompts(): Map<AgentType, string> {
		const prompts = new Map<AgentType, string>();

		prompts.set('research', `Você é o Agente de Pesquisa Profunda.
Sua única função é realizar pesquisas detalhadas e retornar informação de alta qualidade.
Você é especialista em:
- Buscar informações precisas
- Analisar múltiplas fontes
- Extrair insights relevantes
- Validar credibilidade de dados`);

		prompts.set('code', `Você é o Agente de Código.
Sua única função é criar, editar e analisar código com excelência técnica.
Você é especialista em:
- Escrever código limpo e eficiente
- Refatorar e otimizar código existente
- Detectar bugs e vulnerabilidades
- Aplicar melhores práticas e padrões`);

		prompts.set('automation', `Você é o Agente de Automação.
Sua única função é executar e orquestrar automações e scripts.
Você é especialista em:
- Executar comandos shell
- Coordenar múltiplas ferramentas
- Monitorar execução de processos
- Garantir execução segura e validada`);

		prompts.set('analysis', `Você é o Agente de Análise.
Sua única função é analisar dados, padrões e tendências com profundidade.
Você é especialista em:
- Análise de dados estruturados e não-estruturados
- Identificação de padrões e anomalias
- Extração de insights acionáveis
- Validação estatística`);

		prompts.set('synthesis', `Você é o Agente de Síntese.
Sua única função é integrar múltiplas fontes de informação em um resultado coerente.
Você é especialista em:
- Combinar informações de diferentes fontes
- Criar narrativas coesas e completas
- Eliminar redundâncias e contradições
- Produzir outputs estruturados e claros`);

		return prompts;
	}

	/**
	 * Executar tarefa com este agente especializado
	 */
	async execute(
		agentPrompt: string,
		allowedTools: string[],
		workDir?: string
	): Promise<string> {
		const startTime = Date.now();
		const systemPrompt = this.systemPrompts.get(this.type) || '';

		try {
			// Filtrar tools permitidas (excluir update_kanban que é gerenciado pelo orquestrador)
			const allTools = getAllToolDefinitions();
			const filteredTools = allowedTools.length > 0
				? allTools.filter(tool => {
					const toolName = (tool as any).function.name;
					return allowedTools.includes(toolName) && toolName !== 'update_kanban';
				})
				: allTools.filter(tool => (tool as any).function.name !== 'update_kanban');

			const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: agentPrompt },
			];

			let iterations = 0;
			const maxIterations = 5;

			while (iterations < maxIterations) {
				iterations++;

				// Usar model dinâmico da config
				const config = getConfig();
				
				const response = await this.openai.chat.completions.create({
					model: config.model || 'qwen-max',
					messages,
					tools: filteredTools.length > 0 ? filteredTools : undefined,
					tool_choice: filteredTools.length > 0 ? 'auto' : undefined,
					temperature: this.getTemperatureForAgent(),
				});

				const assistantMsg = response.choices[0]?.message;
				if (!assistantMsg) break;

				messages.push({
					role: 'assistant',
					content: assistantMsg.content || '',
					tool_calls: assistantMsg.tool_calls,
				});

				// Executar tools se necessário
				if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
					for (const toolCall of assistantMsg.tool_calls) {
						const func = (toolCall as any).function;
						const toolName = func.name;
						const args = JSON.parse(func.arguments);

						let result: string;
						try {
							// Usar workDir fornecido ou fallback para cwd
							const execDir = workDir || process.cwd();
							result = await executeToolCall(toolName, args, execDir);
						} catch (error) {
							result = `Error: ${error instanceof Error ? error.message : String(error)}`;
						}

						messages.push({
							role: 'tool',
							content: result,
							tool_call_id: toolCall.id,
						});
					}
					continue;
				}

				// Retornar resultado final
				if (assistantMsg.content) {
					return assistantMsg.content;
				}

				break;
			}

			return 'Execução completada sem resposta final';

		} catch (error) {
			throw new Error(`Erro no agente ${this.type}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Temperatura ideal para cada tipo de agente
	 */
	private getTemperatureForAgent(): number {
		switch (this.type) {
			case 'research': return 0.2;  // Muito preciso e factual
			case 'code': return 0.05;     // Extremamente preciso
			case 'automation': return 0.1; // Muito preciso e seguro
			case 'analysis': return 0.3;  // Preciso mas permite insights
			case 'synthesis': return 0.4; // Balanceado para síntese
			default: return 0.3;
		}
	}
}
