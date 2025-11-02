/**
 * Comprehensive Error Handling Framework for Flui System
 * Implements custom error hierarchy, retry logic, circuit breaker, and fallback chains
 */

// ============================================================================
// CUSTOM ERROR CLASS HIERARCHY
// ============================================================================

export abstract class FluiError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly isRetryable: boolean = false,
        public readonly context?: Record<string, any>
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            isRetryable: this.isRetryable,
            context: this.context,
        };
    }
}

// Network & External Service Errors
export class NetworkError extends FluiError {
    constructor(message: string, context?: Record<string, any>) {
        super(message, 'NETWORK_ERROR', true, context);
    }
}

export class TimeoutError extends FluiError {
    constructor(operation: string, timeoutMs: number, context?: Record<string, any>) {
        super(`Operation "${operation}" timed out after ${timeoutMs}ms`, 'TIMEOUT_ERROR', true, context);
    }
}

export class RateLimitError extends FluiError {
    constructor(service: string, retryAfter?: number, context?: Record<string, any>) {
        super(
            `Rate limit exceeded for ${service}${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
            'RATE_LIMIT_ERROR',
            true,
            { ...context, retryAfter }
        );
    }
}

// Validation Errors (NOT retryable)
export class ValidationError extends FluiError {
    constructor(message: string, public readonly field?: string, context?: Record<string, any>) {
        super(message, 'VALIDATION_ERROR', false, { ...context, field });
    }
}

export class PayloadTooLargeError extends FluiError {
    constructor(size: number, maxSize: number, context?: Record<string, any>) {
        super(
            `Payload size ${size} bytes exceeds maximum ${maxSize} bytes`,
            'PAYLOAD_TOO_LARGE',
            false,
            { ...context, size, maxSize }
        );
    }
}

// Tool Execution Errors
export class ToolExecutionError extends FluiError {
    constructor(
        public readonly toolName: string,
        message: string,
        isRetryable: boolean = false,
        context?: Record<string, any>
    ) {
        super(message, 'TOOL_EXECUTION_ERROR', isRetryable, { ...context, toolName });
    }
}

// MCP Errors
export class MCPError extends FluiError {
    constructor(
        public readonly mcpPackage: string,
        message: string,
        isRetryable: boolean = true,
        context?: Record<string, any>
    ) {
        super(message, 'MCP_ERROR', isRetryable, { ...context, mcpPackage });
    }
}

export class MCPNotFoundError extends FluiError {
    constructor(public readonly mcpPackage: string, context?: Record<string, any>) {
        super(`MCP package "${mcpPackage}" not found or not active`, 'MCP_NOT_FOUND', false, { ...context, mcpPackage });
    }
}

// Webhook Errors
export class WebhookError extends FluiError {
    constructor(message: string, isRetryable: boolean = false, context?: Record<string, any>) {
        super(message, 'WEBHOOK_ERROR', isRetryable, context);
    }
}

export class WebhookNotFoundError extends FluiError {
    constructor(automationId: string, uniqueId: string, context?: Record<string, any>) {
        super(
            `Webhook not found: ${automationId}/${uniqueId}`,
            'WEBHOOK_NOT_FOUND',
            false,
            { ...context, automationId, uniqueId }
        );
    }
}

export class WebhookAuthError extends FluiError {
    constructor(message: string = 'Invalid or missing authentication token', context?: Record<string, any>) {
        super(message, 'WEBHOOK_AUTH_ERROR', false, context);
    }
}

// Automation Errors
export class AutomationError extends FluiError {
    constructor(
        public readonly automationId: string,
        message: string,
        isRetryable: boolean = false,
        context?: Record<string, any>
    ) {
        super(message, 'AUTOMATION_ERROR', isRetryable, { ...context, automationId });
    }
}

export class AutomationNotFoundError extends FluiError {
    constructor(automationId: string, context?: Record<string, any>) {
        super(`Automation not found: ${automationId}`, 'AUTOMATION_NOT_FOUND', false, { ...context, automationId });
    }
}

// Circuit Breaker Errors
export class CircuitBreakerOpenError extends FluiError {
    constructor(service: string, context?: Record<string, any>) {
        super(
            `Circuit breaker OPEN for service "${service}". Service temporarily unavailable.`,
            'CIRCUIT_BREAKER_OPEN',
            false,
            { ...context, service }
        );
    }
}

// Configuration Errors
export class ConfigurationError extends FluiError {
    constructor(message: string, context?: Record<string, any>) {
        super(message, 'CONFIGURATION_ERROR', false, context);
    }
}

// ============================================================================
// ERROR CLASSIFICATION UTILITY
// ============================================================================

export function classifyError(error: unknown): { category: string; isRetryable: boolean; shouldLog: boolean } {
    if (error instanceof FluiError) {
        return {
            category: error.code,
            isRetryable: error.isRetryable,
            shouldLog: true,
        };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Classify standard errors
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
        return { category: 'NETWORK_ERROR', isRetryable: true, shouldLog: true };
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
        return { category: 'TIMEOUT_ERROR', isRetryable: true, shouldLog: true };
    }

    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        return { category: 'RATE_LIMIT_ERROR', isRetryable: true, shouldLog: true };
    }

    if (errorMessage.includes('431') || errorMessage.includes('too large')) {
        return { category: 'PAYLOAD_TOO_LARGE', isRetryable: false, shouldLog: true };
    }

    if (errorMessage.includes('401') || errorMessage.includes('403')) {
        return { category: 'AUTH_ERROR', isRetryable: false, shouldLog: true };
    }

    // Unknown error - don't retry by default
    return { category: 'UNKNOWN_ERROR', isRetryable: false, shouldLog: true };
}

// ============================================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================================

export function getUserFriendlyErrorMessage(error: unknown): string {
    if (error instanceof TimeoutError) {
        return `?? Operation timed out. The service might be slow or unavailable. Please try again.`;
    }

    if (error instanceof RateLimitError) {
        return `? Too many requests. Please wait a moment before trying again.`;
    }

    if (error instanceof ValidationError) {
        return `? Invalid input: ${error.message}`;
    }

    if (error instanceof MCPNotFoundError) {
        return `? External service not available: ${error.mcpPackage}. Please check your MCP configuration.`;
    }

    if (error instanceof WebhookAuthError) {
        return `?? Authentication failed. Please check your webhook API key.`;
    }

    if (error instanceof CircuitBreakerOpenError) {
        return `?? Service temporarily unavailable due to repeated failures. Please try again in a few minutes.`;
    }

    if (error instanceof PayloadTooLargeError) {
        return `?? Request too large. Please reduce the data size and try again.`;
    }

    if (error instanceof NetworkError) {
        return `?? Network error. Please check your internet connection and try again.`;
    }

    // Generic fallback
    const message = error instanceof Error ? error.message : String(error);
    return `? An error occurred: ${message}`;
}

// ============================================================================
// ERROR LOGGING UTILITY
// ============================================================================

export interface ErrorLogEntry {
    timestamp: number;
    errorType: string;
    message: string;
    stack?: string;
    context?: Record<string, any>;
    executionId?: string;
}

export class ErrorLogger {
    private logs: ErrorLogEntry[] = [];
    private readonly maxLogs: number = 1000;

    log(error: unknown, executionId?: string): void {
        const entry: ErrorLogEntry = {
            timestamp: Date.now(),
            errorType: error instanceof Error ? error.constructor.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            context: error instanceof FluiError ? error.context : undefined,
            executionId,
        };

        this.logs.push(entry);

        // Trim old logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Log to console with formatting
        console.error(`[ERROR ${entry.errorType}]`, entry.message, entry.context || '');
    }

    getRecentErrors(count: number = 10): ErrorLogEntry[] {
        return this.logs.slice(-count);
    }

    getErrorsForExecution(executionId: string): ErrorLogEntry[] {
        return this.logs.filter(log => log.executionId === executionId);
    }

    clearLogs(): void {
        this.logs = [];
    }
}

// Singleton instance
export const errorLogger = new ErrorLogger();
