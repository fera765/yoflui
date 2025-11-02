/**
 * Structured Logger with Log Levels
 * Separates user-facing messages from debug logs
 */

export enum LogLevel {
    DEBUG = 0,    // Detailed internal state, tool arguments
    INFO = 1,     // Major milestones, step completions
    WARN = 2,     // Recoverable errors, retries
    ERROR = 3,    // Fatal failures
}

export interface LogEntry {
    timestamp: number;
    level: LogLevel;
    executionId?: string;
    component: string;
    message: string;
    metadata?: Record<string, any>;
}

export interface LoggerConfig {
    minLevel: LogLevel;
    userMode: boolean;  // If true, only show INFO and above
    maxLogs: number;
}

export class Logger {
    private logs: LogEntry[] = [];
    private config: LoggerConfig;
    private callbacks: Array<(entry: LogEntry) => void> = [];

    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = {
            minLevel: LogLevel.INFO,
            userMode: true,
            maxLogs: 1000,
            ...config,
        };
    }

    /**
     * Set log level
     */
    setLogLevel(level: LogLevel): void {
        this.config.minLevel = level;
    }

    /**
     * Set user mode (hides debug logs)
     */
    setUserMode(enabled: boolean): void {
        this.config.userMode = enabled;
        this.config.minLevel = enabled ? LogLevel.INFO : LogLevel.DEBUG;
    }

    /**
     * Register callback for log events
     */
    onLog(callback: (entry: LogEntry) => void): void {
        this.callbacks.push(callback);
    }

    /**
     * Log a message
     */
    log(
        level: LogLevel,
        component: string,
        message: string,
        metadata?: Record<string, any>,
        executionId?: string
    ): void {
        // Filter by level
        if (level < this.config.minLevel) {
            return;
        }

        const entry: LogEntry = {
            timestamp: Date.now(),
            level,
            executionId,
            component,
            message,
            metadata,
        };

        // Store log
        this.logs.push(entry);

        // Trim old logs
        if (this.logs.length > this.config.maxLogs) {
            this.logs = this.logs.slice(-this.config.maxLogs);
        }

        // Emit to callbacks
        for (const callback of this.callbacks) {
            try {
                callback(entry);
            } catch (error) {
                console.error('[LOGGER] Callback error:', error);
            }
        }

        // Console output with formatting
        this.emitToConsole(entry);
    }

    /**
     * Convenience methods
     */
    debug(component: string, message: string, metadata?: Record<string, any>, executionId?: string): void {
        this.log(LogLevel.DEBUG, component, message, metadata, executionId);
    }

    info(component: string, message: string, metadata?: Record<string, any>, executionId?: string): void {
        this.log(LogLevel.INFO, component, message, metadata, executionId);
    }

    warn(component: string, message: string, metadata?: Record<string, any>, executionId?: string): void {
        this.log(LogLevel.WARN, component, message, metadata, executionId);
    }

    error(component: string, message: string, metadata?: Record<string, any>, executionId?: string): void {
        this.log(LogLevel.ERROR, component, message, metadata, executionId);
    }

    /**
     * Get logs for specific execution
     */
    getLogsForExecution(executionId: string): LogEntry[] {
        return this.logs.filter(log => log.executionId === executionId);
    }

    /**
     * Get recent logs
     */
    getRecentLogs(count: number = 50): LogEntry[] {
        return this.logs.slice(-count);
    }

    /**
     * Get logs by level
     */
    getLogsByLevel(level: LogLevel): LogEntry[] {
        return this.logs.filter(log => log.level === level);
    }

    /**
     * Clear all logs
     */
    clearLogs(): void {
        this.logs = [];
    }

    /**
     * Emit log to console
     */
    private emitToConsole(entry: LogEntry): void {
        const levelStr = LogLevel[entry.level];
        const timestamp = new Date(entry.timestamp).toISOString();
        const execId = entry.executionId ? `[${entry.executionId.substring(0, 8)}]` : '';

        const prefix = `[${timestamp}] [${levelStr}] [${entry.component}] ${execId}`;

        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(prefix, entry.message, entry.metadata || '');
                break;
            case LogLevel.INFO:
                console.info(prefix, entry.message);
                break;
            case LogLevel.WARN:
                console.warn(prefix, entry.message, entry.metadata || '');
                break;
            case LogLevel.ERROR:
                console.error(prefix, entry.message, entry.metadata || '');
                break;
        }
    }

    /**
     * Get statistics
     */
    getStats(): {
        total: number;
        byLevel: Record<string, number>;
        byComponent: Record<string, number>;
    } {
        const byLevel: Record<string, number> = {
            DEBUG: 0,
            INFO: 0,
            WARN: 0,
            ERROR: 0,
        };

        const byComponent: Record<string, number> = {};

        for (const log of this.logs) {
            const levelName = LogLevel[log.level];
            byLevel[levelName]++;

            if (!byComponent[log.component]) {
                byComponent[log.component] = 0;
            }
            byComponent[log.component]++;
        }

        return {
            total: this.logs.length,
            byLevel,
            byComponent,
        };
    }
}

// Global logger instance
export const logger = new Logger({
    minLevel: LogLevel.INFO,
    userMode: true,
    maxLogs: 1000,
});

// Helper to format tool arguments for logging
export function formatToolArgs(args: any, maxLength: number = 100): string {
    try {
        const str = JSON.stringify(args);
        if (str.length <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength) + '...';
    } catch {
        return '[Unable to stringify]';
    }
}
