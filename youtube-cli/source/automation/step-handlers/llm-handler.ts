import { BaseStepHandler } from './base-handler.js';
import { VariableResolver } from '../utils/variable-resolver.js';
import { runAutonomousAgent } from '../../autonomous-agent.js';
import type { Step, StepResult } from '../types.js';

export class LLMStepHandler extends BaseStepHandler {
    private resolver = new VariableResolver();

    canHandle(step: Step): boolean {
        return step.type === 'llm_process';
    }

    async execute(step: Step): Promise<StepResult> {
        const startTime = Date.now();

        try {
            if (!step.prompt) {
                throw new Error('prompt is required for llm_process step');
            }

            const variables = this.stateManager.getAllVariables();
            const resolvedPrompt = this.resolver.resolve(step.prompt, variables);

            if (this.options.onStepStart) {
                this.options.onStepStart(step);
            }

            console.log(`🧠 LLM processing...`);

            const result = await runAutonomousAgent({
                userMessage: resolvedPrompt,
                workDir: this.options.workDir,
                onProgress: () => {},
                onKanbanUpdate: () => {},
                onToolExecute: () => {},
                onToolComplete: () => {},
            });

            if (step.saveResultAs) {
                this.stateManager.setVariable(step.saveResultAs, result);
            }

            const stepResult = this.success(step.id, result, Date.now() - startTime);
            
            if (this.options.onStepComplete) {
                this.options.onStepComplete(step, stepResult);
            }

            return stepResult;
        } catch (error) {
            return this.failure(
                step.id,
                error instanceof Error ? error.message : String(error),
                Date.now() - startTime
            );
        }
    }
}
