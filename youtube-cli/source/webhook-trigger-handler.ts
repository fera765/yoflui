import { webhookAPI, type WebhookConfig, type WebhookTriggerData } from './webhook-api.js';
import type { Automation } from './automation/types.js';

interface WebhookAutomation extends Automation {
    webhookConfig?: {
        enabled: boolean;
        requireAuth?: boolean;
        method?: 'GET' | 'POST';
        expectedPayload?: Record<string, any>;
    };
}

export class WebhookTriggerHandler {
    private activeWebhooks: Map<string, {
        config: WebhookConfig;
        automation: WebhookAutomation;
        onTrigger: (data: WebhookTriggerData) => void;
    }> = new Map();

    /**
     * Setup webhook for automation
     */
    async setupWebhook(
        automation: WebhookAutomation,
        onTrigger: (data: WebhookTriggerData) => void
    ): Promise<{
        url: string;
        method: string;
        apiKey?: string;
        message: string;
    }> {
        if (!automation.webhookConfig?.enabled) {
            throw new Error('Webhook not enabled for this automation');
        }

        // Register webhook
        const config = webhookAPI.registerWebhook(
            automation.id,
            automation.webhookConfig.requireAuth || false,
            automation.webhookConfig.method || 'POST'
        );

        // Setup trigger callback
        webhookAPI.onWebhookTrigger(automation.id, config.uniqueId, onTrigger);

        // Store active webhook
        this.activeWebhooks.set(automation.id, {
            config,
            automation,
            onTrigger,
        });

        const url = webhookAPI.getWebhookUrl(automation.id, config.uniqueId);

        let message = `?? **Webhook Created Successfully**\n\n`;
        message += `**URL:** ${url}\n`;
        message += `**Method:** ${config.method}\n`;
        
        if (config.apiKey) {
            message += `**Authorization:** Bearer ${config.apiKey}\n`;
        } else {
            message += `**Authorization:** Not required\n`;
        }

        if (automation.webhookConfig.expectedPayload) {
            message += `\n**Expected Payload:**\n\`\`\`json\n${JSON.stringify(automation.webhookConfig.expectedPayload, null, 2)}\n\`\`\`\n`;
        }

        message += `\n**Example cURL:**\n\`\`\`bash\n`;
        message += `curl -X ${config.method} ${url}`;
        
        if (config.apiKey) {
            message += ` \\\n  -H "Authorization: Bearer ${config.apiKey}"`;
        }
        
        if (config.method === 'POST' && automation.webhookConfig.expectedPayload) {
            message += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(automation.webhookConfig.expectedPayload)}'`;
        }
        
        message += `\n\`\`\`\n`;
        message += `\n?? The webhook is now active and waiting for triggers. You can continue chatting normally.`;

        return {
            url,
            method: config.method,
            apiKey: config.apiKey,
            message,
        };
    }

    /**
     * Get active webhook for automation
     */
    getActiveWebhook(automationId: string): WebhookConfig | null {
        const active = this.activeWebhooks.get(automationId);
        return active ? active.config : null;
    }

    /**
     * Remove webhook
     */
    removeWebhook(automationId: string): void {
        const active = this.activeWebhooks.get(automationId);
        if (active) {
            webhookAPI.removeWebhookTrigger(automationId, active.config.uniqueId);
            this.activeWebhooks.delete(automationId);
        }
    }

    /**
     * Check if automation has webhook config
     */
    hasWebhookConfig(automation: Automation): boolean {
        return (automation as WebhookAutomation).webhookConfig?.enabled === true;
    }

    /**
     * Parse webhook data into variables
     */
    parseWebhookData(data: WebhookTriggerData, automation: WebhookAutomation): Record<string, any> {
        const variables: Record<string, any> = {};

        // Extract data from webhook
        const payload = data.method === 'POST' ? data.body : data.query;

        if (payload) {
            for (const [key, value] of Object.entries(payload)) {
                if (automation.variables[key]) {
                    variables[key] = value;
                }
            }
        }

        return variables;
    }
}

export const webhookTriggerHandler = new WebhookTriggerHandler();
