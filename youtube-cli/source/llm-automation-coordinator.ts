import OpenAI from 'openai';
import { getConfig } from './llm-config.js';
import { loadQwenCredentials, getValidAccessToken } from './qwen-oauth.js';
import { executeToolCall, getAllToolDefinitions } from './tools/index.js';
import type { Automation } from './automation/types.js';
import { ExecutionContext } from './utils/execution-context.js';
import { withTimeout, TIMEOUT_CONFIG } from './config/timeout-config.js';
import { logger, formatToolArgs } from './utils/logger.js';
import { checkpointManager } from './automation/checkpoint-manager.js';
import { getSystemPrompt, formatToolMessage } from './prompts/prompt-loader.js';

interface CoordinatorOptions {
    automation: Automation;
    workDir: string;
    webhookData?: any;
    onProgress?: (message: string) => void;
    enableCheckpoints?: boolean;
}

/**
 * LLM Automation Coordinator
 * The LLM orchestrates the entire automation dynamically
 */
export class LLMAutomationCoordinator {
    private conversationHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    private executionContext: ExecutionContext;

    constructor(executionContext: ExecutionContext) {
        this.executionContext = executionContext;
    }

    async executeAutomation(options: CoordinatorOptions): Promise<string> {
        const { automation, workDir, webhookData, onProgress, enableCheckpoints = true } = options;
        
        // Create initial checkpoint if enabled
        if (enableCheckpoints) {
            checkpointManager.createInitialCheckpoint(
                this.executionContext.getExecutionId(),
                automation,
                webhookData ? { webhookData } : {}
            );
        }

        const config = getConfig();
        const qwenCreds = loadQwenCredentials();
        let endpoint = config.endpoint;
        let apiKey = config.apiKey || 'not-needed';

        if (qwenCreds?.access_token) {
            const validToken = await getValidAccessToken();
            if (validToken) {
                apiKey = validToken;
                const resourceUrl = qwenCreds.resource_url || 'portal.qwen.ai';
                endpoint = `https://${resourceUrl}/v1`;
            }
        }

        const openai = new OpenAI({ baseURL: endpoint, apiKey });

        // Build automation context for LLM
        const automationContext = this.buildAutomationContext(automation, webhookData);

        // Initialize conversation with system prompt from JSON
        const systemPromptContent = getSystemPrompt('automation_coordinator', {
            automation_context: automationContext
        });

        this.conversationHistory = [
            {
                role: 'system',
                content: systemPromptContent
            },
            {
                role: 'user',
                content: webhookData
                    ? `Webhook triggered! Data received:\n${JSON.stringify(webhookData, null, 2)}\n\nExecute the automation now.`
                    : 'Execute this automation now.',
            },
        ];

        let iterations = 0;
        const maxIterations = 20;
        const executionLog: string[] = [];
        let currentStepIndex = 0;

        try {
            while (iterations < maxIterations) {
                iterations++;

                // Apply timeout to LLM call
                const response = await withTimeout(
                    openai.chat.completions.create({
                        model: config.model,
                        messages: this.conversationHistory,
                        tools: getAllToolDefinitions(),
                        tool_choice: 'auto',
                    }),
                    TIMEOUT_CONFIG.LLM_COMPLETION,
                    `LLM completion for ${automation.metadata.name}`
                );

                const assistantMsg = response.choices[0]?.message;
                if (!assistantMsg) break;

                // Add assistant message to history
                this.conversationHistory.push({
                    role: 'assistant',
                    content: assistantMsg.content || '',
                    tool_calls: assistantMsg.tool_calls,
                });

                // Show progress (deduplicated)
                if (assistantMsg.content && onProgress) {
                    const messageKey = `llm:${assistantMsg.content.substring(0, 50)}`;
                    if (this.executionContext.shouldEmitMessage(messageKey)) {
                        onProgress(JSON.stringify({
                            type: 'llm_message',
                            content: assistantMsg.content,
                            timestamp: Date.now()
                        }));
                        logger.info(
                            'LLMCoordinator',
                            'LLM response',
                            { length: assistantMsg.content.length },
                            this.executionContext.getExecutionId()
                        );
                    }
                    executionLog.push(`[LLM]: ${assistantMsg.content}`);
                }

                // Handle tool calls
                if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
                    for (const toolCall of assistantMsg.tool_calls) {
                        const func = (toolCall as any).function;
                        const toolName = func.name;
                        const args = JSON.parse(func.arguments);

                        // Emit tool execution notification (deduplicated)
                        const toolKey = `tool:${toolName}:${Date.now()}`;
                        if (this.executionContext.shouldEmitMessage(toolKey) && onProgress) {
                            onProgress(JSON.stringify({
                                type: 'tool_start',
                                toolName,
                                args,
                                timestamp: Date.now()
                            }));
                        }

                        executionLog.push(`[TOOL]: ${toolName} with args: ${JSON.stringify(args)}`);
                        
                        logger.debug(
                            'LLMCoordinator',
                            `Executing tool: ${toolName}`,
                            { args: formatToolArgs(args) },
                            this.executionContext.getExecutionId()
                        );

                        let result: string;
                        let hasError = false;

                        try {
                            // Tool execution now has timeout + retry built-in
                            result = await executeToolCall(toolName, args, workDir);
                            executionLog.push(`[RESULT]: ${result.substring(0, 200)}`);
                            
                            logger.info(
                                'LLMCoordinator',
                                `Tool completed: ${toolName}`,
                                { resultLength: result.length },
                                this.executionContext.getExecutionId()
                            );
                            
                            // Update checkpoint on success
                            if (enableCheckpoints) {
                                checkpointManager.updateCheckpointAfterStep(
                                    this.executionContext.getExecutionId(),
                                    currentStepIndex,
                                    toolName,
                                    'success',
                                    result.substring(0, 500)
                                );
                                currentStepIndex++;
                            }
                        } catch (error) {
                            result = `Error: ${error instanceof Error ? error.message : String(error)}`;
                            hasError = true;
                            executionLog.push(`[ERROR]: ${result}`);
                            
                            logger.error(
                                'LLMCoordinator',
                                `Tool failed: ${toolName}`,
                                { error: result },
                                this.executionContext.getExecutionId()
                            );
                            
                            // Update checkpoint on error
                            if (enableCheckpoints) {
                                checkpointManager.updateCheckpointAfterStep(
                                    this.executionContext.getExecutionId(),
                                    currentStepIndex,
                                    toolName,
                                    'error',
                                    undefined,
                                    result
                                );
                                currentStepIndex++;
                            }
                        }

                        // Add tool result to conversation (continue flow even on error)
                        this.conversationHistory.push({
                            role: 'tool',
                            content: result,
                            tool_call_id: toolCall.id,
                        });
                    }
                    // Continue loop even if tool failed - LLM can handle errors
                    continue;
                }

                // No more tool calls, LLM is done
                if (assistantMsg.content) {
                    // Mark checkpoint as completed
                    if (enableCheckpoints) {
                        checkpointManager.markCheckpointCompleted(this.executionContext.getExecutionId());
                    }
                    return assistantMsg.content;
                }

                break;
            }

            // Mark checkpoint as completed
            if (enableCheckpoints) {
                checkpointManager.markCheckpointCompleted(this.executionContext.getExecutionId());
            }
            
            return executionLog.join('\n');
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            executionLog.push(`[FATAL ERROR]: ${errorMsg}`);
            
            logger.error(
                'LLMCoordinator',
                'Automation execution failed',
                { error: errorMsg },
                this.executionContext.getExecutionId()
            );
            
            return executionLog.join('\n');
        }
    }

    /**
     * Continue conversation after automation
     */
    async continueConversation(userMessage: string, workDir?: string): Promise<string> {
        const config = getConfig();
        const qwenCreds = loadQwenCredentials();
        let endpoint = config.endpoint;
        let apiKey = config.apiKey || 'not-needed';

        if (qwenCreds?.access_token) {
            const validToken = await getValidAccessToken();
            if (validToken) {
                apiKey = validToken;
                const resourceUrl = qwenCreds.resource_url || 'portal.qwen.ai';
                endpoint = `https://${resourceUrl}/v1`;
            }
        }

        const openai = new OpenAI({ baseURL: endpoint, apiKey });

        // Add user message
        this.conversationHistory.push({
            role: 'user',
            content: userMessage,
        });

        let iterations = 0;
        const maxIterations = 10;

        while (iterations < maxIterations) {
            iterations++;

            // Apply timeout to conversation continuation
            const response = await withTimeout(
                openai.chat.completions.create({
                    model: config.model,
                    messages: this.conversationHistory,
                    tools: getAllToolDefinitions(),
                    tool_choice: 'auto',
                }),
                TIMEOUT_CONFIG.LLM_COMPLETION,
                'Continue conversation'
            );

            const assistantMsg = response.choices[0]?.message;
            if (!assistantMsg) break;

            // Add assistant message to history
            this.conversationHistory.push({
                role: 'assistant',
                content: assistantMsg.content || '',
                tool_calls: assistantMsg.tool_calls,
            });

            // Handle tool calls if present
            if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
                for (const toolCall of assistantMsg.tool_calls) {
                    const func = (toolCall as any).function;
                    const toolName = func.name;
                    const args = JSON.parse(func.arguments);

                    logger.debug(
                        'LLMCoordinator',
                        `Conversation tool: ${toolName}`,
                        { args: formatToolArgs(args) },
                        this.executionContext.getExecutionId()
                    );

                    let result: string;

                    try {
                        // Execute tool with timeout + retry
                        result = await executeToolCall(toolName, args, workDir || process.cwd());
                        
                        logger.info(
                            'LLMCoordinator',
                            `Conversation tool completed: ${toolName}`,
                            { resultLength: result.length },
                            this.executionContext.getExecutionId()
                        );
                    } catch (error) {
                        result = `Error: ${error instanceof Error ? error.message : String(error)}`;
                        
                        logger.error(
                            'LLMCoordinator',
                            `Conversation tool failed: ${toolName}`,
                            { error: result },
                            this.executionContext.getExecutionId()
                        );
                    }

                    // Add tool result to conversation history (continue even on error)
                    this.conversationHistory.push({
                        role: 'tool',
                        content: result,
                        tool_call_id: toolCall.id,
                    });
                }
                
                // Continue loop to get LLM's response to tool results (even if errors occurred)
                continue;
            }

            // No tool calls, return content
            if (assistantMsg.content) {
                return assistantMsg.content;
            }

            break;
        }

        return 'No response';
    }

    /**
     * Get conversation history
     */
    getConversationHistory(): OpenAI.Chat.ChatCompletionMessageParam[] {
        return [...this.conversationHistory];
    }

    /**
     * Build automation context for LLM
     */
    private buildAutomationContext(automation: Automation, webhookData?: any): string {
        const lines: string[] = [];

        lines.push(`# Automation: ${automation.metadata.name}`);
        lines.push(`Description: ${automation.metadata.description}`);
        lines.push('');

        if (webhookData) {
            lines.push('## Webhook Data Received:');
            lines.push(JSON.stringify(webhookData, null, 2));
            lines.push('');
        }

        lines.push('## Variables:');
        for (const [name, def] of Object.entries(automation.variables)) {
            lines.push(`- ${name}: ${def.type} (default: ${def.defaultValue})`);
        }
        lines.push('');

        lines.push('## Steps to Execute:');
        for (const step of automation.steps) {
            lines.push(`${step.id}: ${step.type} - ${step.description || 'No description'}`);
            if (step.toolName) {
                lines.push(`  Tool: ${step.toolName}`);
            }
        }

        return lines.join('\n');
    }
}
