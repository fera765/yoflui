import { webhookAPI, type WebhookConfig, type WebhookTriggerData } from './webhook-api.js';
import type { Automation } from './automation/types.js';
import { webhookValidator } from './validation/webhook-validator.js';
import { logger } from './utils/logger.js';

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

        let message = `🔔 **Webhook Created Successfully**\n\n`;
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
        message += `\n✅ The webhook is now active and waiting for triggers. You can continue chatting normally.`;

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
     * Parse webhook data into variables with validation
     */
    parseWebhookData(data: WebhookTriggerData, automation: WebhookAutomation): Record<string, any> {
        const variables: Record<string, any> = {};

        // Extract data from webhook
        const payload = data.method === 'POST' ? data.body : data.query;

        if (!payload) {
            logger.warn('WebhookTriggerHandler', 'Empty webhook payload', {
                automationId: automation.id,
            });
            return variables;
        }

        // Validate payload if expectedPayload is defined
        if (automation.webhookConfig?.expectedPayload) {
            const validation = webhookValidator.validatePayload(
                payload,
                automation.webhookConfig.expectedPayload
            );

            if (!validation.valid) {
                logger.error('WebhookTriggerHandler', 'Webhook payload validation failed', {
                    automationId: automation.id,
                    errors: validation.errors,
                });
                throw new Error(
                    `Webhook payload validation failed: ${validation.errors?.join(', ')}`
                );
            }

            logger.info('WebhookTriggerHandler', 'Webhook payload validated successfully', {
                automationId: automation.id,
            });

            // Use sanitized data
            const sanitizedPayload = validation.sanitizedData || payload;
            
            for (const [key, value] of Object.entries(sanitizedPayload)) {
                if (automation.variables[key]) {
                    variables[key] = value;
                }
            }
        } else {
            // No validation schema, sanitize and use as-is
            const sanitized = webhookValidator.sanitizePayload(payload);
            
            for (const [key, value] of Object.entries(sanitized)) {
                if (automation.variables[key]) {
                    variables[key] = value;
                }
            }
        }

        return variables;
    }
}

export const webhookTriggerHandler = new WebhookTriggerHandler();
