/**
 * Retry Manager with Exponential Backoff and Jitter
 * Provides intelligent retry logic for transient failures
 */

import { classifyError, errorLogger } from './error-types.js';

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

export interface RetryOptions {
    /** Maximum number of retry attempts (default: 3) */
    maxAttempts: number;
    
    /** Base delay in milliseconds before first retry (default: 1000ms) */
    baseDelayMs: number;
    
    /** Maximum delay between retries (default: 30000ms / 30s) */
    maxDelayMs: number;
    
    /** Jitter percentage to add randomness (default: 0.25 = ?25%) */
    jitterPercent: number;
    
    /** Error codes/messages that are retryable (default: network/timeout errors) */
    retryableErrors: string[];
    
    /** Callback on each retry attempt */
    onRetry?: (attempt: number, error: Error, delayMs: number) => void;
    
    /** Execution ID for logging */
    executionId?: string;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    jitterPercent: 0.25,
    retryableErrors: [
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ECONNRESET',
        'EPIPE',
        '429',  // Too Many Requests
        '503',  // Service Unavailable
        '504',  // Gateway Timeout
        'timeout',
        'network',
        'socket hang up',
    ],
};

// ============================================================================
// RETRY WITH EXPONENTIAL BACKOFF
// ============================================================================

export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    const opts: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: Error;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            // Execute operation
            const result = await operation();
            
            // Log success if this was a retry
            if (attempt > 1 && opts.executionId) {
                console.log(`[RETRY SUCCESS] ${operationName} succeeded on attempt ${attempt}`);
            }
            
            return result;
        } catch (error) {
            lastError = error as Error;
            
            // Classify error
            const classification = classifyError(error);
            
            // Log error
            if (classification.shouldLog && opts.executionId) {
                errorLogger.log(error, opts.executionId);
            }
            
            // Check if error is retryable
            const isRetryable = classification.isRetryable || opts.retryableErrors.some(pattern =>
                lastError.message.includes(pattern) || lastError.name.includes(pattern)
            );
            
            // Don't retry if not retryable or max attempts reached
            if (!isRetryable) {
                console.error(`[RETRY ABORT] ${operationName}: Non-retryable error`, classification.category);
                throw lastError;
            }
            
            if (attempt === opts.maxAttempts) {
                console.error(`[RETRY EXHAUSTED] ${operationName}: Max attempts (${opts.maxAttempts}) reached`);
                throw lastError;
            }
            
            // Calculate delay with exponential backoff and jitter
            const exponentialDelay = Math.min(
                opts.baseDelayMs * Math.pow(2, attempt - 1),
                opts.maxDelayMs
            );
            const jitter = exponentialDelay * opts.jitterPercent * (Math.random() * 2 - 1);
            const delay = Math.round(exponentialDelay + jitter);
            
            console.log(`[RETRY] ${operationName}: Attempt ${attempt}/${opts.maxAttempts} failed (${classification.category}). Retrying in ${delay}ms...`);
            
            // Call retry callback if provided
            opts.onRetry?.(attempt, lastError, delay);
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
}

// ============================================================================
// RETRY DECORATOR FOR FUNCTIONS
// ============================================================================

export function Retryable(options: Partial<RetryOptions> = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            return retryWithBackoff(
                () => originalMethod.apply(this, args),
                `${target.constructor.name}.${propertyKey}`,
                options
            );
        };

        return descriptor;
    };
}

// ============================================================================
// TIMEOUT WRAPPER
// ============================================================================

export interface TimeoutOptions {
    timeoutMs: number;
    operationName: string;
    executionId?: string;
}

export function withTimeout<T>(
    promise: Promise<T>,
    options: TimeoutOptions
): Promise<T> {
    const { timeoutMs, operationName, executionId } = options;
    
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => {
            const timer = setTimeout(() => {
                const error = new Error(`Timeout: ${operationName} exceeded ${timeoutMs}ms`);
                if (executionId) {
                    errorLogger.log(error, executionId);
                }
                reject(error);
            }, timeoutMs);
            
            // Prevent timer leak
            promise.finally(() => clearTimeout(timer));
        })
    ]);
}

// ============================================================================
// RETRY + TIMEOUT COMBINED
// ============================================================================

export async function executeWithResiliency<T>(
    operation: () => Promise<T>,
    options: {
        operationName: string;
        timeoutMs?: number;
        retryOptions?: Partial<RetryOptions>;
        executionId?: string;
    }
): Promise<T> {
    const { operationName, timeoutMs, retryOptions, executionId } = options;

    const resilientOperation = async () => {
        if (timeoutMs) {
            return withTimeout(operation(), { timeoutMs, operationName, executionId });
        }
        return operation();
    };

    return retryWithBackoff(
        resilientOperation,
        operationName,
        { ...retryOptions, executionId }
    );
}
