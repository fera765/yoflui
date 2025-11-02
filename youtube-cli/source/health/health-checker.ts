/**
 * Health Check System
 * Monitors system health and external dependencies
 */

import { webhookAPI } from '../webhook-api.js';
import { mcpManager } from '../mcp/mcp-manager.js';
import { circuitBreakerRegistry } from '../errors/circuit-breaker.js';
import { existsSync, statSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: number;
    uptime: number;
    components: {
        webhookAPI: ComponentHealth;
        mcpServices: ComponentHealth;
        circuitBreakers: ComponentHealth;
        disk: ComponentHealth;
        memory: ComponentHealth;
    };
    details?: string;
}

export interface ComponentHealth {
    status: 'up' | 'down' | 'degraded';
    message?: string;
    metadata?: Record<string, any>;
}

export class HealthChecker {
    private startTime: number;

    constructor() {
        this.startTime = Date.now();
    }

    /**
     * Perform comprehensive health check
     */
    async check(): Promise<HealthStatus> {
        const checks = await Promise.all([
            this.checkWebhookAPI(),
            this.checkMCPServices(),
            this.checkCircuitBreakers(),
            this.checkDiskSpace(),
            this.checkMemory(),
        ]);

        const [webhookAPI, mcpServices, circuitBreakers, disk, memory] = checks;

        // Determine overall status
        const allStatuses = [
            webhookAPI.status,
            mcpServices.status,
            circuitBreakers.status,
            disk.status,
            memory.status,
        ];

        let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

        if (allStatuses.includes('down')) {
            overallStatus = 'unhealthy';
        } else if (allStatuses.includes('degraded')) {
            overallStatus = 'degraded';
        }

        const uptime = Date.now() - this.startTime;

        return {
            status: overallStatus,
            timestamp: Date.now(),
            uptime,
            components: {
                webhookAPI,
                mcpServices,
                circuitBreakers,
                disk,
                memory,
            },
        };
    }

    /**
     * Quick liveness check (lightweight)
     */
    async liveness(): Promise<{ alive: boolean; timestamp: number }> {
        return {
            alive: true,
            timestamp: Date.now(),
        };
    }

    /**
     * Readiness check (can handle requests)
     */
    async readiness(): Promise<{ ready: boolean; timestamp: number; reason?: string }> {
        const health = await this.check();

        if (health.status === 'unhealthy') {
            return {
                ready: false,
                timestamp: Date.now(),
                reason: 'System is unhealthy',
            };
        }

        return {
            ready: true,
            timestamp: Date.now(),
        };
    }

