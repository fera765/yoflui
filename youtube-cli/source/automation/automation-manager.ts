import { AutomationLoader } from './automation-loader.js';
import { TriggerMatcher } from './trigger-matcher.js';
import { AutomationExecutor } from './automation-executor.js';
import type { Automation, ExecutionOptions, ExecutionResult } from './types.js';
import { join } from 'path';

export class AutomationManager {
    private static instance: AutomationManager;
    
    private loader: AutomationLoader;
    private matcher: TriggerMatcher;
    private executor: AutomationExecutor;
    private automations: Automation[] = [];
    private isInitialized: boolean = false;

    private constructor() {
        const automationsDir = join(process.cwd(), 'automations');
        this.loader = new AutomationLoader(automationsDir);
        this.matcher = new TriggerMatcher();
        this.executor = new AutomationExecutor();
    }

    static getInstance(): AutomationManager {
        if (!AutomationManager.instance) {
            AutomationManager.instance = new AutomationManager();
        }
        return AutomationManager.instance;
    }

    /**
     * Initialize - load all automations
     */
    initialize(): void {
        if (this.isInitialized) {
            return;
        }

        try {
            this.automations = this.loader.loadAll();
            this.matcher.setAutomations(this.automations);
            this.isInitialized = true;

            if (this.automations.length > 0) {
                console.log(`\n? Automation System Ready - ${this.automations.length} automation(s) loaded\n`);
            }
        } catch (error) {
            console.error('? Error initializing automation system:', error);
        }
    }

    /**
     * Reload all automations (hot-reload)
     */
    reload(): void {
        console.log('?? Reloading automations...');
        this.automations = this.loader.loadAll();
        this.matcher.setAutomations(this.automations);
    }

    /**
     * Find automation matching message
     */
    findAutomation(message: string): Automation | null {
        if (!this.isInitialized) {
            this.initialize();
        }
        return this.matcher.findAutomation(message);
    }

    /**
     * Execute automation
     */
    async executeAutomation(
        automation: Automation,
        options: ExecutionOptions
    ): Promise<ExecutionResult> {
        console.log(`\n${'?'.repeat(50)}`);
        console.log(`?? Executing: ${automation.metadata.name}`);
        console.log(`?? ${automation.metadata.description}`);
        console.log(`${'?'.repeat(50)}\n`);

        return this.executor.execute(automation, options);
    }

    /**
     * List all automations
     */
    listAutomations(): Array<{ id: string; name: string; triggers: string[]; category?: string; description: string }> {
        if (!this.isInitialized) {
            this.initialize();
        }
        
        return this.automations.map(a => ({
            id: a.id,
            name: a.metadata.name,
            description: a.metadata.description,
            triggers: a.triggers.map(t => t.pattern),
            category: a.metadata.category,
        }));
    }

    /**
     * Get automation by ID
     */
    getAutomationById(id: string): Automation | null {
        return this.loader.getById(id);
    }

    /**
     * Check if automations are available
     */
    hasAutomations(): boolean {
        if (!this.isInitialized) {
            this.initialize();
        }
        return this.automations.length > 0;
    }
}

// Export singleton instance
export const automationManager = AutomationManager.getInstance();
