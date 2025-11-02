/**
 * Types for Automation System
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

export interface AutomationMetadata {
    name: string;
    description: string;
    author?: string;
    created: string;
    updated?: string;
    tags: string[];
    category?: string;
}

export interface Trigger {
    type: 'exact' | 'regex' | 'contains';
    pattern: string;
    caseSensitive?: boolean;
    flags?: string;
}

export interface VariableDefinition {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    defaultValue?: any;
    required?: boolean;
    description?: string;
}

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

export interface ErrorHandlingConfig {
    onStepError: 'abort' | 'skip' | 'retry';
    maxRetries: number;
    retryDelay?: number;
    logErrors: boolean;
    notifyOnError?: boolean;
}

export interface AutomationState {
    automationId: string;
    startTime: number;
    currentStepId: string | null;
    variables: Record<string, any>;
    stepResults: Record<string, StepResult>;
    errors: ExecutionError[];
    status: 'running' | 'paused' | 'completed' | 'failed';
}

export interface StepResult {
    stepId: string;
    success: boolean;
    result?: any;
    error?: string;
    duration: number;
    timestamp: number;
}

export interface ExecutionError {
    stepId: string;
    message: string;
    timestamp: number;
    recoverable: boolean;
}

export interface ExecutionResult {
    success: boolean;
    automationId: string;
    duration: number;
    stepsExecuted: number;
    finalState: AutomationState;
    output?: string;
}

export interface ExecutionOptions {
    workDir: string;
    initialVariables?: Record<string, any>;
    onProgress?: (step: Step, result: StepResult) => void;
    onStepStart?: (step: Step) => void;
    onStepComplete?: (step: Step, result: StepResult) => void;
    onError?: (error: ExecutionError) => void;
    onUserInputRequired?: (prompt: string) => Promise<string>;
}