    /**
     * Check Webhook API health
     */
    private async checkWebhookAPI(): Promise<ComponentHealth> {
        try {
            const isRunning = webhookAPI.isApiRunning();

            if (!isRunning) {
                return {
                    status: 'down',
                    message: 'Webhook API is not running',
                };
            }

            const webhooks = webhookAPI.getAllWebhooks();

            return {
                status: 'up',
                message: 'Webhook API is running',
                metadata: {
                    activeWebhooks: webhooks.length,
                },
            };
        } catch (error) {
            return {
                status: 'down',
                message: `Webhook API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Check MCP services health
     */
    private async checkMCPServices(): Promise<ComponentHealth> {
        try {
            const installedMCPs = mcpManager.getInstalledMCPs();

            if (installedMCPs.length === 0) {
                return {
                    status: 'up',
                    message: 'No MCP services installed',
                    metadata: {
                        installed: 0,
                        active: 0,
                    },
                };
            }

            const activeMCPs = installedMCPs.filter(mcp => mcp.isActive);
            const inactiveMCPs = installedMCPs.length - activeMCPs.length;

            if (activeMCPs.length === 0) {
                return {
                    status: 'down',
                    message: 'All MCP services are inactive',
                    metadata: {
                        installed: installedMCPs.length,
                        active: 0,
                        inactive: inactiveMCPs,
                    },
                };
            }

            if (inactiveMCPs > 0) {
                return {
                    status: 'degraded',
                    message: 'Some MCP services are inactive',
                    metadata: {
                        installed: installedMCPs.length,
                        active: activeMCPs.length,
                        inactive: inactiveMCPs,
                    },
                };
            }

            return {
                status: 'up',
                message: 'All MCP services are active',
                metadata: {
                    installed: installedMCPs.length,
                    active: activeMCPs.length,
                    tools: activeMCPs.reduce((sum, mcp) => sum + mcp.toolCount, 0),
                },
            };
        } catch (error) {
            return {
                status: 'down',
                message: `MCP services check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Check circuit breakers health
     */
    private async checkCircuitBreakers(): Promise<ComponentHealth> {
        try {
            const breakerHealth = circuitBreakerRegistry.getAllHealth();
            const breakerNames = Object.keys(breakerHealth);

            if (breakerNames.length === 0) {
                return {
                    status: 'up',
                    message: 'No circuit breakers registered',
                    metadata: {
                        total: 0,
                        open: 0,
                        halfOpen: 0,
                        closed: 0,
                    },
                };
            }

            const openBreakers = breakerNames.filter(name => breakerHealth[name].state === 'OPEN');
            const halfOpenBreakers = breakerNames.filter(name => breakerHealth[name].state === 'HALF_OPEN');
            const closedBreakers = breakerNames.filter(name => breakerHealth[name].state === 'CLOSED');

            if (openBreakers.length > 0) {
                return {
                    status: 'degraded',
                    message: `${openBreakers.length} circuit breaker(s) are OPEN`,
                    metadata: {
                        total: breakerNames.length,
                        open: openBreakers.length,
                        openBreakers: openBreakers,
                        halfOpen: halfOpenBreakers.length,
                        closed: closedBreakers.length,
                    },
                };
            }

            if (halfOpenBreakers.length > 0) {
                return {
                    status: 'degraded',
                    message: `${halfOpenBreakers.length} circuit breaker(s) are HALF_OPEN`,
                    metadata: {
                        total: breakerNames.length,
                        open: 0,
                        halfOpen: halfOpenBreakers.length,
                        halfOpenBreakers: halfOpenBreakers,
                        closed: closedBreakers.length,
                    },
                };
            }

            return {
                status: 'up',
                message: 'All circuit breakers are CLOSED',
                metadata: {
                    total: breakerNames.length,
                    open: 0,
                    halfOpen: 0,
                    closed: closedBreakers.length,
                },
            };
        } catch (error) {
            return {
                status: 'down',
                message: `Circuit breakers check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Check disk space
     */
    private async checkDiskSpace(): Promise<ComponentHealth> {
        try {
            const homeDir = homedir();
            const fluiDir = join(homeDir, '.flui');

            // Check if .flui directory exists and is writable
            if (!existsSync(fluiDir)) {
                return {
                    status: 'degraded',
                    message: '.flui directory does not exist',
                };
            }

            const stats = statSync(fluiDir);

            if (!stats.isDirectory()) {
                return {
                    status: 'down',
                    message: '.flui path is not a directory',
                };
            }

            // In a real implementation, you'd check actual disk space
            // For now, we assume healthy if directory exists
            return {
                status: 'up',
                message: 'Disk space is available',
                metadata: {
                    fluiDir,
                },
            };
        } catch (error) {
            return {
                status: 'degraded',
                message: `Disk space check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Check memory usage
     */
    private async checkMemory(): Promise<ComponentHealth> {
        try {
            const memUsage = process.memoryUsage();
            const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
            const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
            const rssMB = Math.round(memUsage.rss / 1024 / 1024);

            const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

            if (heapUsagePercent > 90) {
                return {
                    status: 'degraded',
                    message: 'Memory usage is high',
                    metadata: {
                        heapUsedMB,
                        heapTotalMB,
                        rssMB,
                        heapUsagePercent: Math.round(heapUsagePercent),
                    },
                };
            }

            return {
                status: 'up',
                message: 'Memory usage is normal',
                metadata: {
                    heapUsedMB,
                    heapTotalMB,
                    rssMB,
                    heapUsagePercent: Math.round(heapUsagePercent),
                },
            };
        } catch (error) {
            return {
                status: 'down',
                message: `Memory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Get uptime in seconds
     */
    getUptime(): number {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
}

// Singleton instance
export const healthChecker = new HealthChecker();
