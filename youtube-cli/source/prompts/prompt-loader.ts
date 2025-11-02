import { readFileSync } from 'fs';
import { join } from 'path';

interface PromptTemplate {
    name: string;
    description: string;
    template: string;
    variables: Record<string, string>;
}

interface UIMessage {
    icon?: string;
    template: string;
    color?: string;
    variables: Record<string, string>;
}

interface SystemPrompts {
    [key: string]: PromptTemplate;
}

interface UIMessages {
    automation: Record<string, UIMessage>;
    tool_descriptions: Record<string, string>;
    progress: Record<string, string>;
}

let systemPrompts: SystemPrompts | null = null;
let uiMessages: UIMessages | null = null;

/**
 * Load system prompts from JSON
 */
export function loadSystemPrompts(): SystemPrompts {
    if (systemPrompts) return systemPrompts;
    
    try {
        const promptsPath = join(process.cwd(), 'prompts', 'system-prompts.json');
        const content = readFileSync(promptsPath, 'utf-8');
        systemPrompts = JSON.parse(content);
        return systemPrompts!;
    } catch (error) {
        console.error('Failed to load system prompts:', error);
        return {};
    }
}

/**
 * Load UI messages from JSON
 */
export function loadUIMessages(): UIMessages {
    if (uiMessages) return uiMessages;
    
    try {
        const messagesPath = join(process.cwd(), 'prompts', 'ui-messages.json');
        const content = readFileSync(messagesPath, 'utf-8');
        uiMessages = JSON.parse(content);
        return uiMessages!;
    } catch (error) {
        console.error('Failed to load UI messages:', error);
        return {
            automation: {},
            tool_descriptions: {},
            progress: {}
        };
    }
}

/**
 * Interpolate variables into template
 */
export function interpolateTemplate(template: string, variables: Record<string, any>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return result;
}

/**
 * Get system prompt by key with variable interpolation
 */
export function getSystemPrompt(key: string, variables: Record<string, any> = {}): string {
    const prompts = loadSystemPrompts();
    const prompt = prompts[key];
    
    if (!prompt) {
        throw new Error(`System prompt not found: ${key}`);
    }
    
    return interpolateTemplate(prompt.template, variables);
}

/**
 * Get UI message with variable interpolation
 */
export function getUIMessage(
    category: 'automation' | 'tool_descriptions' | 'progress',
    key: string,
    variables: Record<string, any> = {}
): string {
    const messages = loadUIMessages();
    
    if (category === 'automation') {
        const message = messages.automation[key];
        if (!message) {
            throw new Error(`UI message not found: ${category}.${key}`);
        }
        return interpolateTemplate(message.template, { icon: message.icon, ...variables });
    }
    
    if (category === 'tool_descriptions') {
        return messages.tool_descriptions[key] || `?? Executing: ${key}`;
    }
    
    if (category === 'progress') {
        return messages.progress[key] || '? Processing...';
    }
    
    return '';
}

/**
 * Format tool execution message with icon
 */
export function formatToolMessage(toolName: string, status: 'start' | 'success' | 'error', error?: string): string {
    const messages = loadUIMessages();
    
    if (status === 'start') {
        const description = messages.tool_descriptions[toolName];
        return description || `?? Executing: ${toolName}`;
    }
    
    if (status === 'success') {
        return getUIMessage('automation', 'tool_success', { tool_name: toolName });
    }
    
    if (status === 'error') {
        return getUIMessage('automation', 'tool_error', { tool_name: toolName, error: error || 'Unknown error' });
    }
    
    return `?? ${toolName}`;
}

/**
 * Format automation start message
 */
export function formatAutomationStart(name: string, description: string): string {
    return getUIMessage('automation', 'start', { name, description });
}

/**
 * Format automation complete message
 */
export function formatAutomationComplete(duration: number, summary: string): string {
    return getUIMessage('automation', 'complete', { 
        duration: Math.round(duration / 1000), 
        summary 
    });
}

/**
 * Format webhook setup message
 */
export function formatWebhookSetup(
    url: string,
    method: string,
    requireAuth: boolean,
    apiKey: string,
    payloadSchema: Record<string, any>
): string {
    const authInfo = requireAuth ? `?? Auth: Bearer ${apiKey}` : `?? Auth: Not required`;
    const payload = JSON.stringify(payloadSchema, null, 2);
    
    return getUIMessage('automation', 'webhook_setup', {
        url,
        method,
        auth_info: authInfo,
        payload_schema: payload
    });
}

/**
 * Format webhook triggered message
 */
export function formatWebhookTriggered(): string {
    return getUIMessage('automation', 'webhook_triggered', {});
}
