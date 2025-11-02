# ?? PLANO DE IMPLEMENTA??O: SISTEMA DE AUTOMA??O POR GATILHOS

**Data:** 2025-11-02  
**Projeto:** Chat CLI Flui  
**Base:** [LEVANTAMENTO_SISTEMA_AUTOMACAO_GATILHOS.md](./LEVANTAMENTO_SISTEMA_AUTOMACAO_GATILHOS.md)

---

## ?? ?NDICE

1. [Vis?o Geral](#vis?o-geral)
2. [Estrutura de Arquivos](#estrutura-de-arquivos)
3. [Fase 1: Funda??o](#fase-1-funda??o)
4. [Fase 2: Executor B?sico](#fase-2-executor-b?sico)
5. [Fase 3: Integra??o com Chat](#fase-3-integra??o-com-chat)
6. [Fase 4: LLM e Condicionais](#fase-4-llm-e-condicionais)
7. [Fase 5: Input de Usu?rio](#fase-5-input-de-usu?rio)
8. [Exemplos de C?digo](#exemplos-de-c?digo)
9. [Testes](#testes)
10. [Checklist de Implementa??o](#checklist-de-implementa??o)

---

## ?? VIS?O GERAL

### Objetivo

Implementar um sistema completo de automa??es baseado em gatilhos JSON que permita aos usu?rios:
- Definir workflows complexos em arquivos JSON
- Executar automaticamente quando gatilhos forem acionados
- Usar todas as ferramentas existentes do sistema
- Integrar processamento LLM em qualquer passo
- Criar l?gica condicional e aguardar input do usu?rio

### Arquitetura Proposta

```
???????????????????????????????????????????????????????????????
?                    CHAT CLI (app.tsx)                        ?
?  ?????????????????????????????????????????????????????????? ?
?  ?  submitMsg() ? AutomationManager.match(message)        ? ?
?  ?       ? Se encontrar automa??o                         ? ?
?  ?  AutomationExecutor.execute(automation)                ? ?
?  ?????????????????????????????????????????????????????????? ?
???????????????????????????????????????????????????????????????
                         ?
                         ?
???????????????????????????????????????????????????????????????
?              AUTOMATION MANAGER (Singleton)                  ?
?  ?????????????????????????????????????????????????????????? ?
?  ?  - loadAutomations(): Automation[]                     ? ?
?  ?  - findAutomation(message): Automation | null          ? ?
?  ?  - executeAutomation(automation, options)              ? ?
?  ?????????????????????????????????????????????????????????? ?
???????????????????????????????????????????????????????????????
                         ?
                         ?
???????????????????????????????????????????????????????????????
?              AUTOMATION EXECUTOR                             ?
?  ?????????????????????????????????????????????????????????? ?
?  ?  - execute(automation): Promise<ExecutionResult>       ? ?
?  ?  - executeStep(step): Promise<StepResult>              ? ?
?  ?  - resolveVariables(str, state): string                ? ?
?  ?  - evaluateCondition(cond, state): boolean             ? ?
?  ?????????????????????????????????????????????????????????? ?
???????????????????????????????????????????????????????????????
                         ?
                         ?
???????????????????????????????????????????????????????????????
?                  STEP HANDLERS                               ?
?  ?????????????????????????????????????????????????????????? ?
?  ? LogHandler   ? ToolHandler  ? LLMHandler              ? ?
?  ? VarHandler   ? CondHandler  ? UserInputHandler        ? ?
?  ?????????????????????????????????????????????????????????? ?
???????????????????????????????????????????????????????????????
```

---

## ?? ESTRUTURA DE ARQUIVOS

```
youtube-cli/
??? source/
?   ??? automation/
?   ?   ??? automation-manager.ts           # Gerenciador principal (singleton)
?   ?   ??? automation-loader.ts            # Carrega e valida JSONs
?   ?   ??? automation-executor.ts          # Executa automa??es
?   ?   ??? trigger-matcher.ts              # Identifica gatilhos
?   ?   ??? state-manager.ts                # Gerencia vari?veis
?   ?   ?
?   ?   ??? step-handlers/
?   ?   ?   ??? base-handler.ts             # Interface base
?   ?   ?   ??? log-handler.ts              # Logs
?   ?   ?   ??? tool-handler.ts             # Executa tools
?   ?   ?   ??? llm-handler.ts              # Processamento LLM
?   ?   ?   ??? conditional-handler.ts      # If/else
?   ?   ?   ??? user-input-handler.ts       # Aguarda input
?   ?   ?   ??? variable-handler.ts         # Set vari?veis
?   ?   ?
?   ?   ??? utils/
?   ?   ?   ??? variable-resolver.ts        # Resolve ${variables}
?   ?   ?   ??? condition-evaluator.ts      # Avalia express?es
?   ?   ?   ??? error-handler.ts            # Tratamento de erros
?   ?   ?
?   ?   ??? types.ts                        # TypeScript types
?   ?
?   ??? app.tsx                              # [MODIFICAR] Adicionar intercepta??o
?   ??? ...
?
??? automations/                             # Diret?rio de automa??es
?   ??? examples/
?   ?   ??? hello-world.json                # Exemplo b?sico
?   ?   ??? relatorio-semanal.json          # Com LLM
?   ?   ??? criar-componente.json           # Com input
?   ?   ??? deploy-projeto.json             # Complexo
?   ?   ??? analise-codigo.json             # An?lise
?   ?
?   ??? schema.json                          # JSON Schema para valida??o
?
??? tests/
    ??? automation/
        ??? automation-loader.test.ts
        ??? trigger-matcher.test.ts
        ??? automation-executor.test.ts
        ??? handlers/
            ??? log-handler.test.ts
            ??? tool-handler.test.ts
            ??? ...
```

---

## ?? FASE 1: FUNDA??O

**Dura??o:** 3-4 dias  
**Objetivo:** Criar estrutura base, types, loader e matcher

### 1.1 Definir Types TypeScript

**Arquivo:** `source/automation/types.ts`

```typescript
// ============================================
// TYPES.TS - Defini??es TypeScript Completas
// ============================================

/**
 * Automa??o completa
 */
export interface Automation {
    id: string;
    version: string;
    metadata: AutomationMetadata;
    triggers: Trigger[];
    variables: Record<string, VariableDefinition>;
    steps: Step[];
    errorHandling: ErrorHandlingConfig;
}

/**
 * Metadados da automa??o
 */
export interface AutomationMetadata {
    name: string;
    description: string;
    author?: string;
    created: string;
    updated?: string;
    tags: string[];
}

/**
 * Gatilho de automa??o
 */
export interface Trigger {
    type: 'exact' | 'regex' | 'contains';
    pattern: string;
    caseSensitive?: boolean;
    flags?: string; // Para regex: 'i', 'g', etc.
}

/**
 * Defini??o de vari?vel
 */
export interface VariableDefinition {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    defaultValue?: any;
    required?: boolean;
    description?: string;
}

/**
 * Step de automa??o
 */
export interface Step {
    id: string;
    type: StepType;
    description?: string;
    
    // Tool step
    toolName?: string;
    toolArgs?: Record<string, any>;
    saveResultAs?: string;
    
    // LLM step
    prompt?: string;
    useContext?: boolean;
    temperature?: number;
    maxTokens?: number;
    
    // User input step
    promptMessage?: string;
    inputVariable?: string;
    timeout?: number;
    
    // Conditional step
    condition?: string;
    thenSteps?: string[];
    elseSteps?: string[];
    
    // Log step
    message?: string;
    level?: LogLevel;
    
    // Variable step
    variableName?: string;
    value?: any;
    
    // Flow control
    continueOnError?: boolean;
    retryOnError?: number;
    retryDelay?: number;
    nextStep?: string | null;
}

export type StepType = 
    | 'tool'
    | 'llm_process'
    | 'wait_user_input'
    | 'conditional'
    | 'log'
    | 'set_variable'
    | 'end';

export type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

/**
 * Configura??o de erro handling
 */
export interface ErrorHandlingConfig {
    onStepError: 'abort' | 'skip' | 'retry';
    maxRetries: number;
    retryDelay?: number;
    logErrors: boolean;
    notifyOnError?: boolean;
}

/**
 * Estado de execu??o
 */
export interface AutomationState {
    automationId: string;
    startTime: number;
    currentStepId: string | null;
    variables: Record<string, any>;
    stepResults: Record<string, StepResult>;
    errors: ExecutionError[];
    status: 'running' | 'paused' | 'completed' | 'failed';
}

/**
 * Resultado de step
 */
export interface StepResult {
    stepId: string;
    success: boolean;
    result?: any;
    error?: string;
    duration: number;
    timestamp: number;
}

/**
 * Erro de execu??o
 */
export interface ExecutionError {
    stepId: string;
    message: string;
    timestamp: number;
    recoverable: boolean;
}

/**
 * Resultado de execu??o
 */
export interface ExecutionResult {
    success: boolean;
    automationId: string;
    duration: number;
    stepsExecuted: number;
    finalState: AutomationState;
    output?: string;
}

/**
 * Op??es de execu??o
 */
export interface ExecutionOptions {
    workDir: string;
    initialVariables?: Record<string, any>;
    onProgress?: (step: Step, result: StepResult) => void;
    onStepStart?: (step: Step) => void;
    onStepComplete?: (step: Step, result: StepResult) => void;
    onError?: (error: ExecutionError) => void;
    onUserInputRequired?: (prompt: string) => Promise<string>;
}
```

### 1.2 Criar Automation Loader

**Arquivo:** `source/automation/automation-loader.ts`

```typescript
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import type { Automation } from './types.js';

// ============================================
// SCHEMAS ZOD PARA VALIDA??O
// ============================================

const TriggerSchema = z.object({
    type: z.enum(['exact', 'regex', 'contains']),
    pattern: z.string(),
    caseSensitive: z.boolean().optional(),
    flags: z.string().optional(),
});

const VariableDefinitionSchema = z.object({
    type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
    defaultValue: z.any().optional(),
    required: z.boolean().optional(),
    description: z.string().optional(),
});

const StepSchema = z.object({
    id: z.string(),
    type: z.enum(['tool', 'llm_process', 'wait_user_input', 'conditional', 'log', 'set_variable', 'end']),
    description: z.string().optional(),
    
    // Tool
    toolName: z.string().optional(),
    toolArgs: z.record(z.any()).optional(),
    saveResultAs: z.string().optional(),
    
    // LLM
    prompt: z.string().optional(),
    useContext: z.boolean().optional(),
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    
    // User Input
    promptMessage: z.string().optional(),
    inputVariable: z.string().optional(),
    timeout: z.number().optional(),
    
    // Conditional
    condition: z.string().optional(),
    thenSteps: z.array(z.string()).optional(),
    elseSteps: z.array(z.string()).optional(),
    
    // Log
    message: z.string().optional(),
    level: z.enum(['info', 'warn', 'error', 'success', 'debug']).optional(),
    
    // Variable
    variableName: z.string().optional(),
    value: z.any().optional(),
    
    // Flow
    continueOnError: z.boolean().optional(),
    retryOnError: z.number().optional(),
    retryDelay: z.number().optional(),
    nextStep: z.string().nullable().optional(),
});

const AutomationSchema = z.object({
    id: z.string(),
    version: z.string(),
    metadata: z.object({
        name: z.string(),
        description: z.string(),
        author: z.string().optional(),
        created: z.string(),
        updated: z.string().optional(),
        tags: z.array(z.string()),
    }),
    triggers: z.array(TriggerSchema),
    variables: z.record(VariableDefinitionSchema),
    steps: z.array(StepSchema),
    errorHandling: z.object({
        onStepError: z.enum(['abort', 'skip', 'retry']),
        maxRetries: z.number(),
        retryDelay: z.number().optional(),
        logErrors: z.boolean(),
        notifyOnError: z.boolean().optional(),
    }),
});

// ============================================
// AUTOMATION LOADER
// ============================================

export class AutomationLoader {
    private automationsDir: string;
    private automationsCache: Map<string, Automation> = new Map();

    constructor(automationsDir: string = join(process.cwd(), 'automations')) {
        this.automationsDir = automationsDir;
    }

    /**
     * Carrega todas as automa??es do diret?rio
     */
    loadAll(): Automation[] {
        if (!existsSync(this.automationsDir)) {
            console.warn(`??  Diret?rio de automa??es n?o encontrado: ${this.automationsDir}`);
            return [];
        }

        const files = readdirSync(this.automationsDir)
            .filter(f => f.endsWith('.json') && !f.startsWith('schema'));

        const automations: Automation[] = [];

        for (const file of files) {
            try {
                const automation = this.loadFile(join(this.automationsDir, file));
                automations.push(automation);
                this.automationsCache.set(automation.id, automation);
            } catch (error) {
                console.error(`? Erro ao carregar ${file}:`, error);
            }
        }

        console.log(`? Carregadas ${automations.length} automa??o(?es)`);
        return automations;
    }

    /**
     * Carrega uma automa??o espec?fica
     */
    loadFile(filePath: string): Automation {
        const content = readFileSync(filePath, 'utf-8');
        const json = JSON.parse(content);
        
        return this.validate(json);
    }

    /**
     * Valida automa??o contra schema
     */
    validate(data: any): Automation {
        const result = AutomationSchema.safeParse(data);
        
        if (!result.success) {
            throw new Error(`Valida??o falhou: ${result.error.message}`);
        }

        // Valida??es adicionais
        this.validateStepReferences(result.data);
        this.validateVariableReferences(result.data);

        return result.data;
    }

    /**
     * Valida refer?ncias entre steps
     */
    private validateStepReferences(automation: Automation): void {
        const stepIds = new Set(automation.steps.map(s => s.id));

        for (const step of automation.steps) {
            // Validar nextStep
            if (step.nextStep && !stepIds.has(step.nextStep)) {
                throw new Error(`Step ${step.id}: nextStep ${step.nextStep} n?o existe`);
            }

            // Validar conditional steps
            if (step.type === 'conditional') {
                for (const stepId of [...(step.thenSteps || []), ...(step.elseSteps || [])]) {
                    if (!stepIds.has(stepId)) {
                        throw new Error(`Step ${step.id}: step condicional ${stepId} n?o existe`);
                    }
                }
            }
        }
    }

    /**
     * Valida refer?ncias de vari?veis
     */
    private validateVariableReferences(automation: Automation): void {
        const variableNames = new Set(Object.keys(automation.variables));

        for (const step of automation.steps) {
            if (step.saveResultAs && !variableNames.has(step.saveResultAs)) {
                console.warn(`??  Step ${step.id}: vari?vel ${step.saveResultAs} n?o definida`);
            }

            if (step.inputVariable && !variableNames.has(step.inputVariable)) {
                console.warn(`??  Step ${step.id}: vari?vel ${step.inputVariable} n?o definida`);
            }

            if (step.variableName && !variableNames.has(step.variableName)) {
                console.warn(`??  Step ${step.id}: vari?vel ${step.variableName} n?o definida`);
            }
        }
    }

    /**
     * Busca automa??o por ID
     */
    getById(id: string): Automation | null {
        return this.automationsCache.get(id) || null;
    }

    /**
     * Recarrega todas as automa??es (hot-reload)
     */
    reload(): Automation[] {
        this.automationsCache.clear();
        return this.loadAll();
    }
}
```

### 1.3 Criar Trigger Matcher

**Arquivo:** `source/automation/trigger-matcher.ts`

```typescript
import type { Automation, Trigger } from './types.js';

// ============================================
// TRIGGER MATCHER
// ============================================

export class TriggerMatcher {
    private automations: Automation[] = [];

    /**
     * Atualiza lista de automa??es
     */
    setAutomations(automations: Automation[]): void {
        this.automations = automations;
    }

    /**
     * Encontra automa??o que corresponde ? mensagem
     */
    findAutomation(message: string): Automation | null {
        for (const automation of this.automations) {
            if (this.matchesAnyTrigger(message, automation.triggers)) {
                return automation;
            }
        }
        return null;
    }

    /**
     * Verifica se mensagem corresponde a algum trigger
     */
    private matchesAnyTrigger(message: string, triggers: Trigger[]): boolean {
        for (const trigger of triggers) {
            if (this.matchesTrigger(message, trigger)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Verifica se mensagem corresponde a um trigger espec?fico
     */
    private matchesTrigger(message: string, trigger: Trigger): boolean {
        const msg = trigger.caseSensitive ? message : message.toLowerCase();
        const pattern = trigger.caseSensitive ? trigger.pattern : trigger.pattern.toLowerCase();

        switch (trigger.type) {
            case 'exact':
                return msg === pattern;

            case 'contains':
                return msg.includes(pattern);

            case 'regex':
                try {
                    const regex = new RegExp(pattern, trigger.flags || '');
                    return regex.test(message);
                } catch (error) {
                    console.error(`? Regex inv?lida: ${pattern}`, error);
                    return false;
                }

            default:
                return false;
        }
    }

    /**
     * Lista todas as automa??es dispon?veis
     */
    listAutomations(): Array<{ id: string; name: string; triggers: string[] }> {
        return this.automations.map(a => ({
            id: a.id,
            name: a.metadata.name,
            triggers: a.triggers.map(t => t.pattern),
        }));
    }
}
```

### 1.4 Criar Automa??o de Teste

**Arquivo:** `automations/hello-world.json`

```json
{
  "id": "hello-world",
  "version": "1.0.0",
  "metadata": {
    "name": "Hello World Automation",
    "description": "Automa??o de teste b?sica para validar o sistema",
    "author": "Sistema",
    "created": "2025-11-02",
    "tags": ["test", "hello", "basic"]
  },
  "triggers": [
    {
      "type": "exact",
      "pattern": "hello automation",
      "caseSensitive": false
    },
    {
      "type": "exact",
      "pattern": "teste automa??o"
    }
  ],
  "variables": {
    "userName": {
      "type": "string",
      "defaultValue": "Usu?rio",
      "description": "Nome do usu?rio"
    },
    "timestamp": {
      "type": "string",
      "defaultValue": "",
      "description": "Timestamp da execu??o"
    }
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
      "type": "set_variable",
      "variableName": "timestamp",
      "value": "${Date.now()}"
    },
    {
      "id": "step_3",
      "type": "tool",
      "toolName": "write_file",
      "toolArgs": {
        "file_path": "hello-automation-${variables.timestamp}.txt",
        "content": "Hello from automation at ${variables.timestamp}!\n\nGreetings, ${variables.userName}!"
      }
    },
    {
      "id": "step_4",
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

### 1.5 Testes da Fase 1

**Arquivo:** `tests/automation/automation-loader.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { AutomationLoader } from '../../source/automation/automation-loader.js';
import { join } from 'path';

describe('AutomationLoader', () => {
    it('deve carregar automa??o v?lida', () => {
        const loader = new AutomationLoader(join(__dirname, '../../automations'));
        const automation = loader.loadFile(join(__dirname, '../../automations/hello-world.json'));
        
        expect(automation.id).toBe('hello-world');
        expect(automation.steps.length).toBeGreaterThan(0);
    });

    it('deve rejeitar automa??o inv?lida', () => {
        const loader = new AutomationLoader();
        
        expect(() => {
            loader.validate({ id: 'test' }); // Faltando campos obrigat?rios
        }).toThrow();
    });

    it('deve carregar todas as automa??es', () => {
        const loader = new AutomationLoader(join(__dirname, '../../automations'));
        const automations = loader.loadAll();
        
        expect(automations.length).toBeGreaterThan(0);
    });
});
```

**Arquivo:** `tests/automation/trigger-matcher.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TriggerMatcher } from '../../source/automation/trigger-matcher.js';
import { AutomationLoader } from '../../source/automation/automation-loader.js';
import { join } from 'path';

describe('TriggerMatcher', () => {
    let matcher: TriggerMatcher;

    beforeEach(() => {
        const loader = new AutomationLoader(join(__dirname, '../../automations'));
        const automations = loader.loadAll();
        matcher = new TriggerMatcher();
        matcher.setAutomations(automations);
    });

    it('deve encontrar automa??o com trigger exact', () => {
        const automation = matcher.findAutomation('hello automation');
        expect(automation).not.toBeNull();
        expect(automation?.id).toBe('hello-world');
    });

    it('deve ignorar case quando caseSensitive=false', () => {
        const automation = matcher.findAutomation('HELLO AUTOMATION');
        expect(automation).not.toBeNull();
    });

    it('deve retornar null quando n?o encontrar', () => {
        const automation = matcher.findAutomation('mensagem inexistente');
        expect(automation).toBeNull();
    });

    it('deve listar todas as automa??es', () => {
        const list = matcher.listAutomations();
        expect(list.length).toBeGreaterThan(0);
        expect(list[0]).toHaveProperty('id');
        expect(list[0]).toHaveProperty('name');
        expect(list[0]).toHaveProperty('triggers');
    });
});
```

---

## ?? FASE 2: EXECUTOR B?SICO

**Dura??o:** 2-3 dias  
**Objetivo:** Executar steps simples (log, tool, set_variable)

### 2.1 State Manager

**Arquivo:** `source/automation/state-manager.ts`

```typescript
import type { AutomationState, StepResult, ExecutionError } from './types.js';

export class StateManager {
    private state: AutomationState;

    constructor(automationId: string, initialVariables: Record<string, any> = {}) {
        this.state = {
            automationId,
            startTime: Date.now(),
            currentStepId: null,
            variables: { ...initialVariables },
            stepResults: {},
            errors: [],
            status: 'running',
        };
    }

    // Vari?veis
    getVariable(name: string): any {
        return this.state.variables[name];
    }

    setVariable(name: string, value: any): void {
        this.state.variables[name] = value;
    }

    getAllVariables(): Record<string, any> {
        return { ...this.state.variables };
    }

    // Step atual
    setCurrentStep(stepId: string | null): void {
        this.state.currentStepId = stepId;
    }

    getCurrentStepId(): string | null {
        return this.state.currentStepId;
    }

    // Resultados de steps
    addStepResult(result: StepResult): void {
        this.state.stepResults[result.stepId] = result;
    }

    getStepResult(stepId: string): StepResult | undefined {
        return this.state.stepResults[stepId];
    }

    // Erros
    addError(error: ExecutionError): void {
        this.state.errors.push(error);
    }

    getErrors(): ExecutionError[] {
        return [...this.state.errors];
    }

    // Status
    setStatus(status: AutomationState['status']): void {
        this.state.status = status;
    }

    getStatus(): AutomationState['status'] {
        return this.state.status;
    }

    // Estado completo
    getState(): AutomationState {
        return { ...this.state };
    }
}
```

### 2.2 Variable Resolver

**Arquivo:** `source/automation/utils/variable-resolver.ts`

```typescript
/**
 * Resolve vari?veis em strings no formato ${variables.name}
 */
export class VariableResolver {
    /**
     * Resolve todas as vari?veis em uma string
     */
    resolve(template: string, variables: Record<string, any>): string {
        return template.replace(/\$\{([^}]+)\}/g, (match, expression) => {
            try {
                return this.evaluateExpression(expression.trim(), variables);
            } catch (error) {
                console.warn(`??  Erro ao resolver ${match}:`, error);
                return match; // Retorna original se falhar
            }
        });
    }

    /**
     * Avalia express?o simples
     */
    private evaluateExpression(expression: string, variables: Record<string, any>): string {
        // Caso especial: Date.now()
        if (expression === 'Date.now()') {
            return String(Date.now());
        }

        // Caso especial: vari?veis simples (variables.name)
        if (expression.startsWith('variables.')) {
            const varName = expression.substring('variables.'.length);
            const value = this.getNestedValue(variables, varName);
            return String(value);
        }

        // Fallback: tentar avaliar como JavaScript (CUIDADO: risco de seguran?a)
        // TODO: Implementar parser seguro de express?es
        return expression;
    }

    /**
     * Acessa valor aninhado (ex: user.name.first)
     */
    private getNestedValue(obj: any, path: string): any {
        const parts = path.split('.');
        let current = obj;
        
        for (const part of parts) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[part];
        }
        
        return current;
    }

    /**
     * Resolve vari?veis em um objeto recursivamente
     */
    resolveObject(obj: any, variables: Record<string, any>): any {
        if (typeof obj === 'string') {
            return this.resolve(obj, variables);
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.resolveObject(item, variables));
        }
        
        if (obj !== null && typeof obj === 'object') {
            const resolved: Record<string, any> = {};
            for (const [key, value] of Object.entries(obj)) {
                resolved[key] = this.resolveObject(value, variables);
            }
            return resolved;
        }
        
        return obj;
    }
}
```

### 2.3 Base Step Handler

**Arquivo:** `source/automation/step-handlers/base-handler.ts`

```typescript
import type { Step, StepResult, ExecutionOptions } from '../types.js';
import type { StateManager } from '../state-manager.js';

export abstract class BaseStepHandler {
    protected stateManager: StateManager;
    protected options: ExecutionOptions;

    constructor(stateManager: StateManager, options: ExecutionOptions) {
        this.stateManager = stateManager;
        this.options = options;
    }

    /**
     * Executa o step
     */
    abstract execute(step: Step): Promise<StepResult>;

    /**
     * Verifica se pode executar este tipo de step
     */
    abstract canHandle(step: Step): boolean;

    /**
     * Cria resultado de step bem-sucedido
     */
    protected success(stepId: string, result: any, duration: number): StepResult {
        return {
            stepId,
            success: true,
            result,
            duration,
            timestamp: Date.now(),
        };
    }

    /**
     * Cria resultado de step com erro
     */
    protected failure(stepId: string, error: string, duration: number): StepResult {
        return {
            stepId,
            success: false,
            error,
            duration,
            timestamp: Date.now(),
        };
    }
}
```

### 2.4 Log Handler

**Arquivo:** `source/automation/step-handlers/log-handler.ts`

```typescript
import { BaseStepHandler } from './base-handler.js';
import { VariableResolver } from '../utils/variable-resolver.js';
import type { Step, StepResult } from '../types.js';

export class LogStepHandler extends BaseStepHandler {
    private resolver = new VariableResolver();

    canHandle(step: Step): boolean {
        return step.type === 'log';
    }

    async execute(step: Step): Promise<StepResult> {
        const startTime = Date.now();

        try {
            const message = step.message || '';
            const level = step.level || 'info';
            
            // Resolver vari?veis na mensagem
            const variables = this.stateManager.getAllVariables();
            const resolvedMessage = this.resolver.resolve(message, variables);

            // Emitir log
            this.logMessage(resolvedMessage, level);

            // Notificar progresso
            if (this.options.onProgress) {
                this.options.onProgress(step, {
                    stepId: step.id,
                    success: true,
                    result: resolvedMessage,
                    duration: Date.now() - startTime,
                    timestamp: Date.now(),
                });
            }

            return this.success(step.id, resolvedMessage, Date.now() - startTime);
        } catch (error) {
            return this.failure(
                step.id,
                error instanceof Error ? error.message : String(error),
                Date.now() - startTime
            );
        }
    }

    private logMessage(message: string, level: string): void {
        const emoji = this.getLevelEmoji(level);
        console.log(`${emoji} ${message}`);
    }

    private getLevelEmoji(level: string): string {
        const emojis: Record<string, string> = {
            info: '??',
            warn: '??',
            error: '?',
            success: '?',
            debug: '??',
        };
        return emojis[level] || '??';
    }
}
```

### 2.5 Tool Handler

**Arquivo:** `source/automation/step-handlers/tool-handler.ts`

```typescript
import { BaseStepHandler } from './base-handler.js';
import { VariableResolver } from '../utils/variable-resolver.js';
import { executeToolCall } from '../../tools/index.js';
import type { Step, StepResult } from '../types.js';

export class ToolStepHandler extends BaseStepHandler {
    private resolver = new VariableResolver();

    canHandle(step: Step): boolean {
        return step.type === 'tool';
    }

    async execute(step: Step): Promise<StepResult> {
        const startTime = Date.now();

        try {
            if (!step.toolName) {
                throw new Error('toolName ? obrigat?rio para step tipo tool');
            }

            // Resolver vari?veis nos argumentos
            const variables = this.stateManager.getAllVariables();
            const resolvedArgs = this.resolver.resolveObject(step.toolArgs || {}, variables);

            // Notificar in?cio
            if (this.options.onStepStart) {
                this.options.onStepStart(step);
            }

            // Executar tool
            const result = await executeToolCall(
                step.toolName,
                resolvedArgs,
                this.options.workDir
            );

            // Salvar resultado em vari?vel se especificado
            if (step.saveResultAs) {
                this.stateManager.setVariable(step.saveResultAs, result);
            }

            // Notificar conclus?o
            const stepResult = this.success(step.id, result, Date.now() - startTime);
            
            if (this.options.onStepComplete) {
                this.options.onStepComplete(step, stepResult);
            }

            return stepResult;
        } catch (error) {
            const stepResult = this.failure(
                step.id,
                error instanceof Error ? error.message : String(error),
                Date.now() - startTime
            );

            if (this.options.onError) {
                this.options.onError({
                    stepId: step.id,
                    message: stepResult.error || 'Unknown error',
                    timestamp: Date.now(),
                    recoverable: step.continueOnError || false,
                });
            }

            return stepResult;
        }
    }
}
```

### 2.6 Variable Handler

**Arquivo:** `source/automation/step-handlers/variable-handler.ts`

```typescript
import { BaseStepHandler } from './base-handler.js';
import { VariableResolver } from '../utils/variable-resolver.js';
import type { Step, StepResult } from '../types.js';

export class VariableStepHandler extends BaseStepHandler {
    private resolver = new VariableResolver();

    canHandle(step: Step): boolean {
        return step.type === 'set_variable';
    }

    async execute(step: Step): Promise<StepResult> {
        const startTime = Date.now();

        try {
            if (!step.variableName) {
                throw new Error('variableName ? obrigat?rio para step tipo set_variable');
            }

            // Resolver valor
            const variables = this.stateManager.getAllVariables();
            const resolvedValue = this.resolver.resolveObject(step.value, variables);

            // Definir vari?vel
            this.stateManager.setVariable(step.variableName, resolvedValue);

            console.log(`?? Vari?vel definida: ${step.variableName} = ${JSON.stringify(resolvedValue)}`);

            return this.success(step.id, resolvedValue, Date.now() - startTime);
        } catch (error) {
            return this.failure(
                step.id,
                error instanceof Error ? error.message : String(error),
                Date.now() - startTime
            );
        }
    }
}
```

---

## ?? FASE 3: INTEGRA??O COM CHAT

**Dura??o:** 1-2 dias  
**Objetivo:** Conectar sistema de automa??o ao chat CLI

### 3.1 Automation Manager (Singleton)

**Arquivo:** `source/automation/automation-manager.ts`

```typescript
import { AutomationLoader } from './automation-loader.js';
import { TriggerMatcher } from './trigger-matcher.js';
import { AutomationExecutor } from './automation-executor.js';
import type { Automation, ExecutionOptions, ExecutionResult } from './types.js';
import { join } from 'path';

export class AutomationManager {
    private static instance: AutomationManager;
    
    private loader: AutomationLoader;
    private matcher: TriggerMatcher;
    private executor: AutomationExecutor;
    private automations: Automation[] = [];

    private constructor() {
        const automationsDir = join(process.cwd(), 'automations');
        this.loader = new AutomationLoader(automationsDir);
        this.matcher = new TriggerMatcher();
        this.executor = new AutomationExecutor();
        
        this.loadAutomations();
    }

    static getInstance(): AutomationManager {
        if (!AutomationManager.instance) {
            AutomationManager.instance = new AutomationManager();
        }
        return AutomationManager.instance;
    }

    /**
     * Carrega todas as automa??es
     */
    private loadAutomations(): void {
        this.automations = this.loader.loadAll();
        this.matcher.setAutomations(this.automations);
        console.log(`? ${this.automations.length} automa??o(?es) carregada(s)`);
    }

    /**
     * Recarrega automa??es (hot-reload)
     */
    reload(): void {
        console.log('?? Recarregando automa??es...');
        this.loadAutomations();
    }

    /**
     * Busca automa??o que corresponde ? mensagem
     */
    findAutomation(message: string): Automation | null {
        return this.matcher.findAutomation(message);
    }

    /**
     * Executa automa??o
     */
    async executeAutomation(
        automation: Automation,
        options: ExecutionOptions
    ): Promise<ExecutionResult> {
        return this.executor.execute(automation, options);
    }

    /**
     * Lista todas as automa??es dispon?veis
     */
    listAutomations(): Array<{ id: string; name: string; triggers: string[] }> {
        return this.matcher.listAutomations();
    }

    /**
     * Busca automa??o por ID
     */
    getAutomationById(id: string): Automation | null {
        return this.loader.getById(id);
    }
}

// Export singleton instance
export const automationManager = AutomationManager.getInstance();
```

### 3.2 Modificar app.tsx

**Arquivo:** `source/app.tsx` (modifica??es)

```typescript
// ... imports existentes ...
import { automationManager } from './automation/automation-manager.js';

// ... c?digo existente ...

const submitMsg = useCallback(async () => {
    if (!input.trim() || busy) return;
    
    const txt = input.trim();
    
    // Verificar comandos primeiro
    if (txt.startsWith('/') && txt.split(' ').length === 1) {
        selectCmd(txt);
        return;
    }
    
    // ?? NOVO: Verificar se ? uma automa??o
    const automation = automationManager.findAutomation(txt);
    
    if (automation) {
        setInput('');
        setCmds(false);
        
        const userMsgId = generateId('user');
        addMessage({ id: userMsgId, role: 'user', content: txt });
        
        setBusy(true);
        
        try {
            addMessage({
                id: generateId('assistant'),
                role: 'assistant',
                content: `?? Executando automa??o: ${automation.metadata.name}...`
            });
            
            const workDir = join(process.cwd(), 'work', `automation-${Date.now()}`);
            
            const result = await automationManager.executeAutomation(automation, {
                workDir,
                onProgress: (step, stepResult) => {
                    // Atualizar UI com progresso
                    addMessage({
                        id: generateId('tool'),
                        role: 'tool',
                        content: '',
                        toolCall: {
                            name: `Step: ${step.type}`,
                            args: {},
                            status: stepResult.success ? 'complete' : 'error',
                            result: stepResult.result || stepResult.error
                        }
                    });
                },
                onStepComplete: (step, stepResult) => {
                    console.log(`? Step ${step.id} completo`);
                }
            });
            
            addMessage({
                id: generateId('assistant'),
                role: 'assistant',
                content: result.success 
                    ? `? Automa??o conclu?da com sucesso!\n\n${result.output || ''}`
                    : `? Automa??o falhou: ${result.finalState.errors[0]?.message || 'Erro desconhecido'}`
            });
            
        } catch (err) {
            addMessage({
                id: generateId('error'),
                role: 'assistant',
                content: `Error: ${err instanceof Error ? err.message : String(err)}`
            });
        } finally {
            setBusy(false);
        }
        
        return;
    }
    
    // Fluxo normal (LLM) se n?o for automa??o
    setInput('');
    setCmds(false);
    
    const userMsgId = generateId('user');
    addMessage({ id: userMsgId, role: 'user', content: txt });
    
    setBusy(true);
    
    // ... resto do c?digo existente ...
}, [input, busy, selectCmd, addMessage]);
```

---

## ?? CHECKLIST DE IMPLEMENTA??O

### Fase 1: Funda??o ?
- [ ] Criar `source/automation/types.ts`
- [ ] Criar `source/automation/automation-loader.ts`
- [ ] Criar `source/automation/trigger-matcher.ts`
- [ ] Criar `automations/hello-world.json`
- [ ] Testes unit?rios para loader
- [ ] Testes unit?rios para matcher

### Fase 2: Executor B?sico ?
- [ ] Criar `source/automation/state-manager.ts`
- [ ] Criar `source/automation/utils/variable-resolver.ts`
- [ ] Criar `source/automation/step-handlers/base-handler.ts`
- [ ] Criar `source/automation/step-handlers/log-handler.ts`
- [ ] Criar `source/automation/step-handlers/tool-handler.ts`
- [ ] Criar `source/automation/step-handlers/variable-handler.ts`
- [ ] Criar `source/automation/automation-executor.ts`
- [ ] Testes para cada handler

### Fase 3: Integra??o ?
- [ ] Criar `source/automation/automation-manager.ts`
- [ ] Modificar `source/app.tsx` (adicionar intercepta??o)
- [ ] Testar integra??o end-to-end
- [ ] Validar UI mostrando progresso

### Fase 4: LLM e Condicionais
- [ ] Criar `source/automation/step-handlers/llm-handler.ts`
- [ ] Criar `source/automation/step-handlers/conditional-handler.ts`
- [ ] Criar `source/automation/utils/condition-evaluator.ts`
- [ ] Criar `automations/relatorio-semanal.json`
- [ ] Testes de condicionais
- [ ] Testes de LLM integration

### Fase 5: Input de Usu?rio
- [ ] Criar `source/automation/step-handlers/user-input-handler.ts`
- [ ] Modificar UI para capturar input de automa??o
- [ ] Sistema de pause/resume
- [ ] Timeout de espera
- [ ] Testes de input

---

## ? CRIT?RIOS DE SUCESSO

### MVP (Fases 1-3)
- ? Carregar automa??es JSON sem erros
- ? Identificar trigger "hello automation"
- ? Executar automa??o com 3 steps (log ? tool ? log)
- ? Ver progresso na UI do chat
- ? Vari?veis ${variables.name} funcionando
- ? Criar arquivo via automa??o

### Completo (Fases 1-5)
- ? LLM processing dentro de automa??o
- ? Condicionais redirecionando fluxo
- ? Input de usu?rio pausando/resumindo
- ? Automa??o "relat?rio semanal" funcionando
- ? Hot-reload de automa??es
- ? >80% cobertura de testes

---

**FIM DO PLANO DE IMPLEMENTA??O**

**Pr?ximo Passo:** Come?ar Fase 1 - Funda??o  
**Tempo Estimado Total:** 9-14 dias de trabalho focado
