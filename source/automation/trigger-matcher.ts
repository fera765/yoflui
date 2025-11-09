import type { Automation, Trigger } from './types.js';

export class TriggerMatcher {
    private automations: Automation[] = [];

    setAutomations(automations: Automation[]): void {
        this.automations = automations;
    }

    findAutomation(message: string): Automation | null {
        for (const automation of this.automations) {
            if (this.matchesAnyTrigger(message, automation.triggers)) {
                return automation;
            }
        }
        return null;
    }

    private matchesAnyTrigger(message: string, triggers: Trigger[]): boolean {
        for (const trigger of triggers) {
            if (this.matchesTrigger(message, trigger)) {
                return true;
            }
        }
        return false;
    }

    private matchesTrigger(message: string, trigger: Trigger): boolean {
        const msg = trigger.caseSensitive ? message : message.toLowerCase();
        const pattern = trigger.caseSensitive ? trigger.pattern : trigger.pattern.toLowerCase();

        switch (trigger.type) {
            case 'exact':
                return msg === pattern;

            case 'contains':
                return msg.includes(pattern);

            case 'regex':
                try {
                    const regex = new RegExp(pattern, trigger.flags || '');
                    return regex.test(message);
                } catch (error) {
                    console.error(`? Invalid regex: ${pattern}`, error);
                    return false;
                }

            default:
                return false;
        }
    }

    listAutomations(): Array<{ id: string; name: string; triggers: string[]; category?: string }> {
        return this.automations.map(a => ({
            id: a.id,
            name: a.metadata.name,
            triggers: a.triggers.map(t => t.pattern),
            category: a.metadata.category,
        }));
    }
}
