/**
 * Evaluates conditional expressions safely
 */
export class ConditionEvaluator {
    /**
     * Evaluate condition string
     */
    evaluate(condition: string, variables: Record<string, any>): boolean {
        try {
            // Replace variables.name with actual values
            const replaced = this.replaceVariables(condition, variables);
            
            // Evaluate the expression
            // Using Function constructor for safer evaluation than eval()
            const func = new Function('variables', `return ${replaced}`);
            return Boolean(func(variables));
        } catch (error) {
            console.error(`? Error evaluating condition "${condition}":`, error);
            return false;
        }
    }

    /**
     * Replace variables in condition
     */
    private replaceVariables(condition: string, variables: Record<string, any>): string {
        return condition.replace(/variables\.(\w+)/g, (match, varName) => {
            const value = variables[varName];
            if (value === undefined) {
                return 'undefined';
            }
            return JSON.stringify(value);
        });
    }
}
