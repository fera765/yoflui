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
                throw new Error('variableName is required for set_variable step');
            }

            const variables = this.stateManager.getAllVariables();
            const resolvedValue = this.resolver.resolveObject(step.value, variables);

            this.stateManager.setVariable(step.variableName, resolvedValue);

            console.log(`? Variable set: ${step.variableName} = ${JSON.stringify(resolvedValue)}`);

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
