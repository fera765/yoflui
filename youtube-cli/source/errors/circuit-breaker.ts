/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by failing fast when service is degraded
 */

import { CircuitBreakerOpenError } from './error-types.js';

// ============================================================================
// CIRCUIT BREAKER STATES
// ============================================================================

export enum CircuitState {
    /** Normal operation - requests pass through */
    CLOSED = 'CLOSED',
    
    /** Service failing - reject requests immediately */
    OPEN = 'OPEN',
    
    /** Testing if service recovered - allow limited requests */
    HALF_OPEN = 'HALF_OPEN',
}

// ============================================================================
// CIRCUIT BREAKER CONFIGURATION
// ============================================================================

export interface CircuitBreakerOptions {
    /** Number of failures before opening circuit (default: 5) */
    failureThreshold: number;
    
    /** Time to wait before trying again (ms) (default: 60000 / 1min) */
    resetTimeoutMs: number;
    
    /** Successful calls needed in HALF_OPEN to close circuit (default: 2) */
    successThreshold: number;
    
    /** Service name for logging */
    serviceName: string;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
    failureThreshold: 5,
    resetTimeoutMs: 60000,
    successThreshold: 2,
    serviceName: 'unknown',
};

// ============================================================================
// CIRCUIT BREAKER CLASS
// ============================================================================

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private successCount: number = 0;
    private lastFailureTime: number = 0;
    private lastStateChange: number = Date.now();
    private options: CircuitBreakerOptions;

    constructor(options: Partial<CircuitBreakerOptions> = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Execute operation through circuit breaker
     */
    async execute<T>(operation: () => Promise<T>): Promise<T> {
        // Check current state
        this.checkStateTransition();

        // If circuit is OPEN, fail immediately
        if (this.state === CircuitState.OPEN) {
            throw new CircuitBreakerOpenError(this.options.serviceName, {
                failureCount: this.failureCount,
                lastFailureTime: this.lastFailureTime,
                resetIn: this.getRemainingResetTime(),
            });
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    /**
     * Check if enough time has passed to transition from OPEN to HALF_OPEN
     */
    private checkStateTransition(): void {
        if (this.state === CircuitState.OPEN) {
            const timeSinceLastFailure = Date.now() - this.lastFailureTime;
            
            if (timeSinceLastFailure >= this.options.resetTimeoutMs) {
                this.transitionTo(CircuitState.HALF_OPEN);
                this.successCount = 0;
            }
        }
    }

    /**
     * Handle successful operation
     */
    private onSuccess(): void {
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            
            if (this.successCount >= this.options.successThreshold) {
                this.transitionTo(CircuitState.CLOSED);
                this.failureCount = 0;
            }
        } else if (this.state === CircuitState.CLOSED) {
            // Reset failure count on success
            this.failureCount = 0;
        }
    }

    /**
     * Handle failed operation
     */
    private onFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.state === CircuitState.HALF_OPEN) {
            // Failed during test - reopen circuit
            this.transitionTo(CircuitState.OPEN);
        } else if (this.state === CircuitState.CLOSED) {
            // Check if threshold reached
            if (this.failureCount >= this.options.failureThreshold) {
                this.transitionTo(CircuitState.OPEN);
            }
        }
    }

    /**
     * Transition to new state
     */
    private transitionTo(newState: CircuitState): void {
        const oldState = this.state;
        this.state = newState;
        this.lastStateChange = Date.now();

        console.log(`[CIRCUIT BREAKER] ${this.options.serviceName}: ${oldState} ? ${newState}`, {
            failureCount: this.failureCount,
            successCount: this.successCount,
        });
    }

    /**
     * Get current state
     */
    getState(): CircuitState {
        return this.state;
    }

    /**
     * Get health status
     */
    getHealth(): {
        state: CircuitState;
        failureCount: number;
        successCount: number;
        lastFailureTime: number;
        lastStateChange: number;
        isHealthy: boolean;
    } {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime,
            lastStateChange: this.lastStateChange,
            isHealthy: this.state === CircuitState.CLOSED,
        };
    }

    /**
     * Get remaining time until circuit can transition to HALF_OPEN
     */
    private getRemainingResetTime(): number {
        if (this.state !== CircuitState.OPEN) return 0;
        const elapsed = Date.now() - this.lastFailureTime;
        return Math.max(0, this.options.resetTimeoutMs - elapsed);
    }

    /**
     * Manually reset circuit breaker (use with caution)
     */
    reset(): void {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        console.log(`[CIRCUIT BREAKER] ${this.options.serviceName}: Manually reset to CLOSED`);
    }
}

// ============================================================================
// CIRCUIT BREAKER REGISTRY
// ============================================================================

class CircuitBreakerRegistry {
    private breakers: Map<string, CircuitBreaker> = new Map();

    getOrCreate(serviceName: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
        let breaker = this.breakers.get(serviceName);
        
        if (!breaker) {
            breaker = new CircuitBreaker({ ...options, serviceName });
            this.breakers.set(serviceName, breaker);
        }
        
        return breaker;
    }

    get(serviceName: string): CircuitBreaker | null {
        return this.breakers.get(serviceName) || null;
    }

    getAllHealth(): Record<string, ReturnType<CircuitBreaker['getHealth']>> {
        const health: Record<string, any> = {};
        
        for (const [name, breaker] of this.breakers) {
            health[name] = breaker.getHealth();
        }
        
        return health;
    }

    resetAll(): void {
        for (const breaker of this.breakers.values()) {
            breaker.reset();
        }
    }
}

// Singleton instance
export const circuitBreakerRegistry = new CircuitBreakerRegistry();
