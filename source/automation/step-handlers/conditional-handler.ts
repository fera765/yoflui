import { BaseStepHandler } from './base-handler.js';
import { ConditionEvaluator } from '../utils/condition-evaluator.js';
import type { Step, StepResult } from '../types.js';

export class ConditionalStepHandler extends BaseStepHandler {
    private evaluator = new ConditionEvaluator();

    canHandle(step: Step): boolean {
        return step.type === 'conditional';
    }

    async execute(step: Step): Promise<StepResult> {
        const startTime = Date.now();

        try {
            if (!step.condition) {
                throw new Error('condition is required for conditional step');
            }

            const variables = this.stateManager.getAllVariables();
            const conditionResult = this.evaluator.evaluate(step.condition, variables);

            const branchTaken = conditionResult ? 'then' : 'else';
            console.log(`🔀 Conditional: ${step.condition} → ${branchTaken}`);

            // Store which branch was taken for executor to follow
            const result = {
                conditionResult,
                branchTaken,
                nextSteps: conditionResult ? (step.thenSteps || []) : (step.elseSteps || []),
            };

            return this.success(step.id, result, Date.now() - startTime);
        } catch (error) {
            return this.failure(
                step.id,
                error instanceof Error ? error.message : String(error),
                Date.now() - startTime
            );
        }
    }
}
