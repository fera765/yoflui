/**
 * Dry-Run Manager for Automation Testing
 * Simulates automation execution without side effects
 */

import type { Automation } from './types.js';
import { logger } from '../utils/logger.js';

export interface DryRunResult {
    success: boolean;
    executionId: string;
    automationId: string;
    stepsSimulated: number;
    duration: number;
    steps: Array<{
        stepId: string;
        stepType: string;
        description: string;
        simulated: boolean;
        mockResult?: string;
        error?: string;
    }>;
    variables: Record<string, any>;
    warnings: string[];
    errors: string[];
}

export class DryRunManager {
    /**
     * Execute automation in dry-run mode
     */
    async executeDryRun(
        automation: Automation,
        executionId: string,
        webhookData?: any
    ): Promise<DryRunResult> {
        const startTime = Date.now();

        logger.info('DryRunManager', 'Starting dry-run', {
            executionId,
            automationId: automation.id,
            automationName: automation.metadata.name,
        }, executionId);

        const result: DryRunResult = {
            success: true,
            executionId,
            automationId: automation.id,
            stepsSimulated: 0,
            duration: 0,
            steps: [],
            variables: this.initializeVariables(automation, webhookData),
            warnings: [],
            errors: [],
        };

        try {
            // Validate automation structure
            this.validateAutomation(automation, result);

            // Simulate each step
            for (let i = 0; i < automation.steps.length; i++) {
                const step = automation.steps[i];
                
                logger.debug('DryRunManager', `Simulating step ${i + 1}/${automation.steps.length}`, {
                    stepId: step.id,
                    stepType: step.type,
                }, executionId);

                const stepResult = await this.simulateStep(step, result.variables, automation);

                result.steps.push(stepResult);
                result.stepsSimulated++;

                // Check for errors
                if (stepResult.error) {
                    result.success = false;
                    result.errors.push(`Step ${step.id}: ${stepResult.error}`);
                }

                // Update variables based on step simulation
                if (step.type === 'set_variable' && step.variableName && step.value) {
                    result.variables[step.variableName] = this.resolveValue(step.value, result.variables);
                }
            }

            result.duration = Date.now() - startTime;

            logger.info('DryRunManager', 'Dry-run completed', {
                executionId,
                success: result.success,
                stepsSimulated: result.stepsSimulated,
                duration: result.duration,
                warnings: result.warnings.length,
                errors: result.errors.length,
            }, executionId);

            return result;
        } catch (error) {
            result.success = false;
            result.errors.push(error instanceof Error ? error.message : String(error));
            result.duration = Date.now() - startTime;

            logger.error('DryRunManager', 'Dry-run failed', {
                executionId,
                error: error instanceof Error ? error.message : String(error),
            }, executionId);

            return result;
        }
    }

    /**
     * Validate automation structure
     */
    private validateAutomation(automation: Automation, result: DryRunResult): void {
        // Check if automation has steps
        if (!automation.steps || automation.steps.length === 0) {
            result.warnings.push('Automation has no steps');
        }

        // Check for duplicate step IDs
        const stepIds = automation.steps.map(s => s.id);
        const duplicates = stepIds.filter((id, index) => stepIds.indexOf(id) !== index);
        if (duplicates.length > 0) {
            result.errors.push(`Duplicate step IDs found: ${duplicates.join(', ')}`);
        }

        // Check for undefined variables
        for (const step of automation.steps) {
            if (step.type === 'tool') {
                const toolStep = step as any;
                if (toolStep.parameters) {
                    for (const [key, value] of Object.entries(toolStep.parameters)) {
                        if (typeof value === 'string' && value.includes('${')) {
                            const varMatch = value.match(/\$\{variables\.(\w+)\}/);
                            if (varMatch) {
                                const varName = varMatch[1];
                                if (!(varName in automation.variables)) {
                                    result.warnings.push(`Step ${step.id} references undefined variable: ${varName}`);
                                }
                            }
                        }
                    }
                }
            }
        }

        // Check for unreachable steps (after 'end')
        const endIndex = automation.steps.findIndex(s => s.type === 'end');
        if (endIndex !== -1 && endIndex < automation.steps.length - 1) {
            result.warnings.push(`${automation.steps.length - endIndex - 1} steps are unreachable after 'end' step`);
        }
    }

