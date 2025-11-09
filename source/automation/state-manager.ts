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

    // Variables
    getVariable(name: string): any {
        return this.state.variables[name];
    }

    setVariable(name: string, value: any): void {
        this.state.variables[name] = value;
    }

    getAllVariables(): Record<string, any> {
        return { ...this.state.variables };
    }

    // Current step
    setCurrentStep(stepId: string | null): void {
        this.state.currentStepId = stepId;
    }

    getCurrentStepId(): string | null {
        return this.state.currentStepId;
    }

    // Step results
    addStepResult(result: StepResult): void {
        this.state.stepResults[result.stepId] = result;
    }

    getStepResult(stepId: string): StepResult | undefined {
        return this.state.stepResults[stepId];
    }

    // Errors
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

    // Full state
    getState(): AutomationState {
        return { ...this.state };
    }
}
