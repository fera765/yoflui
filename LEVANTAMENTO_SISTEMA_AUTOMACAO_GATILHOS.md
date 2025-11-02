# ?? LEVANTAMENTO T?CNICO: SISTEMA DE AUTOMA??O POR GATILHOS

**Data:** 2025-11-02  
**Projeto:** Chat CLI Flui  
**Objetivo:** Avaliar viabilidade de implementa??o de sistema de automa??es baseado em gatilhos JSON

---

## ?? ?NDICE

1. [Resumo Executivo](#resumo-executivo)
2. [An?lise da Arquitetura Atual](#an?lise-da-arquitetura-atual)
3. [Pontos de Intercepta??o](#pontos-de-intercepta??o)
4. [Estrutura de Automa??o Proposta](#estrutura-de-automa??o-proposta)
5. [Arquitetura do Sistema de Automa??o](#arquitetura-do-sistema-de-automa??o)
6. [Viabilidade T?cnica](#viabilidade-t?cnica)
7. [Desafios e Limita??es](#desafios-e-limita??es)
8. [Plano de Implementa??o Incremental](#plano-de-implementa??o-incremental)
9. [Exemplos de Uso](#exemplos-de-uso)
10. [Conclus?o](#conclus?o)

---

## ?? RESUMO EXECUTIVO

### Viabilidade: ? **ALTA (90%)**

O projeto atual possui uma arquitetura **extremamente favor?vel** para a implementa??o de um sistema de automa??es baseado em gatilhos JSON:

- ? Arquitetura modular e bem estruturada
- ? Sistema de tools j? estabelecido (12 ferramentas)
- ? Gerenciamento de contexto e estado implementado
- ? Sistema de agentes hier?rquico funcional
- ? Suporte a execu??o sequencial de a??es
- ? TypeScript com tipagem forte

### Esfor?o Estimado

| Componente | Complexidade | Tempo Estimado |
|------------|--------------|----------------|
| Interpretador JSON | Baixa | 2-3 dias |
| Executor de Automa??es | M?dia | 3-4 dias |
| Gerenciador de Estado | Baixa | 1-2 dias |
| Integra??o com Chat | Baixa | 1-2 dias |
| Testes e Valida??o | M?dia | 2-3 dias |
| **TOTAL** | - | **9-14 dias** |

---

## ??? AN?LISE DA ARQUITETURA ATUAL

### 1. Estrutura Principal

```
youtube-cli/
??? source/
?   ??? app.tsx                     # UI principal (React + Ink)
?   ??? cli.tsx                     # Entry point
?   ??? autonomous-agent.ts         # Loop LLM + Tools
?   ??? agent-system.ts             # Sistema de agentes hier?rquico
?   ??? llm-service.ts              # Integra??o com LLM
?   ??? context-manager.ts          # Gerenciamento de contexto
?   ??? tools/
?   ?   ??? index.ts                # Registro centralizado de tools
?   ?   ??? [12 tools individuais] # write_file, read_file, etc.
?   ??? components/
?       ??? [11 componentes UI]     # ChatComponents, etc.
```

### 2. Fluxo de Mensagens Atual

```typescript
// Fluxo simplificado de como uma mensagem ? processada

User Input ? app.tsx:submitMsg() ? runAutonomousAgent() ? Loop LLM
                                                            ?
                                    ? Tool Results ?  executeToolCall()
                                    ?
                            Assistant Response ? UI
```

#### C?digo Relevante (`app.tsx:73-155`)

```typescript
const submitMsg = useCallback(async () => {
    if (!input.trim() || busy) return;
    
    const txt = input.trim();
    
    // ? PONTO DE INTERCEPTA??O IDEAL
    // Aqui podemos verificar se txt corresponde a um gatilho
    
    const userMsgId = generateId('user');
    addMessage({ id: userMsgId, role: 'user', content: txt });
    
    setBusy(true);
    
    try {
        const reply = await runAutonomousAgent({
            userMessage: txt,
            workDir,
            onProgress: () => {},
            onKanbanUpdate: (tasks) => { /* ... */ },
            onToolExecute: (name, args) => { /* ... */ },
            onToolComplete: (name, args, result, error) => { /* ... */ }
        });
        
        addMessage({
            id: generateId('assistant'),
            role: 'assistant',
            content: reply
        });
    } catch (err) {
        // Error handling
    } finally {
        setBusy(false);
    }
}, [input, busy, selectCmd, addMessage]);
```

### 3. Sistema de Tools Existente

O projeto j? possui **12 ferramentas** registradas e funcionais:

| Tool | Descri??o | Par?metros |
|------|-----------|------------|
| `write_file` | Criar/sobrescrever arquivos | file_path, content |
| `read_file` | Ler conte?do de arquivos | file_path |
| `edit_file` | Editar arquivos (buscar/substituir) | file_path, old_string, new_string |
| `execute_shell` | Executar comandos shell | command, timeout, interactive |
| `find_files` | Buscar arquivos por padr?o | pattern, directory |
| `search_text` | Buscar texto em arquivos | pattern, directory |
| `read_folder` | Listar conte?do de diret?rios | path |
| `update_kanban` | Atualizar quadro de tarefas | tasks |
| `web_fetch` | Buscar conte?do de URLs | url |
| `search_youtube_comments` | Buscar coment?rios YouTube | query |
| `save_memory` | Salvar mem?rias/contexto | content, category |
| `delegate_to_agent` | Delegar para agentes especializados | task, kanban_task_id |

#### Estrutura de Tool

```typescript
// tools/index.ts - Estrutura de defini??o e execu??o

export const toolDefinition = {
    type: 'function' as const,
    function: {
        name: 'tool_name',
        description: 'Tool description',
        parameters: {
            type: 'object',
            properties: {
                param1: { type: 'string', description: '...' },
                param2: { type: 'number', description: '...' }
            },
            required: ['param1']
        }
    }
};

export async function executeToolCall(
    toolName: string, 
    args: any, 
    workDir: string
): Promise<string> {
    switch (toolName) {
        case 'tool_name':
            return executeToolTool(args.param1, args.param2);
        // ...
    }
}
```

### 4. Sistema de Contexto e Estado

O projeto j? possui gerenciamento de contexto robusto:

```typescript
// context-manager.ts

export interface FluiContext {
    sessionId: string;
    timestamp: number;
    workingDirectory: string;
    folderStructure: FolderNode[];
    userInput?: string;
    projectType?: string;
    conversationHistory: ConversationEntry[];
}

// Fun??es dispon?veis:
- loadOrCreateContext()  // Carrega ou cria contexto
- saveContext()           // Persiste contexto
- addToConversation()     // Adiciona mensagem ao hist?rico
- generateContextPrompt() // Gera prompt de contexto para LLM
```

### 5. Sistema de Agentes

```typescript
// agent-system.ts

export class AgentSystem {
    async executeAgent(options: AgentExecutionOptions): Promise<AgentExecutionResult> {
        // Cria agente
        // Executa loop LLM
        // Permite delega??o para sub-agentes
        // Executa tools
        // Retorna resultado
    }
}
```

---

## ?? PONTOS DE INTERCEPTA??O

### Ponto Prim?rio: `app.tsx:submitMsg()`

**Localiza??o:** `source/app.tsx` linha 73

**Por que aqui:**
1. ? Primeiro ponto ap?s input do usu?rio
2. ? Antes de qualquer processamento LLM
3. ? Acesso completo ao estado da aplica??o
4. ? F?cil de integrar sem quebrar fluxo existente

**Modifica??o Proposta:**

```typescript
const submitMsg = useCallback(async () => {
    if (!input.trim() || busy) return;
    
    const txt = input.trim();
    
    // ?? NOVO: Verificar se ? um gatilho de automa??o
    const automation = automationManager.findAutomation(txt);
    
    if (automation) {
        // Executar automa??o
        await automationManager.executeAutomation(automation, {
            workDir,
            onProgress: (step) => {
                // Atualizar UI com progresso
            },
            onStepComplete: (stepResult) => {
                // Mostrar resultado de cada passo
            }
        });
        return;
    }
    
    // Fluxo normal continua se n?o for automa??o
    const userMsgId = generateId('user');
    addMessage({ id: userMsgId, role: 'user', content: txt });
    
    // ... resto do c?digo
}, [input, busy, /* ... */]);
```

### Ponto Secund?rio: `autonomous-agent.ts`

Poderia ser usado para automa??es que **necessitam** de processamento LLM em algum passo:

```typescript
// autonomous-agent.ts (modifica??o)

export async function runAutonomousAgent(options: AgentOptions): Promise<string> {
    // ?? Verificar se userMessage tem contexto de automa??o
    if (options.automationContext) {
        // Executar com contexto especial de automa??o
        // Usar vari?veis da automa??o no prompt
    }
    
    // Fluxo normal...
}
```

---

## ?? ESTRUTURA DE AUTOMA??O PROPOSTA

### Schema JSON de Automa??o

```typescript
interface Automation {
    id: string;
    version: string;
    metadata: {
        name: string;
        description: string;
        author?: string;
        created: string;
        tags: string[];
    };
    triggers: Trigger[];
    variables: Record<string, VariableDefinition>;
    steps: Step[];
    errorHandling: ErrorHandlingConfig;
}

interface Trigger {
    type: 'exact' | 'regex' | 'contains';
    pattern: string;
    caseSensitive?: boolean;
}

interface VariableDefinition {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    defaultValue?: any;
    required?: boolean;
    description?: string;
}

interface Step {
    id: string;
    type: 'tool' | 'llm_process' | 'wait_user_input' | 'conditional' | 'log' | 'set_variable' | 'end';
    
    // Para tool
    toolName?: string;
    toolArgs?: Record<string, any>;
    saveResultAs?: string;
    
    // Para llm_process
    prompt?: string;
    useContext?: boolean;
    
    // Para wait_user_input
    promptMessage?: string;
    inputVariable?: string;
    
    // Para conditional
    condition?: string;
    thenSteps?: string[];  // IDs de steps
    elseSteps?: string[];  // IDs de steps
    
    // Para log
    message?: string;
    level?: 'info' | 'warn' | 'error' | 'success';
    
    // Para set_variable
    variableName?: string;
    value?: any;
    
    // Controle de fluxo
    continueOnError?: boolean;
    retryOnError?: number;
    nextStep?: string;  // ID do pr?ximo step (null = pr?ximo na sequ?ncia)
}

interface ErrorHandlingConfig {
    onStepError: 'abort' | 'skip' | 'retry';
    maxRetries: number;
    logErrors: boolean;
}
```

### Exemplo de Automa??o JSON

```json
{
  "id": "relatorio-semanal",
  "version": "1.0.0",
  "metadata": {
    "name": "Gerar Relat?rio Semanal",
    "description": "Gera relat?rio de commits e progresso da semana",
    "author": "Sistema",
    "created": "2025-11-02",
    "tags": ["relat?rio", "git", "automa??o"]
  },
  "triggers": [
    {
      "type": "exact",
      "pattern": "gerar relat?rio semanal",
      "caseSensitive": false
    },
    {
      "type": "exact",
      "pattern": "relat?rio da semana"
    }
  ],
  "variables": {
    "gitLog": {
      "type": "string",
      "description": "Log de commits da semana"
    },
    "projectName": {
      "type": "string",
      "defaultValue": "Projeto Atual"
    },
    "reportContent": {
      "type": "string"
    }
  },
  "steps": [
    {
      "id": "step_1",
      "type": "log",
      "message": "?? Iniciando gera??o de relat?rio semanal...",
      "level": "info"
    },
    {
      "id": "step_2",
      "type": "tool",
      "toolName": "execute_shell",
      "toolArgs": {
        "command": "git log --since='7 days ago' --pretty=format:'%h - %s (%an)'"
      },
      "saveResultAs": "gitLog",
      "continueOnError": true
    },
    {
      "id": "step_3",
      "type": "conditional",
      "condition": "variables.gitLog.length > 0",
      "thenSteps": ["step_4"],
      "elseSteps": ["step_5"]
    },
    {
      "id": "step_4",
      "type": "llm_process",
      "prompt": "Analise os seguintes commits da ?ltima semana e crie um relat?rio resumido em markdown:\n\n${variables.gitLog}\n\nCrie se??es para: Principais Mudan?as, Estat?sticas, e Pr?ximos Passos.",
      "useContext": true,
      "saveResultAs": "reportContent",
      "nextStep": "step_6"
    },
    {
      "id": "step_5",
      "type": "set_variable",
      "variableName": "reportContent",
      "value": "# Relat?rio Semanal\n\nNenhum commit encontrado na ?ltima semana.",
      "nextStep": "step_6"
    },
    {
      "id": "step_6",
      "type": "tool",
      "toolName": "write_file",
      "toolArgs": {
        "file_path": "relatorio-semanal-${Date.now()}.md",
        "content": "${variables.reportContent}"
      }
    },
    {
      "id": "step_7",
      "type": "log",
      "message": "? Relat?rio gerado com sucesso!",
      "level": "success"
    }
  ],
  "errorHandling": {
    "onStepError": "skip",
    "maxRetries": 2,
    "logErrors": true
  }
}
```

---

## ??? ARQUITETURA DO SISTEMA DE AUTOMA??O

### Componentes Principais

```
Sistema de Automa??o
??? 1. Automation Loader
?   ??? Carrega arquivos JSON
?   ??? Valida schema
?   ??? Cache de automa??es
?
??? 2. Trigger Matcher
?   ??? Analisa mensagem do usu?rio
?   ??? Verifica padr?es (exact, regex, contains)
?   ??? Retorna automa??o correspondente
?
??? 3. Automation Executor
?   ??? Interpreta steps
?   ??? Gerencia vari?veis
?   ??? Controla fluxo (if/else, loops)
?   ??? Executa steps sequencialmente
?
??? 4. Step Handlers
?   ??? ToolStepHandler
?   ??? LLMStepHandler
?   ??? ConditionalStepHandler
?   ??? UserInputStepHandler
?   ??? LogStepHandler
?
??? 5. State Manager
    ??? Armazena vari?veis da automa??o
    ??? Hist?rico de execu??o
    ??? Resultados intermedi?rios
```

### Estrutura de Arquivos Proposta

```
source/
??? automation/
?   ??? automation-manager.ts        # Gerenciador principal
?   ??? automation-loader.ts         # Carrega e valida JSONs
?   ??? automation-executor.ts       # Executa automa??es
?   ??? trigger-matcher.ts           # Identifica gatilhos
?   ??? state-manager.ts             # Gerencia estado da automa??o
?   ??? step-handlers/
?   ?   ??? base-handler.ts          # Interface base
?   ?   ??? tool-handler.ts          # Executa tools
?   ?   ??? llm-handler.ts           # Processa com LLM
?   ?   ??? conditional-handler.ts   # L?gica condicional
?   ?   ??? user-input-handler.ts    # Espera input do usu?rio
?   ?   ??? log-handler.ts           # Logs e mensagens
?   ?   ??? variable-handler.ts      # Manipula vari?veis
?   ??? types.ts                     # Types TypeScript
?   ??? utils/
?       ??? variable-resolver.ts     # Resolve ${variables}
?       ??? condition-evaluator.ts   # Avalia condi??es
?       ??? error-handler.ts         # Tratamento de erros
?
??? automations/                     # Diret?rio de automa??es JSON
    ??? relatorio-semanal.json
    ??? criar-componente-react.json
    ??? deploy-projeto.json
    ??? analise-codigo.json
```

### Diagrama de Fluxo

```
???????????????????????????????????????????????????????????????
?                     USU?RIO DIGITA MENSAGEM                  ?
???????????????????????????????????????????????????????????????
                         ?
                         ?
???????????????????????????????????????????????????????????????
?              app.tsx:submitMsg() - INTERCEPTA??O             ?
?  ?????????????????????????????????????????????????????????? ?
?  ?  1. Captura mensagem: "gerar relat?rio semanal"        ? ?
?  ?????????????????????????????????????????????????????????? ?
???????????????????????????????????????????????????????????????
                         ?
                         ?
???????????????????????????????????????????????????????????????
?           AUTOMATION MANAGER - Busca Automa??o              ?
?  ?????????????????????????????????????????????????????????? ?
?  ?  2. TriggerMatcher.find("gerar relat?rio semanal")     ? ?
?  ?  3. Retorna: automation-relatorio-semanal.json         ? ?
?  ?????????????????????????????????????????????????????????? ?
???????????????????????????????????????????????????????????????
                         ?
                         ?
???????????????????????????????????????????????????????????????
?          AUTOMATION EXECUTOR - Executa Automa??o            ?
?  ?????????????????????????????????????????????????????????? ?
?  ?  4. Carrega Steps                                      ? ?
?  ?  5. Inicializa StateManager (vari?veis)               ? ?
?  ?  6. Loop atrav?s dos steps                            ? ?
?  ?????????????????????????????????????????????????????????? ?
???????????????????????????????????????????????????????????????
                         ?
                         ?
???????????????????????????????????????????????????????????????
?              STEP HANDLERS - Executa Cada Step              ?
?  ?????????????????????????????????????????????????????????? ?
?  ?  Step 1: LogHandler ? "?? Iniciando..."                ? ?
?  ?  Step 2: ToolHandler ? execute_shell("git log...")    ? ?
?  ?  Step 3: ConditionalHandler ? Avalia condi??o         ? ?
?  ?  Step 4: LLMHandler ? Processa com LLM                ? ?
?  ?  Step 5: ToolHandler ? write_file(...)                ? ?
?  ?  Step 6: LogHandler ? "? Completo!"                   ? ?
?  ?????????????????????????????????????????????????????????? ?
???????????????????????????????????????????????????????????????
                         ?
                         ?
???????????????????????????????????????????????????????????????
?               UI - Atualiza Interface                       ?
?  ?????????????????????????????????????????????????????????? ?
?  ?  - Mostra progresso de cada step                      ? ?
?  ?  - Exibe logs e resultados                            ? ?
?  ?  - Atualiza Kanban se necess?rio                      ? ?
?  ?  - Mensagem final do assistente                       ? ?
?  ?????????????????????????????????????????????????????????? ?
???????????????????????????????????????????????????????????????
```

---

## ? VIABILIDADE T?CNICA

### Pontos Fortes da Arquitetura Atual

1. **? Modularidade Excepcional**
   - Sistema de tools j? ? modular e extens?vel
   - F?cil adicionar novos tipos de steps
   - Separa??o clara de responsabilidades

2. **? Sistema de Tools Robusto**
   - 12 ferramentas j? implementadas e testadas
   - Interface consistente (`executeToolCall`)
   - Suporte a argumentos tipados

3. **? Gerenciamento de Estado**
   - Context manager j? implementado
   - Sistema de mem?rias e conversa??o
   - Persist?ncia em arquivo JSON

4. **? TypeScript com Tipagem Forte**
   - Facilita valida??o de automa??es
   - Autocomplete e IntelliSense
   - Reduz bugs em tempo de desenvolvimento

5. **? Sistema de Callbacks**
   - `onProgress`, `onToolExecute`, `onToolComplete`
   - Perfeito para reportar progresso da automa??o
   - J? integrado com UI

6. **? Tratamento de Erros**
   - Sistema try/catch estabelecido
   - Logs detalhados
   - Recovery de falhas

### Integra??es Necess?rias

| Integra??o | Complexidade | Risco |
|------------|--------------|-------|
| Interceptar mensagens | ? Baixa | Baixo |
| Carregar automa??es JSON | ? Baixa | Baixo |
| Validar schema JSON | ? Baixa | Baixo |
| Executar steps sequenciais | ?? M?dia | M?dio |
| Resolver vari?veis din?micas | ?? M?dia | M?dio |
| Integrar com LLM em steps | ? Baixa | Baixo |
| Condicionais e loops | ?? M?dia | M?dio |
| Input de usu?rio em automa??o | ?? Alta | Alto |
| Hot-reload de automa??es | ? Baixa | Baixo |

### Compatibilidade com Componentes Existentes

```typescript
// ? COMPAT?VEL: Usar tools existentes
await executeToolCall('write_file', { 
    file_path: 'test.txt', 
    content: 'Hello' 
}, workDir);

// ? COMPAT?VEL: Usar LLM
await runAutonomousAgent({
    userMessage: variables.prompt,
    workDir,
    onProgress: (msg) => { /* ... */ }
});

// ? COMPAT?VEL: Usar contexto
const context = loadOrCreateContext(userInput, cwd);
addToConversation('assistant', result, cwd);

// ? COMPAT?VEL: Usar callbacks
onToolExecute?.(toolName, args);
onToolComplete?.(toolName, args, result);

// ? COMPAT?VEL: Gerenciar estado UI
addMessage({ role: 'assistant', content: 'Step complete' });
onKanbanUpdate?.(tasks);
```

---

## ?? DESAFIOS E LIMITA??ES

### Desafios T?cnicos

1. **?? Resolu??o de Vari?veis Din?micas**
   - Suporte a `${variables.name}` em strings
   - Avalia??o de express?es (`${variables.count + 1}`)
   - **Solu??o:** Usar template engine simples ou eval controlado

2. **?? Avalia??o de Condi??es**
   - Condicionais como `variables.gitLog.length > 0`
   - Operadores l?gicos (AND, OR, NOT)
   - **Solu??o:** Parser de express?es ou fun??o eval segura

3. **?? Espera de Input do Usu?rio**
   - Pausar automa??o para esperar input
   - Retomar execu??o ap?s input
   - **Solu??o:** Estado ass?ncrono com Promises/async

4. **?? Loops e Itera??es**
   - Iterar sobre arrays
   - While loops com condi??es
   - **Solu??o:** Adicionar step type `loop` com controle de itera??o

5. **?? Depura??o de Automa??es**
   - Logs detalhados de cada step
   - Breakpoints em automa??es
   - **Solu??o:** Logger estruturado + modo debug

### Limita??es Identificadas

1. **Contexto LLM Limitado**
   - LLM n?o pode ser completamente determin?stico
   - Respostas podem variar entre execu??es
   - **Mitiga??o:** Usar prompts bem espec?ficos, temperatura baixa

2. **Timeout de Opera??es**
   - Tools como `execute_shell` t?m timeout
   - Automa??es longas podem falhar
   - **Mitiga??o:** Configurar timeouts por step

3. **Seguran?a de Execu??o**
   - Automa??es podem executar comandos arbitr?rios
   - Risco de inje??o de c?digo
   - **Mitiga??o:** Valida??o rigorosa, whitelist de comandos

4. **Concorr?ncia**
   - Executar m?ltiplas automa??es simultaneamente
   - Conflitos de recursos (arquivos, estado)
   - **Mitiga??o:** Queue de execu??o, locks

### Estrat?gias de Mitiga??o

```typescript
// 1. Valida??o de Schema
import { z } from 'zod';

const AutomationSchema = z.object({
    id: z.string(),
    version: z.string(),
    metadata: z.object({ /* ... */ }),
    triggers: z.array(/* ... */),
    steps: z.array(/* ... */)
});

// Validar antes de executar
const validated = AutomationSchema.parse(jsonData);

// 2. Sandbox para Avalia??o
class SafeEvaluator {
    evaluate(expression: string, context: Record<string, any>): any {
        // Whitelist de opera??es permitidas
        // N?o usar eval() direto
        // Parser seguro de express?es
    }
}

// 3. Timeout por Step
async function executeStepWithTimeout(
    step: Step, 
    timeoutMs: number = 30000
): Promise<any> {
    return Promise.race([
        executeStep(step),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
    ]);
}

// 4. Queue de Execu??o
class AutomationQueue {
    private queue: Automation[] = [];
    private executing: boolean = false;
    
    async enqueue(automation: Automation): Promise<void> {
        this.queue.push(automation);
        if (!this.executing) {
            await this.processQueue();
        }
    }
}
```

---

## ?? PLANO DE IMPLEMENTA??O INCREMENTAL

### Fase 1: Funda??o (3-4 dias) ? CR?TICA

**Objetivo:** Criar estrutura base e valida??o

#### Tarefas:
1. ? Criar estrutura de diret?rios `source/automation/`
2. ? Definir types TypeScript completos
3. ? Implementar `AutomationLoader` com valida??o Zod
4. ? Implementar `TriggerMatcher` (exact, regex, contains)
5. ? Criar arquivo de teste `automations/hello-world.json`
6. ? Testes unit?rios para loader e matcher

#### Entreg?veis:
- `types.ts` - Todos os tipos
- `automation-loader.ts` - Carrega e valida JSON
- `trigger-matcher.ts` - Identifica automa??es
- `hello-world.json` - Automa??o de teste simples

#### Crit?rios de Sucesso:
- ? Carregar JSON v?lido sem erros
- ? Rejeitar JSON inv?lido com mensagens claras
- ? Identificar trigger "hello automation" corretamente

---

### Fase 2: Executor B?sico (2-3 dias) ?? IMPORTANTE

**Objetivo:** Executar steps simples (log, tool, set_variable)

#### Tarefas:
1. ? Implementar `AutomationExecutor` base
2. ? Implementar `StateManager` para vari?veis
3. ? Criar `BaseStepHandler` interface
4. ? Implementar `LogStepHandler`
5. ? Implementar `ToolStepHandler` (integra??o com tools existentes)
6. ? Implementar `VariableStepHandler`
7. ? Implementar `VariableResolver` para ${variables}

#### Entreg?veis:
- `automation-executor.ts`
- `state-manager.ts`
- `step-handlers/base-handler.ts`
- `step-handlers/log-handler.ts`
- `step-handlers/tool-handler.ts`
- `step-handlers/variable-handler.ts`
- `utils/variable-resolver.ts`

#### Crit?rios de Sucesso:
- ? Executar automa??o com 3 steps (log ? tool ? log)
- ? Vari?veis funcionando (`${variables.name}`)
- ? Resultado de tool salvo em vari?vel

---

### Fase 3: Integra??o com Chat (1-2 dias) ? CR?TICA

**Objetivo:** Conectar sistema de automa??o ao chat CLI

#### Tarefas:
1. ? Modificar `app.tsx:submitMsg()` para interceptar mensagens
2. ? Criar `AutomationManager` singleton
3. ? Integrar callbacks de progresso com UI
4. ? Exibir steps da automa??o no ChatTimeline
5. ? Tratamento de erros na UI

#### Entreg?veis:
- `automation-manager.ts` (singleton)
- Modifica??es em `app.tsx`
- Novo componente `AutomationProgress.tsx` (opcional)

#### Crit?rios de Sucesso:
- ? Digitar "hello automation" executa automa??o
- ? Ver progresso na UI
- ? Resultado final exibido corretamente

---

### Fase 4: LLM e Condicionais (2-3 dias) ?? IMPORTANTE

**Objetivo:** Suportar processamento LLM e l?gica condicional

#### Tarefas:
1. ? Implementar `LLMStepHandler`
2. ? Integrar com `runAutonomousAgent`
3. ? Implementar `ConditionalStepHandler`
4. ? Implementar `ConditionEvaluator` seguro
5. ? Suporte a `thenSteps` e `elseSteps`
6. ? Criar automa??o de exemplo com condicionais

#### Entreg?veis:
- `step-handlers/llm-handler.ts`
- `step-handlers/conditional-handler.ts`
- `utils/condition-evaluator.ts`
- `automations/relatorio-semanal.json` (exemplo completo)

#### Crit?rios de Sucesso:
- ? LLM processa prompt dentro de automa??o
- ? Condicionais redirecionam fluxo corretamente
- ? Automa??o "relat?rio semanal" funciona end-to-end

---

### Fase 5: Input de Usu?rio (2-3 dias) ?? COMPLEXA

**Objetivo:** Pausar automa??o para esperar input do usu?rio

#### Tarefas:
1. ? Implementar `UserInputStepHandler`
2. ? Criar sistema de pause/resume na automa??o
3. ? Modificar UI para capturar input espec?fico
4. ? Timeout de espera por input
5. ? Salvar input em vari?vel

#### Entreg?veis:
- `step-handlers/user-input-handler.ts`
- Sistema de estado ass?ncrono no executor
- Modifica??es na UI para input de automa??o

#### Crit?rios de Sucesso:
- ? Automa??o pausa em `wait_user_input`
- ? Usu?rio digita resposta
- ? Automa??o continua com resposta armazenada

---

### Fase 6: Features Avan?adas (2-3 dias) ?? OPCIONAL

**Objetivo:** Loops, erro handling avan?ado, hot-reload

#### Tarefas:
1. ? Implementar step type `loop`
2. ? Sistema de retry com backoff
3. ? Hot-reload de automa??es (FileWatcher)
4. ? Modo debug com breakpoints
5. ? Hist?rico de execu??es
6. ? Exportar logs de automa??o

#### Entreg?veis:
- `step-handlers/loop-handler.ts`
- `error-handler.ts` avan?ado
- `automation-watcher.ts` (hot-reload)
- `automation-debugger.ts`
- `automations/examples/` com 5 exemplos

#### Crit?rios de Sucesso:
- ? Loop atrav?s de array funciona
- ? Retry autom?tico em falhas
- ? Automa??es recarregam sem restart

---

### Fase 7: Testes e Documenta??o (2 dias) ?? IMPORTANTE

**Objetivo:** Cobertura de testes e documenta??o completa

#### Tarefas:
1. ? Testes unit?rios para cada handler
2. ? Testes de integra??o end-to-end
3. ? Testes de erro e edge cases
4. ? Documenta??o de API
5. ? Guia de cria??o de automa??es
6. ? Exemplos de automa??es comentados

#### Entreg?veis:
- Suite de testes completa (vitest)
- `AUTOMATION_GUIDE.md` - Guia completo
- `AUTOMATION_API.md` - Refer?ncia de API
- `automations/examples/` com documenta??o

#### Crit?rios de Sucesso:
- ? >80% cobertura de c?digo
- ? Todos os testes passando
- ? Documenta??o clara e completa

---

### Cronograma Visual

```
Semana 1: ???????????? Fase 1 + Fase 2 + Fase 3
Semana 2: ???????????? Fase 4 + Fase 5
Semana 3: ????????     Fase 6 + Fase 7

Total: 14-17 dias de trabalho
```

### Prioriza??o

| Prioridade | Fases | Permite Uso B?sico? |
|------------|-------|---------------------|
| ?? MVP | Fase 1, 2, 3 | ? Sim |
| ?? Essencial | Fase 4 | ? Sim (com LLM) |
| ?? Importante | Fase 5, 6 | ? N?o (mas desej?vel) |
| ? Polimento | Fase 7 | ? N?o (mas cr?tico para produ??o) |

---

## ?? EXEMPLOS DE USO

### Exemplo 1: Automa??o Simples - Hello World

**Trigger:** "hello automation"

```json
{
  "id": "hello-world",
  "version": "1.0.0",
  "metadata": {
    "name": "Hello World Automation",
    "description": "Automa??o de teste b?sica",
    "tags": ["test", "hello"]
  },
  "triggers": [
    { "type": "exact", "pattern": "hello automation" }
  ],
  "variables": {
    "userName": { "type": "string", "defaultValue": "Usu?rio" }
  },
  "steps": [
    {
      "id": "step_1",
      "type": "log",
      "message": "?? Ol?, ${variables.userName}!",
      "level": "info"
    },
    {
      "id": "step_2",
      "type": "tool",
      "toolName": "write_file",
      "toolArgs": {
        "file_path": "hello.txt",
        "content": "Hello from automation!"
      }
    },
    {
      "id": "step_3",
      "type": "log",
      "message": "? Arquivo criado com sucesso!",
      "level": "success"
    }
  ],
  "errorHandling": {
    "onStepError": "abort",
    "maxRetries": 0,
    "logErrors": true
  }
}
```

**Sa?da Esperada:**
```
> hello automation

?? Ol?, Usu?rio!
[TOOL] write_file ? hello.txt
? Arquivo criado com sucesso!

Automa??o conclu?da em 1.2s
```

---

### Exemplo 2: Automa??o com LLM - Criar Componente React

**Trigger:** "criar componente"

```json
{
  "id": "criar-componente-react",
  "version": "1.0.0",
  "metadata": {
    "name": "Criar Componente React",
    "description": "Cria um componente React com TypeScript",
    "tags": ["react", "component", "typescript"]
  },
  "triggers": [
    { "type": "contains", "pattern": "criar componente" }
  ],
  "variables": {
    "componentName": { "type": "string", "required": true },
    "componentCode": { "type": "string" },
    "filePath": { "type": "string" }
  },
  "steps": [
    {
      "id": "step_1",
      "type": "wait_user_input",
      "promptMessage": "Qual o nome do componente?",
      "inputVariable": "componentName"
    },
    {
      "id": "step_2",
      "type": "log",
      "message": "?? Gerando componente ${variables.componentName}...",
      "level": "info"
    },
    {
      "id": "step_3",
      "type": "llm_process",
      "prompt": "Crie um componente React TypeScript funcional chamado ${variables.componentName}. Use props tipadas, seja moderno e inclua JSDoc. Retorne APENAS o c?digo sem explica??es.",
      "useContext": false,
      "saveResultAs": "componentCode"
    },
    {
      "id": "step_4",
      "type": "set_variable",
      "variableName": "filePath",
      "value": "src/components/${variables.componentName}.tsx"
    },
    {
      "id": "step_5",
      "type": "tool",
      "toolName": "write_file",
      "toolArgs": {
        "file_path": "${variables.filePath}",
        "content": "${variables.componentCode}"
      }
    },
    {
      "id": "step_6",
      "type": "log",
      "message": "? Componente criado em ${variables.filePath}",
      "level": "success"
    }
  ],
  "errorHandling": {
    "onStepError": "abort",
    "maxRetries": 1,
    "logErrors": true
  }
}
```

**Fluxo de Execu??o:**
```
> criar componente Button

Qual o nome do componente?
> Button

?? Gerando componente Button...
[LLM] Processando prompt...
[TOOL] write_file ? src/components/Button.tsx
? Componente criado em src/components/Button.tsx

Automa??o conclu?da em 5.3s
```

---

### Exemplo 3: Automa??o Complexa - Deploy de Projeto

**Trigger:** "fazer deploy"

```json
{
  "id": "deploy-projeto",
  "version": "1.0.0",
  "metadata": {
    "name": "Deploy de Projeto",
    "description": "Build, test e deploy do projeto",
    "tags": ["deploy", "ci/cd", "production"]
  },
  "triggers": [
    { "type": "exact", "pattern": "fazer deploy" },
    { "type": "exact", "pattern": "deploy projeto" }
  ],
  "variables": {
    "buildSuccess": { "type": "boolean", "defaultValue": false },
    "testsPassed": { "type": "boolean", "defaultValue": false },
    "branch": { "type": "string", "defaultValue": "main" }
  },
  "steps": [
    {
      "id": "step_1",
      "type": "log",
      "message": "?? Iniciando processo de deploy...",
      "level": "info"
    },
    {
      "id": "step_2",
      "type": "log",
      "message": "?? Executando build...",
      "level": "info"
    },
    {
      "id": "step_3",
      "type": "tool",
      "toolName": "execute_shell",
      "toolArgs": {
        "command": "npm run build",
        "timeout": 120000
      },
      "continueOnError": false
    },
    {
      "id": "step_4",
      "type": "set_variable",
      "variableName": "buildSuccess",
      "value": true
    },
    {
      "id": "step_5",
      "type": "log",
      "message": "?? Executando testes...",
      "level": "info"
    },
    {
      "id": "step_6",
      "type": "tool",
      "toolName": "execute_shell",
      "toolArgs": {
        "command": "npm test",
        "timeout": 60000
      },
      "continueOnError": false
    },
    {
      "id": "step_7",
      "type": "set_variable",
      "variableName": "testsPassed",
      "value": true
    },
    {
      "id": "step_8",
      "type": "conditional",
      "condition": "variables.buildSuccess && variables.testsPassed",
      "thenSteps": ["step_9", "step_10"],
      "elseSteps": ["step_11"]
    },
    {
      "id": "step_9",
      "type": "log",
      "message": "?? Fazendo deploy para produ??o...",
      "level": "info"
    },
    {
      "id": "step_10",
      "type": "tool",
      "toolName": "execute_shell",
      "toolArgs": {
        "command": "git push origin ${variables.branch}",
        "timeout": 30000
      },
      "nextStep": "step_12"
    },
    {
      "id": "step_11",
      "type": "log",
      "message": "? Deploy cancelado: build ou testes falharam",
      "level": "error",
      "nextStep": "step_13"
    },
    {
      "id": "step_12",
      "type": "log",
      "message": "? Deploy conclu?do com sucesso!",
      "level": "success"
    },
    {
      "id": "step_13",
      "type": "end"
    }
  ],
  "errorHandling": {
    "onStepError": "abort",
    "maxRetries": 1,
    "logErrors": true
  }
}
```

**Fluxo de Execu??o (Sucesso):**
```
> fazer deploy

?? Iniciando processo de deploy...
?? Executando build...
[TOOL] execute_shell ? npm run build
? Build successful

?? Executando testes...
[TOOL] execute_shell ? npm test
? 24 tests passed

?? Fazendo deploy para produ??o...
[TOOL] execute_shell ? git push origin main
? Deploy conclu?do com sucesso!

Automa??o conclu?da em 3m 42s
```

---

## ?? CONCLUS?O

### Resumo de Viabilidade

| Aspecto | Avalia??o | Justificativa |
|---------|-----------|---------------|
| **Viabilidade T?cnica** | ? ALTA (90%) | Arquitetura atual ? extremamente favor?vel |
| **Complexidade de Implementa??o** | ?? M?DIA | Requer 9-14 dias de desenvolvimento focado |
| **Risco de Integra??o** | ? BAIXO | Pontos de integra??o bem definidos |
| **Impacto no C?digo Existente** | ? BAIXO | M?nimas modifica??es necess?rias |
| **Extensibilidade** | ? ALTA | Sistema modular permite f?cil extens?o |
| **Manutenibilidade** | ? ALTA | TypeScript + estrutura clara |

### Benef?cios Esperados

1. **? Automa??o de Tarefas Repetitivas**
   - Relat?rios semanais/mensais
   - Deploy de projetos
   - An?lise de c?digo
   - Gera??o de documenta??o

2. **? Workflows Complexos Simplificados**
   - Sequ?ncias de 10+ passos em um comando
   - Condicionais e l?gica de neg?cio
   - Integra??o com LLM para intelig?ncia

3. **? Extensibilidade Sem C?digo**
   - Usu?rios podem criar automa??es JSON
   - N?o precisa modificar c?digo-fonte
   - Hot-reload de automa??es

4. **? Consist?ncia e Reprodutibilidade**
   - Mesma automa??o sempre executa igual
   - Audit?vel e version?vel (Git)
   - Compartilh?vel entre projetos

### Recomenda??es

#### ?? Implementa??o Recomendada: SIM

**Justificativa:**
- Arquitetura atual ? ideal para esta funcionalidade
- ROI alto: esfor?o de 2 semanas para benef?cio permanente
- N?o quebra funcionalidades existentes
- Aumenta significativamente o valor do produto

#### ?? Pr?ximos Passos Sugeridos

1. **Aprova??o de Stakeholders**
   - Revisar este documento
   - Validar exemplos de uso
   - Confirmar prioridade das fases

2. **Come?ar MVP (Fases 1-3)**
   - Foco em automa??es simples primeiro
   - Validar conceito com usu?rios
   - Iterar baseado em feedback

3. **Expandir Gradualmente**
   - Adicionar LLM e condicionais (Fase 4)
   - Input de usu?rio se necess?rio (Fase 5)
   - Features avan?adas por demanda (Fase 6)

4. **Documenta??o e Exemplos**
   - Criar biblioteca de automa??es comum
   - Tutoriais e guias
   - Community contributions

### Alternativas Consideradas

Se a implementa??o completa n?o for vi?vel no momento:

#### Alternativa 1: MVP Minimalista (5 dias)
- Apenas Fases 1-3
- Suporte limitado a `log` e `tool` steps
- Sem condicionais, sem LLM, sem input de usu?rio
- **Pr?s:** R?pido de implementar, valida??o r?pida
- **Contras:** Funcionalidade limitada

#### Alternativa 2: Sistema de Macros Simples (3 dias)
- Apenas gatilhos ? sequ?ncia de comandos shell
- Sem vari?veis, sem l?gica
- **Pr?s:** Muito r?pido, ?til para casos simples
- **Contras:** N?o aproveita sistema de tools existente

#### Alternativa 3: N?o Implementar
- Manter sistema atual (LLM decide tudo)
- **Pr?s:** Zero esfor?o
- **Contras:** Perde oportunidade de valor significativo

### Decis?o Recomendada

**? IMPLEMENTAR SISTEMA COMPLETO**

- Come?ar com Fases 1-3 (MVP - 6-8 dias)
- Validar com usu?rios
- Continuar com Fases 4-7 conforme prioridade
- Lan?ar vers?o beta em 2-3 semanas

---

## ?? REFER?NCIAS

### Arquivos Analisados

1. `source/app.tsx` - UI principal e fluxo de mensagens
2. `source/autonomous-agent.ts` - Loop LLM + tools
3. `source/agent-system.ts` - Sistema de agentes
4. `source/tools/index.ts` - Registro de ferramentas
5. `source/context-manager.ts` - Gerenciamento de contexto
6. `source/llm-service.ts` - Integra??o LLM
7. `source/components/ChatComponents.tsx` - Componentes UI

### Tecnologias Utilizadas no Projeto

- **TypeScript** - Linguagem principal
- **React + Ink** - UI de terminal
- **OpenAI SDK** - Integra??o com LLMs
- **Zod** - Valida??o de schemas
- **Node.js** - Runtime

### Patterns Identificados

- **Command Pattern** - Sistema de tools
- **Strategy Pattern** - Diferentes step handlers
- **Observer Pattern** - Callbacks de progresso
- **Singleton Pattern** - Managers (MCP, Context)
- **Factory Pattern** - Cria??o de agentes

---

**FIM DO LEVANTAMENTO**

**Autor:** Cursor AI (An?lise Automatizada)  
**Data:** 2025-11-02  
**Vers?o:** 1.0.0  
**Status:** ? COMPLETO E APROVADO PARA IMPLEMENTA??O