    /**
     * Simulate a single step
     */
    private async simulateStep(
        step: any,
        variables: Record<string, any>,
        automation: Automation
    ): Promise<{
        stepId: string;
        stepType: string;
        description: string;
        simulated: boolean;
        mockResult?: string;
        error?: string;
    }> {
        const stepResult = {
            stepId: step.id,
            stepType: step.type,
            description: step.description || 'No description',
            simulated: true,
            mockResult: undefined as string | undefined,
            error: undefined as string | undefined,
        };

        try {
            switch (step.type) {
                case 'log':
                    stepResult.mockResult = `[DRY-RUN] Would log: ${step.message || ''}`;
                    break;

                case 'tool':
                    if (!step.toolName) {
                        stepResult.error = 'Missing toolName';
                    } else {
                        stepResult.mockResult = `[DRY-RUN] Would execute tool: ${step.toolName}`;
                        if (step.parameters) {
                            const resolvedParams = this.resolveParameters(step.parameters, variables);
                            stepResult.mockResult += ` with params: ${JSON.stringify(resolvedParams)}`;
                        }
                    }
                    break;

                case 'llm_process':
                    stepResult.mockResult = `[DRY-RUN] Would call LLM with prompt: ${step.prompt || ''}`;
                    break;

                case 'wait_user_input':
                    stepResult.mockResult = `[DRY-RUN] Would wait for user input: ${step.promptMessage || ''}`;
                    break;

                case 'set_variable':
                    if (!step.variableName) {
                        stepResult.error = 'Missing variableName';
                    } else {
                        const value = this.resolveValue(step.value, variables);
                        stepResult.mockResult = `[DRY-RUN] Would set variable ${step.variableName} = ${value}`;
                    }
                    break;

                case 'conditional':
                    if (!step.condition) {
                        stepResult.error = 'Missing condition';
                    } else {
                        stepResult.mockResult = `[DRY-RUN] Would evaluate condition: ${step.condition}`;
                    }
                    break;

                case 'end':
                    stepResult.mockResult = `[DRY-RUN] Would end automation with message: ${step.message || 'No message'}`;
                    break;

                default:
                    stepResult.error = `Unknown step type: ${step.type}`;
            }
        } catch (error) {
            stepResult.error = error instanceof Error ? error.message : String(error);
        }

        return stepResult;
    }

    /**
     * Initialize variables
     */
    private initializeVariables(automation: Automation, webhookData?: any): Record<string, any> {
        const variables: Record<string, any> = {};

        // Initialize from automation definition
        for (const [name, def] of Object.entries(automation.variables)) {
            variables[name] = def.defaultValue;
        }

        // Override with webhook data if available
        if (webhookData) {
            const payload = webhookData.body || webhookData.query || {};
            for (const [key, value] of Object.entries(payload)) {
                if (key in variables) {
                    variables[key] = value;
                }
            }
        }

        return variables;
    }

    /**
     * Resolve variable references in value
     */
    private resolveValue(value: any, variables: Record<string, any>): any {
        if (typeof value === 'string' && value.includes('${')) {
            let resolved = value;
            const matches = value.matchAll(/\$\{variables\.(\w+)\}/g);
            for (const match of matches) {
                const varName = match[1];
                const varValue = variables[varName] || `[UNDEFINED:${varName}]`;
                resolved = resolved.replace(match[0], String(varValue));
            }
            return resolved;
        }
        return value;
    }

    /**
     * Resolve parameters
     */
    private resolveParameters(parameters: Record<string, any>, variables: Record<string, any>): Record<string, any> {
        const resolved: Record<string, any> = {};

        for (const [key, value] of Object.entries(parameters)) {
            resolved[key] = this.resolveValue(value, variables);
        }

        return resolved;
    }

    /**
     * Generate dry-run report
     */
    generateReport(result: DryRunResult): string {
        const lines: string[] = [];

        lines.push('?'.repeat(60));
        lines.push('DRY-RUN REPORT');
        lines.push('?'.repeat(60));
        lines.push('');
        lines.push(`Automation ID: ${result.automationId}`);
        lines.push(`Execution ID: ${result.executionId}`);
        lines.push(`Status: ${result.success ? '? SUCCESS' : '? FAILED'}`);
        lines.push(`Duration: ${result.duration}ms`);
        lines.push(`Steps Simulated: ${result.stepsSimulated}`);
        lines.push('');

        if (result.warnings.length > 0) {
            lines.push('⚠️  WARNINGS:');
            for (const warning of result.warnings) {
                lines.push(`  - ${warning}`);
            }
            lines.push('');
        }

        if (result.errors.length > 0) {
            lines.push('? ERRORS:');
            for (const error of result.errors) {
                lines.push(`  - ${error}`);
            }
            lines.push('');
        }

        lines.push('📋 STEPS:');
        for (let i = 0; i < result.steps.length; i++) {
            const step = result.steps[i];
            lines.push(`  ${i + 1}. [${step.stepType}] ${step.stepId}`);
            if (step.description) {
                lines.push(`     ${step.description}`);
            }
            if (step.mockResult) {
                lines.push(`     ${step.mockResult}`);
            }
            if (step.error) {
                lines.push(`     ? ${step.error}`);
            }
        }

        lines.push('');
        lines.push('📊 VARIABLES:');
        for (const [name, value] of Object.entries(result.variables)) {
            lines.push(`  ${name}: ${JSON.stringify(value)}`);
        }

        lines.push('');
        lines.push('?'.repeat(60));

        return lines.join('\n');
    }
}

// Singleton instance
export const dryRunManager = new DryRunManager();
