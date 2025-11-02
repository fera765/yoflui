import express, { Express, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { Server } from 'http';
import { logger, LogLevel } from './utils/logger.js';

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
    private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();

    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware() {
        // Payload size limits
        this.app.use(express.json({ limit: '1mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));
        
        // Header size validation
        this.app.use((req, res, next) => {
            const headerSize = JSON.stringify(req.headers).length;
            if (headerSize > 8192) {  // 8KB limit
                logger.warn('WebhookAPI', 'Request headers too large', { headerSize });
                res.status(431).json({ error: 'Request headers too large' });
                return;
            }
            next();
        });
        
        // Rate limiting middleware
        this.app.use((req, res, next) => {
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            const rateLimit = this.checkRateLimit(ip);
            
            if (!rateLimit.allowed) {
                logger.warn('WebhookAPI', 'Rate limit exceeded', { ip, limit: rateLimit.limit });
                res.status(429).json({
                    error: 'Too many requests',
                    retryAfter: Math.ceil(rateLimit.retryAfter / 1000),
                });
                return;
            }
            
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
                logger.warn('WebhookAPI', 'Webhook not found', { automationId, uniqueId });
                res.status(404).json({ error: 'Webhook not found' });
                return;
            }

            // Verify API key if required
            if (webhook.apiKey) {
                const authHeader = req.headers.authorization;
                const token = authHeader?.replace('Bearer ', '');
                
                if (token !== webhook.apiKey) {
                    logger.warn('WebhookAPI', 'Invalid API key', { automationId });
                    res.status(401).json({ error: 'Invalid API key' });
                    return;
                }
            }

            // Verify method
            if (req.method !== webhook.method) {
                logger.warn('WebhookAPI', 'Method not allowed', {
                    automationId,
                    expected: webhook.method,
                    received: req.method,
                });
                res.status(405).json({ error: `Method not allowed. Expected ${webhook.method}` });
                return;
            }
            
            // Validate payload size (additional check beyond middleware)
            const payloadSize = JSON.stringify(req.body || {}).length;
            if (payloadSize > 1048576) {  // 1MB
                logger.warn('WebhookAPI', 'Payload too large', { automationId, payloadSize });
                res.status(413).json({ error: 'Payload too large' });
                return;
            }

            // Update last triggered
            webhook.lastTriggered = Date.now();
            
            logger.info('WebhookAPI', 'Webhook triggered', {
                automationId,
                method: req.method,
                payloadSize,
            });

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

    /**
     * Rate limiting check (100 requests per minute per IP)
     */
    private checkRateLimit(ip: string): {
        allowed: boolean;
        limit: number;
        retryAfter: number;
    } {
        const limit = 100;  // requests per window
        const windowMs = 60000;  // 1 minute
        const now = Date.now();

        let rateLimitData = this.rateLimitMap.get(ip);

        if (!rateLimitData || now > rateLimitData.resetTime) {
            // New window
            rateLimitData = {
                count: 1,
                resetTime: now + windowMs,
            };
            this.rateLimitMap.set(ip, rateLimitData);
            return { allowed: true, limit, retryAfter: 0 };
        }

        if (rateLimitData.count >= limit) {
            // Exceeded limit
            return {
                allowed: false,
                limit,
                retryAfter: rateLimitData.resetTime - now,
            };
        }

        // Increment count
        rateLimitData.count++;
        return { allowed: true, limit, retryAfter: 0 };
    }

    /**
     * Clean up old rate limit entries (called periodically)
     */
    private cleanupRateLimits(): void {
        const now = Date.now();
        for (const [ip, data] of this.rateLimitMap.entries()) {
            if (now > data.resetTime) {
                this.rateLimitMap.delete(ip);
            }
        }
    }
}

// Singleton instance
export const webhookAPI = new WebhookAPI();

// Export types
export type { WebhookConfig, WebhookTriggerData };
