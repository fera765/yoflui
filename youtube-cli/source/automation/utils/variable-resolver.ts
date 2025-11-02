/**
 * Resolves variables in strings like ${variables.name}
 */
export class VariableResolver {
    /**
     * Resolve all variables in a string
     */
    resolve(template: string, variables: Record<string, any>): string {
        if (typeof template !== 'string') {
            return template;
        }

        return template.replace(/\$\{([^}]+)\}/g, (match, expression) => {
            try {
                return String(this.evaluateExpression(expression.trim(), variables));
            } catch (error) {
                console.warn(`??  Error resolving ${match}:`, error);
                return match;
            }
        });
    }

    /**
     * Evaluate expression
     */
    private evaluateExpression(expression: string, variables: Record<string, any>): any {
        // Special case: Date.now()
        if (expression === 'Date.now()') {
            return Date.now();
        }

        // Special case: variables.name
        if (expression.startsWith('variables.')) {
            const varName = expression.substring('variables.'.length);
            return this.getNestedValue(variables, varName);
        }

        // Try to evaluate as literal
        try {
            return JSON.parse(expression);
        } catch {
            return expression;
        }
    }

    /**
     * Get nested value (e.g. user.name.first)
     */
    private getNestedValue(obj: any, path: string): any {
        const parts = path.split('.');
        let current = obj;
        
        for (const part of parts) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[part];
        }
        
        return current;
    }

    /**
     * Resolve variables in an object recursively
     */
    resolveObject(obj: any, variables: Record<string, any>): any {
        if (typeof obj === 'string') {
            return this.resolve(obj, variables);
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.resolveObject(item, variables));
        }
        
        if (obj !== null && typeof obj === 'object') {
            const resolved: Record<string, any> = {};
            for (const [key, value] of Object.entries(obj)) {
                resolved[key] = this.resolveObject(value, variables);
            }
            return resolved;
        }
        
        return obj;
    }
}
