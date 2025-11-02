import type { Automation, ExecutionOptions, ExecutionResult, Step } from './types.js';
import { StateManager } from './state-manager.js';
import { LogStepHandler } from './step-handlers/log-handler.js';
import { ToolStepHandler } from './step-handlers/tool-handler.js';
import { VariableStepHandler } from './step-handlers/variable-handler.js';
import { LLMStepHandler } from './step-handlers/llm-handler.js';
import { ConditionalStepHandler } from './step-handlers/conditional-handler.js';
import { UserInputStepHandler } from './step-handlers/user-input-handler.js';
import { EndStepHandler } from './step-handlers/end-handler.js';
import type { BaseStepHandler } from './step-handlers/base-handler.js';

export class AutomationExecutor {
    async execute(automation: Automation, options: ExecutionOptions): Promise<ExecutionResult> {
        const startTime = Date.now();
        
        // Initialize state with default variables
        const initialVars = { ...options.initialVariables };
        for (const [name, def] of Object.entries(automation.variables)) {
            if (!(name in initialVars) && def.defaultValue !== undefined) {
                initialVars[name] = def.defaultValue;
            }
        }

        const stateManager = new StateManager(automation.id, initialVars);

        // Initialize handlers
        const handlers: BaseStepHandler[] = [
            new LogStepHandler(stateManager, options),
            new ToolStepHandler(stateManager, options),
            new VariableStepHandler(stateManager, options),
            new LLMStepHandler(stateManager, options),
            new ConditionalStepHandler(stateManager, options),
            new UserInputStepHandler(stateManager, options),
            new EndStepHandler(stateManager, options),
        ];

        let stepsExecuted = 0;
        let currentStepIndex = 0;
        const maxIterations = automation.steps.length * 2; // Prevent infinite loops
        let iterations = 0;

        try {
            while (currentStepIndex < automation.steps.length && iterations < maxIterations) {
                iterations++;
                const step = automation.steps[currentStepIndex];
                
                stateManager.setCurrentStep(step.id);

                // Find handler for this step
                const handler = handlers.find(h => h.canHandle(step));
                if (!handler) {
                    throw new Error(`No handler found for step type: ${step.type}`);
                }

                // Execute step with retry logic
                const result = await this.executeStepWithRetry(
                    step,
                    handler,
                    automation.errorHandling
                );

                stateManager.addStepResult(result);
                stepsExecuted++;

                // Handle conditional branching
                if (step.type === 'conditional' && result.success && result.result) {
                    const { nextSteps } = result.result;
                    if (nextSteps && nextSteps.length > 0) {
                        // Find first nextStep in the steps array
                        const nextStepId = nextSteps[0];
                        const nextIndex = automation.steps.findIndex(s => s.id === nextStepId);
                        if (nextIndex !== -1) {
                            currentStepIndex = nextIndex;
                            continue;
                        }
                    }
                }

                // Handle end step
                if (step.type === 'end') {
                    break;
                }

                // Handle explicit nextStep
                if (step.nextStep) {
                    const nextIndex = automation.steps.findIndex(s => s.id === step.nextStep);
                    if (nextIndex !== -1) {
                        currentStepIndex = nextIndex;
                        continue;
                    }
                }

                // Handle errors
                if (!result.success) {
                    if (automation.errorHandling.onStepError === 'abort' && !step.continueOnError) {
                        stateManager.setStatus('failed');
                        break;
                    }
                    // If skip or continueOnError, just move to next step
                }

                currentStepIndex++;
            }

            stateManager.setStatus('completed');

            return {
                success: true,
                automationId: automation.id,
                duration: Date.now() - startTime,
                stepsExecuted,
                finalState: stateManager.getState(),
            };
        } catch (error) {
            stateManager.setStatus('failed');
            stateManager.addError({
                stepId: stateManager.getCurrentStepId() || 'unknown',
                message: error instanceof Error ? error.message : String(error),
                timestamp: Date.now(),
                recoverable: false,
            });

            return {
                success: false,
                automationId: automation.id,
                duration: Date.now() - startTime,
                stepsExecuted,
                finalState: stateManager.getState(),
            };
        }
    }

    private async executeStepWithRetry(
        step: Step,
        handler: BaseStepHandler,
        errorHandling: Automation['errorHandling']
    ) {
        const maxRetries = step.retryOnError ?? errorHandling.maxRetries;
        const retryDelay = step.retryDelay ?? errorHandling.retryDelay ?? 1000;

        let lastError: any;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await handler.execute(step);
                
                if (result.success || !step.continueOnError) {
                    return result;
                }

                lastError = result.error;
            } catch (error) {
                lastError = error;
            }

            if (attempt < maxRetries) {
                console.log(`?? Step ${step.id} failed, retrying... (${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }

        // All retries failed
        return handler['failure'](
            step.id,
            `Failed after ${maxRetries} retries: ${lastError}`,
            0
        );
    }
}
