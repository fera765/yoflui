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
                throw new Error('toolName is required for tool step');
            }

            const variables = this.stateManager.getAllVariables();
            const resolvedArgs = this.resolver.resolveObject(step.toolArgs || {}, variables);

            if (this.options.onStepStart) {
                this.options.onStepStart(step);
            }

            const result = await executeToolCall(
                step.toolName,
                resolvedArgs,
                this.options.workDir
            );

            if (step.saveResultAs) {
                this.stateManager.setVariable(step.saveResultAs, result);
            }

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
