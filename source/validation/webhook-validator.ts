/**
 * Webhook Payload Validation
 * Validates incoming webhook payloads against expected schemas
 */

export interface ValidationResult {
    valid: boolean;
    errors?: string[];
    sanitizedData?: any;
}

export class WebhookValidator {
    /**
     * Validate webhook payload against expected schema
     */
    validatePayload(
        payload: any,
        expectedPayload: Record<string, string>
    ): ValidationResult {
        if (!payload || typeof payload !== 'object') {
            return {
                valid: false,
                errors: ['Payload must be a valid JSON object'],
            };
        }

        const errors: string[] = [];
        const sanitizedData: Record<string, any> = {};

        // Check required fields
        for (const [fieldName, fieldType] of Object.entries(expectedPayload)) {
            if (!(fieldName in payload)) {
                errors.push(`Missing required field: "${fieldName}"`);
                continue;
            }

            const value = payload[fieldName];

            // Check for placeholder values
            if (this.isPlaceholderValue(value)) {
                errors.push(`Field "${fieldName}" contains placeholder value "${value}"`);
                continue;
            }

            // Validate type
            const typeValidation = this.validateType(value, fieldType, fieldName);
            if (!typeValidation.valid) {
                errors.push(...(typeValidation.errors || []));
                continue;
            }

            sanitizedData[fieldName] = typeValidation.sanitizedValue;
        }

        // Check for extra fields (warn but don't fail)
        for (const fieldName of Object.keys(payload)) {
            if (!(fieldName in expectedPayload)) {
                console.warn(`[WEBHOOK VALIDATOR] Unexpected field: "${fieldName}" (will be ignored)`);
            }
        }

        if (errors.length > 0) {
            return { valid: false, errors };
        }

        return { valid: true, sanitizedData };
    }

    /**
     * Check if value is a placeholder
     */
    private isPlaceholderValue(value: any): boolean {
        if (typeof value !== 'string') return false;

        const placeholders = [
            'string',
            'number',
            'boolean',
            'array',
            'object',
            'null',
            'undefined',
            'placeholder',
            'example',
            'sample',
            'test',
        ];

        const normalized = value.toLowerCase().trim();
        return placeholders.includes(normalized);
    }

    /**
     * Validate and coerce type
     */
    private validateType(
        value: any,
        expectedType: string,
        fieldName: string
    ): { valid: boolean; errors?: string[]; sanitizedValue?: any } {
        const type = expectedType.toLowerCase();

        switch (type) {
            case 'string':
                if (typeof value === 'string') {
                    return { valid: true, sanitizedValue: value.trim() };
                }
                // Try to coerce
                if (value !== null && value !== undefined) {
                    return { valid: true, sanitizedValue: String(value) };
                }
                return {
                    valid: false,
                    errors: [`Field "${fieldName}" must be a string, got ${typeof value}`],
                };

            case 'number':
                if (typeof value === 'number' && !isNaN(value)) {
                    return { valid: true, sanitizedValue: value };
                }
                // Try to coerce
                if (typeof value === 'string') {
                    const parsed = parseFloat(value);
                    if (!isNaN(parsed)) {
                        return { valid: true, sanitizedValue: parsed };
                    }
                }
                return {
                    valid: false,
                    errors: [`Field "${fieldName}" must be a number, got ${typeof value}`],
                };

            case 'boolean':
                if (typeof value === 'boolean') {
                    return { valid: true, sanitizedValue: value };
                }
                // Try to coerce
                if (value === 'true' || value === '1' || value === 1) {
                    return { valid: true, sanitizedValue: true };
                }
                if (value === 'false' || value === '0' || value === 0) {
                    return { valid: true, sanitizedValue: false };
                }
                return {
                    valid: false,
                    errors: [`Field "${fieldName}" must be a boolean, got ${typeof value}`],
                };

            case 'array':
                if (Array.isArray(value)) {
                    return { valid: true, sanitizedValue: value };
                }
                return {
                    valid: false,
                    errors: [`Field "${fieldName}" must be an array, got ${typeof value}`],
                };

            case 'object':
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    return { valid: true, sanitizedValue: value };
                }
                return {
                    valid: false,
                    errors: [`Field "${fieldName}" must be an object, got ${typeof value}`],
                };

            default:
                // Unknown type, accept as-is but warn
                console.warn(`[WEBHOOK VALIDATOR] Unknown type "${expectedType}" for field "${fieldName}"`);
                return { valid: true, sanitizedValue: value };
        }
    }

    /**
     * Validate payload size
     */
    validateSize(payload: any, maxSizeBytes: number = 1048576): ValidationResult {
        try {
            const payloadString = JSON.stringify(payload);
            const sizeBytes = Buffer.byteLength(payloadString, 'utf8');

            if (sizeBytes > maxSizeBytes) {
                return {
                    valid: false,
                    errors: [
                        `Payload size (${sizeBytes} bytes) exceeds maximum allowed size (${maxSizeBytes} bytes)`,
                    ],
                };
            }

            return { valid: true };
        } catch (error) {
            return {
                valid: false,
                errors: ['Failed to serialize payload for size validation'],
            };
        }
    }

    /**
     * Sanitize payload by removing potentially dangerous content
     */
    sanitizePayload(payload: any): any {
        if (typeof payload !== 'object' || payload === null) {
            return payload;
        }

        if (Array.isArray(payload)) {
            return payload.map(item => this.sanitizePayload(item));
        }

        const sanitized: Record<string, any> = {};

        for (const [key, value] of Object.entries(payload)) {
            // Remove dangerous keys
            if (key.startsWith('__') || key === 'constructor' || key === 'prototype') {
                continue;
            }

            // Recursively sanitize nested objects
            if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizePayload(value);
            } else if (typeof value === 'string') {
                // Basic XSS prevention
                sanitized[key] = value
                    .replace(/<script[^>]*>.*?<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }
}

// Singleton instance
export const webhookValidator = new WebhookValidator();
