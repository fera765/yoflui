/**
 * Fallback Chain Manager
 * Provides graceful degradation by trying multiple strategies
 */

import { errorLogger } from './error-types.js';

// ============================================================================
// FALLBACK STRATEGY
// ============================================================================

export interface FallbackStrategy<T> {
    /** Name of this strategy for logging */
    name: string;
    
    /** Function that executes this strategy */
    execute: () => Promise<T>;
    
    /** Optional: Check if this strategy should be attempted */
    shouldAttempt?: () => boolean;
}

// ============================================================================
// FALLBACK CHAIN
// ============================================================================

export class FallbackChain<T> {
    private strategies: FallbackStrategy<T>[];
    private executionId?: string;

    constructor(strategies: FallbackStrategy<T>[], executionId?: string) {
        if (strategies.length === 0) {
            throw new Error('FallbackChain requires at least one strategy');
        }
        this.strategies = strategies;
        this.executionId = executionId;
    }

    /**
     * Execute strategies in order until one succeeds
     */
    async execute(): Promise<T> {
        const errors: Array<{ strategy: string; error: Error }> = [];

        for (const [index, strategy] of this.strategies.entries()) {
            // Check if strategy should be attempted
            if (strategy.shouldAttempt && !strategy.shouldAttempt()) {
                console.log(`[FALLBACK] Skipping strategy "${strategy.name}" (shouldAttempt returned false)`);
                continue;
            }

            try {
                console.log(`[FALLBACK] Attempting strategy ${index + 1}/${this.strategies.length}: "${strategy.name}"`);
                
                const result = await strategy.execute();
                
                // Log success
                if (index > 0) {
                    console.log(`[FALLBACK SUCCESS] Strategy "${strategy.name}" succeeded after ${index} failures`);
                }
                
                return result;
            } catch (error) {
                const err = error as Error;
                errors.push({ strategy: strategy.name, error: err });
                
                // Log failure
                console.error(`[FALLBACK FAILED] Strategy "${strategy.name}" failed:`, err.message);
                
                if (this.executionId) {
                    errorLogger.log(err, this.executionId);
                }
                
                // Continue to next strategy
            }
        }

        // All strategies failed
        const combinedError = new Error(
            `All ${this.strategies.length} fallback strategies failed:\n` +
            errors.map(e => `- ${e.strategy}: ${e.error.message}`).join('\n')
        );

        if (this.executionId) {
            errorLogger.log(combinedError, this.executionId);
        }

        throw combinedError;
    }
}

// ============================================================================
// BUILDER PATTERN FOR FALLBACK CHAINS
// ============================================================================

export class FallbackChainBuilder<T> {
    private strategies: FallbackStrategy<T>[] = [];
    private executionId?: string;

    /**
     * Add a primary strategy
     */
    primary(name: string, execute: () => Promise<T>, shouldAttempt?: () => boolean): this {
        this.strategies.push({ name, execute, shouldAttempt });
        return this;
    }

    /**
     * Add a fallback strategy
     */
    fallback(name: string, execute: () => Promise<T>, shouldAttempt?: () => boolean): this {
        this.strategies.push({ name, execute, shouldAttempt });
        return this;
    }

    /**
     * Add final fallback (always succeeds with default value)
     */
    orDefault(defaultValue: T): this {
        this.strategies.push({
            name: 'default',
            execute: async () => defaultValue,
        });
        return this;
    }

    /**
     * Set execution ID for logging
     */
    withExecutionId(id: string): this {
        this.executionId = id;
        return this;
    }

    /**
     * Build and execute the fallback chain
     */
    async execute(): Promise<T> {
        const chain = new FallbackChain(this.strategies, this.executionId);
        return chain.execute();
    }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
const result = await new FallbackChainBuilder<string>()
    .primary('MCP mcpollinations', async () => {
        return await mcpManager.callMCPTool('mcpollinations', 'generate_image', args);
    })
    .fallback('Direct LLM call', async () => {
        return await openai.chat.completions.create({...});
    })
    .fallback('Cached response', async () => {
        return cache.get(cacheKey);
    }, () => cache.has(cacheKey))
    .orDefault('Operation failed. Please try again later.')
    .withExecutionId(executionId)
    .execute();
*/
