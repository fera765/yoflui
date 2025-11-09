import { BaseStepHandler } from './base-handler.js';
import type { Step, StepResult } from '../types.js';

export class EndStepHandler extends BaseStepHandler {
    canHandle(step: Step): boolean {
        return step.type === 'end';
    }

    async execute(step: Step): Promise<StepResult> {
        const startTime = Date.now();

        console.log(`🏁 Automation completed`);

        return this.success(step.id, 'end', Date.now() - startTime);
    }
}
