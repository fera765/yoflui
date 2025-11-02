/**
 * Timeout Configuration for all external operations
 */

export const TIMEOUT_CONFIG = {
    // MCP operations
    MCP_TOOL_CALL: 30000,        // 30 seconds for MCP tool calls
    MCP_SERVER_START: 10000,     // 10 seconds to start MCP server
    
    // HTTP operations
    HTTP_REQUEST: 60000,         // 60 seconds for HTTP requests
    WEBHOOK_TRIGGER: 5000,       // 5 seconds for webhook callbacks
    
    // LLM operations
    LLM_COMPLETION: 120000,      // 2 minutes for LLM completions
    LLM_STREAMING: 180000,       // 3 minutes for streaming responses
    
    // Shell operations
    SHELL_COMMAND: 300000,       // 5 minutes for shell commands
    SHELL_INTERACTIVE: 600000,   // 10 minutes for interactive shells
    
    // File operations
    FILE_READ: 5000,             // 5 seconds for file reads
    FILE_WRITE: 10000,           // 10 seconds for file writes
    FILE_SEARCH: 30000,          // 30 seconds for file searches
    
    // Automation operations
    AUTOMATION_STEP: 180000,     // 3 minutes per automation step
    AUTOMATION_TOTAL: 1800000,   // 30 minutes total automation
} as const;

/**
 * Wrap a promise with timeout
 */
export function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operation: string
): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    
    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`Timeout: ${operation} exceeded ${timeoutMs}ms`));
        }, timeoutMs);
    });

    return Promise.race([
        promise.then(result => {
            clearTimeout(timeoutId);
            return result;
        }).catch(error => {
            clearTimeout(timeoutId);
            throw error;
        }),
        timeoutPromise
    ]);
}
