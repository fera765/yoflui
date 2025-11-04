/**
 * Unicode-aware text utilities
 * Based on qwen-code implementation
 */

/**
 * Convert string to array of code points (handles multi-byte characters correctly)
 */
export const toCodePoints = (str: string): string[] => [...str];

/**
 * Get code point length (correct length for Unicode strings)
 */
export const cpLen = (str: string): number => [...str].length;

/**
 * Slice string by code points (not bytes)
 */
export const cpSlice = (str: string, start: number, end?: number): string => {
	const points = toCodePoints(str);
	return points.slice(start, end).join('');
};

/**
 * Strip unsafe/control characters (except newline)
 */
export const stripUnsafeCharacters = (str: string): string => {
	return str.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
};

/**
 * Check if character is a word character
 */
export const isWordChar = (ch: string | undefined): boolean => {
	if (ch === undefined) return false;
	return !/[\s,.;!?]/.test(ch);
};

/**
 * Check if character is whitespace
 */
export const isWhitespace = (char: string): boolean => /\s/.test(char);

/**
 * Find next word start position in a line
 */
export const findNextWordStart = (line: string, col: number): number | null => {
	const chars = toCodePoints(line);
	let i = col;
	
	if (i >= chars.length) return null;
	
	// Skip current word
	while (i < chars.length && isWordChar(chars[i])) i++;
	// Skip spaces
	while (i < chars.length && isWhitespace(chars[i])) i++;
	
	return i < chars.length ? i : null;
};

/**
 * Find previous word start position in a line
 */
export const findPrevWordStart = (line: string, col: number): number | null => {
	const chars = toCodePoints(line);
	let i = col;
	
	if (i <= 0) return null;
	
	i--;
	// Skip whitespace backwards
	while (i >= 0 && isWhitespace(chars[i])) i--;
	if (i < 0) return null;
	
	// Move to beginning of word
	while (i >= 0 && isWordChar(chars[i])) i--;
	
	return i + 1;
};
