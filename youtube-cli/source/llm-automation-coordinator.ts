import OpenAI from 'openai';
import { getConfig } from './llm-config.js';
import { loadQwenCredentials, getValidAccessToken } from './qwen-oauth.js';
import { executeToolCall, getAllToolDefinitions } from './tools/index.js';
import type { Automation } from './automation/types.js';
import { ExecutionContext } from './utils/execution-context.js';
import { withTimeout, TIMEOUT_CONFIG } from './config/timeout-config.js';

interface CoordinatorOptions {
    automation: Automation;
    workDir: string;
    webhookData?: any;
    onProgress?: (message: string) => void;
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
        const { automation, workDir, webhookData, onProgress } = options;

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

        // Initialize conversation
        this.conversationHistory = [
            {
                role: 'system',
                content: `You are an automation coordinator. You will execute the following automation step by step:

${automationContext}

Your job is to:
1. Execute each step of the automation using the available tools
2. Report what you're doing at each step
3. Handle errors gracefully
4. Provide a final summary

Available tools: ${getAllToolDefinitions().map(t => t.function.name).join(', ')}

Work directory: ${workDir}

Execute the automation now, step by step, using the tools available.`,
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
                        onProgress(assistantMsg.content);
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
                            onProgress(`??  Executing: ${toolName}`);
                        }

                        executionLog.push(`[TOOL]: ${toolName} with args: ${JSON.stringify(args)}`);

                        let result: string;
                        let hasError = false;

                        try {
                            // Tool execution now has timeout + retry built-in
                            result = await executeToolCall(toolName, args, workDir);
                            executionLog.push(`[RESULT]: ${result.substring(0, 200)}`);
                        } catch (error) {
                            result = error instanceof Error ? error.message : String(error);
                            hasError = true;
                            executionLog.push(`[ERROR]: ${result}`);
                        }

                        // Add tool result to conversation
                        this.conversationHistory.push({
                            role: 'tool',
                            content: result,
                            tool_call_id: toolCall.id,
                        });
                    }
                    continue;
                }

                // No more tool calls, LLM is done
                if (assistantMsg.content) {
                    return assistantMsg.content;
                }

                break;
            }

            return executionLog.join('\n');
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            executionLog.push(`[FATAL ERROR]: ${errorMsg}`);
            return executionLog.join('\n');
        }
    }

    /**
     * Continue conversation after automation
     */
    async continueConversation(userMessage: string): Promise<string> {
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
        if (assistantMsg) {
            this.conversationHistory.push({
                role: 'assistant',
                content: assistantMsg.content || '',
                tool_calls: assistantMsg.tool_calls,
            });

            return assistantMsg.content || 'No response';
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
