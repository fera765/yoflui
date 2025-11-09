import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import type { Automation } from './types.js';

// Zod Schemas for validation
const TriggerSchema = z.object({
    type: z.enum(['exact', 'regex', 'contains']),
    pattern: z.string(),
    caseSensitive: z.boolean().optional(),
    flags: z.string().optional(),
});

const VariableDefinitionSchema = z.object({
    type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
    defaultValue: z.any().optional(),
    required: z.boolean().optional(),
    description: z.string().optional(),
});

const StepSchema = z.object({
    id: z.string(),
    type: z.enum(['tool', 'llm_process', 'wait_user_input', 'conditional', 'log', 'set_variable', 'end']),
    description: z.string().optional(),
    toolName: z.string().optional(),
    toolArgs: z.record(z.string(), z.any()).optional(),
    saveResultAs: z.string().optional(),
    prompt: z.string().optional(),
    useContext: z.boolean().optional(),
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    promptMessage: z.string().optional(),
    inputVariable: z.string().optional(),
    timeout: z.number().optional(),
    condition: z.string().optional(),
    thenSteps: z.array(z.string()).optional(),
    elseSteps: z.array(z.string()).optional(),
    message: z.string().optional(),
    level: z.enum(['info', 'warn', 'error', 'success', 'debug']).optional(),
    variableName: z.string().optional(),
    value: z.any().optional(),
    continueOnError: z.boolean().optional(),
    retryOnError: z.number().optional(),
    retryDelay: z.number().optional(),
    nextStep: z.string().nullable().optional(),
});

const AutomationSchema = z.object({
    id: z.string(),
    version: z.string(),
    metadata: z.object({
        name: z.string(),
        description: z.string(),
        author: z.string().optional(),
        created: z.string(),
        updated: z.string().optional(),
        tags: z.array(z.string()),
        category: z.string().optional(),
    }),
    triggers: z.array(TriggerSchema),
    variables: z.record(z.string(), VariableDefinitionSchema),
    steps: z.array(StepSchema),
    errorHandling: z.object({
        onStepError: z.enum(['abort', 'skip', 'retry']),
        maxRetries: z.number(),
        retryDelay: z.number().optional(),
        logErrors: z.boolean(),
        notifyOnError: z.boolean().optional(),
    }),
    webhookConfig: z.object({
        enabled: z.boolean(),
        requireAuth: z.boolean().optional(),
        method: z.enum(['GET', 'POST']).optional(),
        expectedPayload: z.record(z.string(), z.any()).optional(),
    }).optional(),
});

export class AutomationLoader {
    private automationsDir: string;
    private automationsCache: Map<string, Automation> = new Map();

    constructor(automationsDir: string = join(process.cwd(), 'automations')) {
        this.automationsDir = automationsDir;
    }

    /**
     * Load all automations from directory
     */
    loadAll(): Automation[] {
        if (!existsSync(this.automationsDir)) {
            console.log(`📁 Creating automations directory: ${this.automationsDir}`);
            return [];
        }

        const files = readdirSync(this.automationsDir)
            .filter(f => f.endsWith('.json') && !f.startsWith('_'));

        const automations: Automation[] = [];

        for (const file of files) {
            try {
                const automation = this.loadFile(join(this.automationsDir, file));
                automations.push(automation);
                this.automationsCache.set(automation.id, automation);
            } catch (error) {
                console.error(`❌ Error loading ${file}:`, error instanceof Error ? error.message : error);
            }
        }

        if (automations.length > 0) {
            console.log(`🔄 Loaded ${automations.length} automation(s)`);
        }

        return automations;
    }

    /**
     * Load specific automation file
     */
    loadFile(filePath: string): Automation {
        const content = readFileSync(filePath, 'utf-8');
        const json = JSON.parse(content);
        
        return this.validate(json);
    }

    /**
     * Validate automation against schema
     */
    validate(data: any): Automation {
        const result = AutomationSchema.safeParse(data);
        
        if (!result.success) {
            throw new Error(`Validation failed: ${result.error.message}`);
        }

        this.validateStepReferences(result.data as Automation);

        return result.data as Automation;
    }

    /**
     * Validate step references
     */
    private validateStepReferences(automation: Automation): void {
        const stepIds = new Set(automation.steps.map(s => s.id));

        for (const step of automation.steps) {
            if (step.nextStep && !stepIds.has(step.nextStep)) {
                throw new Error(`Step ${step.id}: nextStep ${step.nextStep} does not exist`);
            }

            if (step.type === 'conditional') {
                for (const stepId of [...(step.thenSteps || []), ...(step.elseSteps || [])]) {
                    if (!stepIds.has(stepId)) {
                        throw new Error(`Step ${step.id}: conditional step ${stepId} does not exist`);
                    }
                }
            }
        }
    }

    /**
     * Get automation by ID
     */
    getById(id: string): Automation | null {
        return this.automationsCache.get(id) || null;
    }

    /**
     * Reload all automations (hot-reload)
     */
    reload(): Automation[] {
        this.automationsCache.clear();
        return this.loadAll();
    }
}
