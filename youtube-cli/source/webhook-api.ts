import express, { Express, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { Server } from 'http';

interface WebhookConfig {
    automationId: string;
    uniqueId: string;
    apiKey?: string;
    method: 'GET' | 'POST';
    createdAt: number;
    lastTriggered?: number;
}

interface WebhookTriggerData {
    automationId: string;
    uniqueId: string;
    method: string;
    headers: Record<string, any>;
    body?: any;
    query?: any;
    timestamp: number;
}

class WebhookAPI {
    private app: Express;
    private server: Server | null = null;
    private port: number = 8080;
    private webhooks: Map<string, WebhookConfig> = new Map();
    private triggerCallbacks: Map<string, (data: WebhookTriggerData) => void> = new Map();
    private isRunning: boolean = false;

    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // Disable all logs
        this.app.use((req, res, next) => {
            next();
        });
    }

    private setupRoutes() {
        // Health check (silent)
        this.app.get('/health', (req: Request, res: Response) => {
            res.json({ status: 'ok' });
        });

        // Webhook endpoint
        this.app.all('/webhook/:automationId/:uniqueId', (req: Request, res: Response) => {
            const { automationId, uniqueId } = req.params;
            const webhookKey = `${automationId}:${uniqueId}`;
            const webhook = this.webhooks.get(webhookKey);

            if (!webhook) {
                res.status(404).json({ error: 'Webhook not found' });
                return;
            }

            // Verify API key if required
            if (webhook.apiKey) {
                const authHeader = req.headers.authorization;
                const token = authHeader?.replace('Bearer ', '');
                
                if (token !== webhook.apiKey) {
                    res.status(401).json({ error: 'Invalid API key' });
                    return;
                }
            }

            // Verify method
            if (req.method !== webhook.method) {
                res.status(405).json({ error: `Method not allowed. Expected ${webhook.method}` });
                return;
            }

            // Update last triggered
            webhook.lastTriggered = Date.now();

            // Trigger callback
            const callback = this.triggerCallbacks.get(webhookKey);
            if (callback) {
                const triggerData: WebhookTriggerData = {
                    automationId,
                    uniqueId,
                    method: req.method,
                    headers: req.headers,
                    body: req.body,
                    query: req.query,
                    timestamp: Date.now(),
                };

                callback(triggerData);
            }

            res.json({ 
                success: true, 
                message: 'Webhook received',
                timestamp: Date.now()
            });
        });
    }

    /**
     * Start API server
     */
    async start(): Promise<void> {
        if (this.isRunning) return;

        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, () => {
                    this.isRunning = true;
                    resolve();
                });

                this.server.on('error', (err: any) => {
                    if (err.code === 'EADDRINUSE') {
                        // Port already in use, consider it as already running
                        this.isRunning = true;
                        resolve();
                    } else {
                        reject(err);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Stop API server
     */
    async stop(): Promise<void> {
        if (!this.isRunning || !this.server) return;

        return new Promise((resolve) => {
            this.server?.close(() => {
                this.isRunning = false;
                this.server = null;
                resolve();
            });
        });
    }

    /**
     * Check if API is running
     */
    isApiRunning(): boolean {
        return this.isRunning;
    }

    /**
     * Register a webhook
     */
    registerWebhook(
        automationId: string,
        requireAuth: boolean = false,
        method: 'GET' | 'POST' = 'POST'
    ): WebhookConfig {
        // Check if webhook already exists
        const existingKey = Array.from(this.webhooks.keys()).find(key => 
            key.startsWith(`${automationId}:`)
        );

        if (existingKey) {
            return this.webhooks.get(existingKey)!;
        }

        // Generate unique ID and API key
        const uniqueId = randomBytes(8).toString('hex');
        const apiKey = requireAuth ? randomBytes(16).toString('hex') : undefined;
        const webhookKey = `${automationId}:${uniqueId}`;

        const config: WebhookConfig = {
            automationId,
            uniqueId,
            apiKey,
            method,
            createdAt: Date.now(),
        };

        this.webhooks.set(webhookKey, config);

        return config;
    }

    /**
     * Set trigger callback for webhook
     */
    onWebhookTrigger(
        automationId: string,
        uniqueId: string,
        callback: (data: WebhookTriggerData) => void
    ): void {
        const webhookKey = `${automationId}:${uniqueId}`;
        this.triggerCallbacks.set(webhookKey, callback);
    }

    /**
     * Remove trigger callback
     */
    removeWebhookTrigger(automationId: string, uniqueId: string): void {
        const webhookKey = `${automationId}:${uniqueId}`;
        this.triggerCallbacks.delete(webhookKey);
    }

    /**
     * Get webhook URL
     */
    getWebhookUrl(automationId: string, uniqueId: string): string {
        return `http://127.0.0.1:${this.port}/webhook/${automationId}/${uniqueId}`;
    }

    /**
     * Get all webhooks
     */
    getAllWebhooks(): WebhookConfig[] {
        return Array.from(this.webhooks.values());
    }

    /**
     * Clear all webhooks (on API restart)
     */
    clearWebhooks(): void {
        this.webhooks.clear();
        this.triggerCallbacks.clear();
    }
}

// Singleton instance
export const webhookAPI = new WebhookAPI();

// Export types
export type { WebhookConfig, WebhookTriggerData };
