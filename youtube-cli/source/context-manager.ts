import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { scanFolderStructure } from './folder-scanner.js';

export interface FluiContext {
	sessionId: string;
	timestamp: number;
	workingDirectory: string;
	folderStructure: FolderNode[];
	userInput?: string;
	projectType?: string;
	conversationHistory: ConversationEntry[];
}

export interface FolderNode {
	name: string;
	type: 'file' | 'folder';
	path: string;
	children?: FolderNode[];
}

export interface ConversationEntry {
	timestamp: number;
	role: 'user' | 'assistant' | 'system';
	content: string;
}

/**
 * Get or create .flui directory in current working directory
 */
export function getFluiDirectory(cwd: string = process.cwd()): string {
	const fluiDir = join(cwd, '.flui');
	if (!existsSync(fluiDir)) {
		mkdirSync(fluiDir, { recursive: true });
	}
	return fluiDir;
}

/**
 * Get context file path for current session
 */
export function getContextPath(cwd: string = process.cwd()): string {
	const fluiDir = getFluiDirectory(cwd);
	return join(fluiDir, 'context.json');
}

/**
 * Load existing context or create new one
 */
export function loadOrCreateContext(userInput?: string, cwd: string = process.cwd()): FluiContext {
	const contextPath = getContextPath(cwd);
	
	// Try to load existing context
	if (existsSync(contextPath)) {
		try {
			const data = readFileSync(contextPath, 'utf-8');
			const context = JSON.parse(data) as FluiContext;
			
			// Update timestamp
			context.timestamp = Date.now();
			if (userInput) {
				context.userInput = userInput;
			}
			
			return context;
		} catch (error) {
			// If parsing fails, create new context
			console.error('[Context] Failed to load context, creating new one');
		}
	}
	
	// Create new context with folder structure
	const folderStructure = scanFolderStructure(cwd);
	const projectType = detectProjectType(folderStructure);
	
	const newContext: FluiContext = {
		sessionId: `session-${Date.now()}`,
		timestamp: Date.now(),
		workingDirectory: cwd,
		folderStructure,
		userInput,
		projectType,
		conversationHistory: [],
	};
	
	return newContext;
}

/**
 * Save context to .flui/context.json
 */
export function saveContext(context: FluiContext, cwd: string = process.cwd()): void {
	const contextPath = getContextPath(cwd);
	writeFileSync(contextPath, JSON.stringify(context, null, 2), 'utf-8');
}

/**
 * Add conversation entry to context
 */
export function addToConversation(
	role: 'user' | 'assistant' | 'system',
	content: string,
	cwd: string = process.cwd()
): void {
	const context = loadOrCreateContext(undefined, cwd);
	
	context.conversationHistory.push({
		timestamp: Date.now(),
		role,
		content,
	});
	
	// Keep only last 50 messages
	if (context.conversationHistory.length > 50) {
		context.conversationHistory = context.conversationHistory.slice(-50);
	}
	
	saveContext(context, cwd);
}

/**
 * Detect project type based on folder structure
 */
function detectProjectType(structure: FolderNode[]): string {
	const hasFile = (name: string): boolean => {
		return structure.some(node => node.name === name && node.type === 'file');
	};
	
	const hasFolder = (name: string): boolean => {
		return structure.some(node => node.name === name && node.type === 'folder');
	};
	
	// React/Frontend projects
	if (hasFile('package.json')) {
		if (hasFolder('src') || hasFolder('components')) {
			return 'frontend-react';
		}
		return 'nodejs';
	}
	
	// Python projects
	if (hasFile('requirements.txt') || hasFile('setup.py') || hasFile('pyproject.toml')) {
		return 'python';
	}
	
	// Go projects
	if (hasFile('go.mod')) {
		return 'golang';
	}
	
	// Rust projects
	if (hasFile('Cargo.toml')) {
		return 'rust';
	}
	
	// Java/Maven projects
	if (hasFile('pom.xml')) {
		return 'java-maven';
	}
	
	// Generic
	return 'generic';
}

/**
 * Generate context prompt for LLM
 */
export function generateContextPrompt(context: FluiContext): string {
	const lines: string[] = [];
	
	lines.push('## PROJECT CONTEXT');
	lines.push(`Working Directory: ${context.workingDirectory}`);
	lines.push(`Project Type: ${context.projectType}`);
	lines.push(`Session ID: ${context.sessionId}`);
	lines.push('');
	
	lines.push('## FOLDER STRUCTURE (names only, no content):');
	lines.push(formatFolderStructure(context.folderStructure, 0));
	lines.push('');
	
	if (context.conversationHistory.length > 0) {
		lines.push('## RECENT CONVERSATION:');
		const recent = context.conversationHistory.slice(-5);
		for (const entry of recent) {
			const time = new Date(entry.timestamp).toLocaleTimeString();
			lines.push(`[${time}] ${entry.role}: ${entry.content.substring(0, 100)}`);
		}
		lines.push('');
	}
	
	if (context.userInput) {
		lines.push(`## CURRENT USER INPUT: ${context.userInput}`);
		lines.push('');
	}
	
	return lines.join('\n');
}

/**
 * Format folder structure as tree
 */
function formatFolderStructure(nodes: FolderNode[], depth: number, maxDepth: number = 3): string {
	if (depth >= maxDepth) return '';
	
	const lines: string[] = [];
	const indent = '  '.repeat(depth);
	
	for (const node of nodes) {
		const icon = node.type === 'folder' ? '??' : '??';
		lines.push(`${indent}${icon} ${node.name}`);
		
		if (node.children && node.children.length > 0 && depth < maxDepth - 1) {
			lines.push(formatFolderStructure(node.children, depth + 1, maxDepth));
		}
	}
	
	return lines.join('\n');
}

/**
 * Refresh folder structure in context
 */
export function refreshFolderStructure(cwd: string = process.cwd()): void {
	const context = loadOrCreateContext(undefined, cwd);
	context.folderStructure = scanFolderStructure(cwd);
	context.projectType = detectProjectType(context.folderStructure);
	saveContext(context, cwd);
}
