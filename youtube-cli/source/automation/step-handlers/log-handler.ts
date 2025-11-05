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
            
            const variables = this.stateManager.getAllVariables();
            const resolvedMessage = this.resolver.resolve(message, variables);

            this.logMessage(resolvedMessage, level);

            if (this.options.onProgress) {
                const result = this.success(step.id, resolvedMessage, Date.now() - startTime);
                this.options.onProgress(step, result);
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
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
            success: '✅',
            debug: '🐛',
        };
        return emojis[level] || 'ℹ️';
    }
}
