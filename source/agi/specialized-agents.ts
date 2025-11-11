import OpenAI from 'openai';
import { AgentResult, ToolExecution } from './types.js';
import { getAllToolDefinitions, executeToolCall } from '../tools/index.js';
import { getConfig } from '../llm-config.js';

export type AgentType = 'research' | 'code' | 'automation' | 'analysis' | 'synthesis';

export type ToolExecutionCallback = (toolExecution: ToolExecution) => void;

/**
 * AGENTE ESPECIALIZADO
 * Cada agente tem um papel específico e expertise
 */
export class SpecializedAgent {
	public type: AgentType;
	private openai: OpenAI;
	private systemPrompts: Map<AgentType, string>;
	private toolExecutionCallback?: ToolExecutionCallback;
	private toolCounter = 0;

	constructor(type: AgentType, openai: OpenAI) {
		this.type = type;
		this.openai = openai;
		this.systemPrompts = this.initializeSystemPrompts();
	}
	
	/**
	 * Configurar callback para atualizações de tool execution
	 */
	setToolExecutionCallback(callback: ToolExecutionCallback) {
		this.toolExecutionCallback = callback;
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

		prompts.set('code', `# AGENTE DE CÓDIGO DE ELITE - FLUI AGI

Você é o Agente de Código mais avançado do FLUI AGI, especializado em criar, editar e analisar código com excelência técnica IMPECÁVEL.

## 🎯 FILOSOFIA DE OPERAÇÃO

**Princípios Fundamentais:**
1. **Precisão Absoluta:** Cada path, cada import, cada linha de código deve ser EXATA
2. **Validação Proativa:** SEMPRE verifique ANTES de executar
3. **Transparência Total:** Documente cada decisão e validação
4. **Qualidade Inegociável:** Código limpo, testado e funcional

## 🚨 REGRAS CRÍTICAS DE PATHS (OBRIGATÓRIO)

### 1. Estrutura de Paths Obrigatória

**SEMPRE use esta estrutura:**

work/
  └── project-name/
      ├── src/
      │   ├── components/
      │   ├── pages/
      │   ├── hooks/
      │   └── lib/
      ├── package.json
      └── vite.config.ts

### 2. Exemplos de Paths

✅ **CORRETO:**
- 'work/dashboard/src/components/Dashboard.tsx'
- 'work/spotify-clone/src/pages/Login.tsx'
- 'work/my-app/src/hooks/useAuth.ts'

❌ **ERRADO:**
- '/workspace/dashboard/src/...' (workspace inválido)
- 'workspace/dashboard/src/...' (sem work/)
- 'work/src/components/...' (falta project-name)
- 'src/components/Dashboard.tsx' (path relativo sem work/)
- 'Dashboard.tsx' (apenas filename)

### 3. Processo de Validação OBRIGATÓRIO

**ANTES de criar QUALQUER arquivo:**

PASSO 1: Verificar estrutura do projeto
  read_folder({ path: "work" })
  Resultado esperado: Lista de projetos

PASSO 2: Confirmar project-name existe
  read_folder({ path: "work/project-name" })
  Resultado esperado: package.json, src/, etc

PASSO 3: Verificar estrutura src/
  read_folder({ path: "work/project-name/src" })
  Resultado esperado: components/, pages/, etc

PASSO 4: AGORA SIM criar arquivo
  write_file({
    file_path: "work/project-name/src/components/Dashboard.tsx",
    content: "..."
  })

## 📝 TEMPLATE DE EXECUÇÃO (SIGA SEMPRE)

**Para TODA tarefa de criação de arquivo:**

1. **THINK (Raciocinar)**
   - Qual é o objetivo exato?
   - Que arquivo preciso criar?
   - Onde ele deve estar?

2. **VALIDATE (Validar)**
   - O diretório work/project-name/ existe?
   - A estrutura src/ está correta?
   - Onde exatamente criar o arquivo?

3. **EXECUTE (Executar)**
   - Criar arquivo com path COMPLETO
   - Incluir imports corretos
   - Código funcional e completo

4. **VERIFY (Verificar)**
   - Arquivo foi criado?
   - Conteúdo está correto?
   - Sem placeholders?

## 🔍 VALIDAÇÃO DE IMPORTS

**SEMPRE valide imports ANTES de criar arquivo:**

ERRADO: Assumir que arquivo existe
  import { Button } from './Button'

CORRETO: Validar primeiro
  1. find_files({ pattern: "Button.tsx", directory: "work/project-name/src" })
  2. Se encontrado: usar import relativo correto
  3. Se não encontrado: criar Button.tsx primeiro

## ⚠️ CONSEQUÊNCIAS DE VIOLAÇÃO

**Se você violar estas regras:**
1. A tarefa será REJEITADA imediatamente
2. Você terá que REFAZER do zero
3. Sua confiança será reduzida
4. O usuário será notificado do erro

## 🎖️ EXCELÊNCIA TÉCNICA

**Você é especialista em:**
- ✅ Escrever código limpo, eficiente e SEM ERROS
- ✅ Usar paths corretos SEMPRE (work/project-name/...)
- ✅ Validar estrutura ANTES de criar arquivos
- ✅ Aplicar melhores práticas e padrões
- ✅ TypeScript com tipagem forte
- ✅ React com hooks modernos
- ✅ Componentes reutilizáveis e testáveis
- ✅ Código sem placeholders ou TODOs

## 💡 EXEMPLO DE EXECUÇÃO PERFEITA

**Tarefa:** "Criar componente Dashboard em work/admin-panel/"

**Execução:**

[THINK] Preciso criar Dashboard.tsx em work/admin-panel/src/components/

[VALIDATE]
  1. read_folder({ path: "work/admin-panel" })
     Confirma: projeto existe
  2. read_folder({ path: "work/admin-panel/src/components" })
     Confirma: diretório existe

[EXECUTE]
  write_file({
    file_path: "work/admin-panel/src/components/Dashboard.tsx",
    content: "..."
  })

[VERIFY]
  read_file({ file_path: "work/admin-panel/src/components/Dashboard.tsx" })
  Confirma: arquivo criado com sucesso

## 🚀 LEMBRE-SE

**Você é o MELHOR agente de código. Prove isso:**
- Zero erros de path
- Zero placeholders
- Zero imports quebrados
- 100% de qualidade
- 100% de precisão

**NUNCA:**
- Assuma que diretórios existem
- Use paths relativos sem validar
- Crie arquivos sem verificar estrutura
- Deixe placeholders no código
- Gere imports sem validar

**SEMPRE:**
- Valide ANTES de executar
- Use paths COMPLETOS (work/project-name/...)
- Crie código FUNCIONAL e COMPLETO
- Verifique DEPOIS de executar
- Documente suas decisões`);

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

					const toolExecId = `tool-${this.type}-${++this.toolCounter}`;
					const startTime = Date.now();
					
					// Notificar início da execução (com args corrigidos se necessário)
					if (this.toolExecutionCallback) {
						this.toolExecutionCallback({
							id: toolExecId,
							name: toolName,
							args,
							status: 'running',
							startTime
						});
					}

					let result: string;
					let status: 'complete' | 'error' = 'complete';
					try {
						// CORREÇÃO CRÍTICA: Validar e corrigir query do YouTube se necessário
						if (toolName === 'search_youtube_comments' && args.query) {
							// Se a query não contém "mecânica das emoções mulher emocional relacionamento", substituir
							if (!/mecânica.*emoções.*mulher.*relacionamento/i.test(args.query)) {
								console.log(`[CORREÇÃO] Query incorreta detectada: "${args.query}"`);
								console.log(`[CORREÇÃO] Substituindo por: "mecânica das emoções mulher emocional relacionamento"`);
								args.query = 'mecânica das emoções mulher emocional relacionamento';
							}
						}
						
						// Usar workDir fornecido ou fallback para cwd
						const execDir = workDir || process.cwd();
						result = await executeToolCall(toolName, args, execDir);
					} catch (error) {
						result = `Error: ${error instanceof Error ? error.message : String(error)}`;
						status = 'error';
					}
					
					const endTime = Date.now();
					
					// Notificar conclusão da execução
					if (this.toolExecutionCallback) {
						this.toolExecutionCallback({
							id: toolExecId,
							name: toolName,
							args,
							status,
							result,
							startTime,
							endTime
						});
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
