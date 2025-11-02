import type { Step, StepResult, ExecutionOptions } from '../types.js';
import type { StateManager } from '../state-manager.js';

export abstract class BaseStepHandler {
    protected stateManager: StateManager;
    protected options: ExecutionOptions;

    constructor(stateManager: StateManager, options: ExecutionOptions) {
        this.stateManager = stateManager;
        this.options = options;
    }

    abstract execute(step: Step): Promise<StepResult>;
    abstract canHandle(step: Step): boolean;

    protected success(stepId: string, result: any, duration: number): StepResult {
        return {
            stepId,
            success: true,
            result,
            duration,
            timestamp: Date.now(),
        };
    }

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
