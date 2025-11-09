/**
 * Execution Context Manager
 * Prevents duplicate messages and tracks execution state
 */

import { randomBytes } from 'crypto';

export class ExecutionContext {
    private executionId: string;
    private messageIds: Set<string> = new Set();
    private startTime: number;
    private metadata: Record<string, any>;

    constructor(
        public readonly automationId: string,
        metadata: Record<string, any> = {}
    ) {
        this.executionId = `${automationId}-${Date.now()}-${randomBytes(4).toString('hex')}`;
        this.startTime = Date.now();
        this.metadata = metadata;
    }

    /**
     * Check if a message should be emitted (deduplication)
     */
    shouldEmitMessage(messageKey: string): boolean {
        const normalizedKey = messageKey.toLowerCase().trim();
        
        if (this.messageIds.has(normalizedKey)) {
            return false; // Already emitted
        }
        
        this.messageIds.add(normalizedKey);
        return true;
    }

    /**
     * Get unique execution ID
     */
    getExecutionId(): string {
        return this.executionId;
    }

    /**
     * Get execution duration in milliseconds
     */
    getDuration(): number {
        return Date.now() - this.startTime;
    }

    /**
     * Get metadata
     */
    getMetadata(): Record<string, any> {
        return { ...this.metadata };
    }

    /**
     * Set metadata
     */
    setMetadata(key: string, value: any): void {
        this.metadata[key] = value;
    }

    /**
     * Clear message history (use with caution)
     */
    clearMessages(): void {
        this.messageIds.clear();
    }

    /**
     * Get execution summary
     */
    getSummary(): {
        executionId: string;
        automationId: string;
        duration: number;
        messagesEmitted: number;
        metadata: Record<string, any>;
    } {
        return {
            executionId: this.executionId,
            automationId: this.automationId,
            duration: this.getDuration(),
            messagesEmitted: this.messageIds.size,
            metadata: this.metadata,
        };
    }
}
