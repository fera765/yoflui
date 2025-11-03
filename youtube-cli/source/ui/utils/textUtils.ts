/**
 * Text Utilities for UI
 * Based on qwen-code textUtils
 */

/**
 * Convert string to array of code points
 */
export const toCodePoints = (str: string): string[] => [...str];

/**
 * Get code point length
 */
export const cpLen = (str: string): number => [...str].length;

/**
 * Slice string by code points
 */
export const cpSlice = (str: string, start: number, end?: number): string => {
	const points = toCodePoints(str);
	return points.slice(start, end).join('');
};

/**
 * Escape ANSI control codes for safe rendering
 */
export function escapeAnsiCtrlCodes<T extends Record<string, any>>(item: T): T {
	// Simple implementation - strips ANSI codes
	// In production, you might want more sophisticated handling
	const escapeString = (str: string): string => {
		if (typeof str !== 'string') return str;
		// Remove ANSI escape codes
		return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
	};
	
	const escaped = { ...item };
	
	// Recursively escape string properties
	for (const key in escaped) {
		const value = escaped[key];
		if (typeof value === 'string') {
			escaped[key] = escapeString(value) as any;
		} else if (typeof value === 'object' && value !== null) {
			escaped[key] = escapeAnsiCtrlCodes(value);
		}
	}
	
	return escaped;
}
