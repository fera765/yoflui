import { BaseStepHandler } from './base-handler.js';
import { VariableResolver } from '../utils/variable-resolver.js';
import type { Step, StepResult } from '../types.js';

export class UserInputStepHandler extends BaseStepHandler {
    private resolver = new VariableResolver();

    canHandle(step: Step): boolean {
        return step.type === 'wait_user_input';
    }

    async execute(step: Step): Promise<StepResult> {
        const startTime = Date.now();

        try {
            if (!step.promptMessage || !step.inputVariable) {
                throw new Error('promptMessage and inputVariable are required for wait_user_input step');
            }

            const variables = this.stateManager.getAllVariables();
            const resolvedPrompt = this.resolver.resolve(step.promptMessage, variables);

            console.log(`? ${resolvedPrompt}`);

            if (!this.options.onUserInputRequired) {
                throw new Error('onUserInputRequired callback is not provided');
            }

            // Wait for user input with timeout
            const timeout = step.timeout || 300000; // 5 minutes default
            const inputPromise = this.options.onUserInputRequired(resolvedPrompt);
            const timeoutPromise = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('User input timeout')), timeout)
            );

            const userInput = await Promise.race([inputPromise, timeoutPromise]);

            this.stateManager.setVariable(step.inputVariable, userInput);

            console.log(`? Input received: ${userInput}`);

            return this.success(step.id, userInput, Date.now() - startTime);
        } catch (error) {
            return this.failure(
                step.id,
                error instanceof Error ? error.message : String(error),
                Date.now() - startTime
            );
        }
    }
}
