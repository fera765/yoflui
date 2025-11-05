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
	// NOVO: Estado de Execução Perfeito
	executionState: ExecutionState;
	// NOVO: Cache de Resultados Intermediários
	intermediateResults: Map<string, IntermediateResult>;
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

// NOVO: Estado de Execução para Memória Perfeita
export interface ExecutionState {
	currentStep: number;
	totalSteps: number;
	completedTasks: string[];
	failedTasks: string[];
	resourcesCreated: ResourceReference[];
	lastToolOutputs: Map<string, string>;
	contextCarryover: any; // Dados a serem passados entre etapas
}

export interface ResourceReference {
	type: 'file' | 'directory' | 'url' | 'data';
	identifier: string;
	createdAt: number;
	metadata?: any;
}

export interface IntermediateResult {
	taskId: string;
	taskTitle: string;
	result: string;
	timestamp: number;
	toolsUsed: string[];
	success: boolean;
}

/**
 * CONTEXTO MANAGER APRIMORADO - Memória Perfeita e Coordenação Cirúrgica
 * 
 * Este módulo é responsável por:
 * 1. Manter estado perfeito entre todas as etapas de execução
 * 2. Armazenar e recuperar resultados intermediários
 * 3. Rastrear recursos criados (arquivos, dados, etc.)
 * 4. Injetar contexto automaticamente em cada nova etapa
 */

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
 * NOVO: Inicializar estado de execução vazio
 */
export function createEmptyExecutionState(): ExecutionState {
	return {
		currentStep: 0,
		totalSteps: 0,
		completedTasks: [],
		failedTasks: [],
		resourcesCreated: [],
		lastToolOutputs: new Map(),
		contextCarryover: {},
	};
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
			
			// Garantir que executionState existe (backward compatibility)
			if (!context.executionState) {
				context.executionState = createEmptyExecutionState();
			}
			
			// Converter intermediateResults de objeto para Map
			if (!context.intermediateResults || !(context.intermediateResults instanceof Map)) {
				const resultsObj = context.intermediateResults as any || {};
				context.intermediateResults = new Map(Object.entries(resultsObj));
			}
			
			// Converter lastToolOutputs de objeto para Map
			if (context.executionState && context.executionState.lastToolOutputs) {
				if (!(context.executionState.lastToolOutputs instanceof Map)) {
					const outputsObj = context.executionState.lastToolOutputs as any;
					context.executionState.lastToolOutputs = new Map(Object.entries(outputsObj));
				}
			}
			
			return context;
		} catch (error) {
		// If parsing fails, create new context
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
		executionState: createEmptyExecutionState(),
		intermediateResults: new Map(),
	};
	
	return newContext;
}

/**
 * Save context to .flui/context.json
 */
export function saveContext(context: FluiContext, cwd: string = process.cwd()): void {
	const contextPath = getContextPath(cwd);
	
	// Converter Maps para objetos simples para JSON
	const serializable = {
		...context,
		intermediateResults: Object.fromEntries(context.intermediateResults),
		executionState: {
			...context.executionState,
			lastToolOutputs: Object.fromEntries(context.executionState.lastToolOutputs),
		},
	};
	
	writeFileSync(contextPath, JSON.stringify(serializable, null, 2), 'utf-8');
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
 * NOVO: Registrar resultado intermediário (para injeção automática em próximas etapas)
 */
export function recordIntermediateResult(
	taskId: string,
	taskTitle: string,
	result: string,
	toolsUsed: string[],
	success: boolean,
	cwd: string = process.cwd()
): void {
	const context = loadOrCreateContext(undefined, cwd);
	
	const intermediateResult: IntermediateResult = {
		taskId,
		taskTitle,
		result,
		timestamp: Date.now(),
		toolsUsed,
		success,
	};
	
	context.intermediateResults.set(taskId, intermediateResult);
	
	// Atualizar execution state
	if (success) {
		context.executionState.completedTasks.push(taskId);
	} else {
		context.executionState.failedTasks.push(taskId);
	}
	
	context.executionState.currentStep++;
	
	saveContext(context, cwd);
}

/**
 * NOVO: Registrar recurso criado (arquivo, diretório, etc.)
 */
export function recordResourceCreated(
	type: 'file' | 'directory' | 'url' | 'data',
	identifier: string,
	metadata?: any,
	cwd: string = process.cwd()
): void {
	const context = loadOrCreateContext(undefined, cwd);
	
	const resource: ResourceReference = {
		type,
		identifier,
		createdAt: Date.now(),
		metadata,
	};
	
	context.executionState.resourcesCreated.push(resource);
	saveContext(context, cwd);
}

/**
 * NOVO: Obter contexto completo para injeção em próxima etapa
 * 
 * Retorna um resumo rico de TUDO que foi feito até agora:
 * - Tarefas completadas
 * - Recursos criados
 * - Resultados intermediários relevantes
 * - Dados de contexto carryover
 */
export function getContextForNextStep(cwd: string = process.cwd()): string {
	const context = loadOrCreateContext(undefined, cwd);
	
	const lines: string[] = [];
	
	lines.push('## CONTEXTO DE EXECUÇÃO (Memória Perfeita)');
	lines.push('');
	
	// Progresso atual
	lines.push(`**Progresso:** Etapa ${context.executionState.currentStep}/${context.executionState.totalSteps}`);
	lines.push('');
	
	// Tarefas completadas
	if (context.executionState.completedTasks.length > 0) {
		lines.push('**Tarefas Completadas:**');
		for (const taskId of context.executionState.completedTasks) {
			const result = context.intermediateResults.get(taskId);
			if (result) {
				lines.push(`- ${result.taskTitle} (${taskId})`);
				lines.push(`  Resultado: ${result.result.substring(0, 200)}...`);
			}
		}
		lines.push('');
	}
	
	// Recursos criados
	if (context.executionState.resourcesCreated.length > 0) {
		lines.push('**Recursos Criados:**');
		for (const resource of context.executionState.resourcesCreated) {
			lines.push(`- ${resource.type}: ${resource.identifier}`);
			if (resource.metadata) {
				lines.push(`  Metadata: ${JSON.stringify(resource.metadata)}`);
			}
		}
		lines.push('');
	}
	
	// Contexto carryover (dados específicos para próxima etapa)
	if (Object.keys(context.executionState.contextCarryover).length > 0) {
		lines.push('**Dados de Contexto:**');
		lines.push(JSON.stringify(context.executionState.contextCarryover, null, 2));
		lines.push('');
	}
	
	return lines.join('\n');
}

/**
 * NOVO: Atualizar contexto carryover (dados que devem ser passados para próxima etapa)
 */
export function updateContextCarryover(data: any, cwd: string = process.cwd()): void {
	const context = loadOrCreateContext(undefined, cwd);
	context.executionState.contextCarryover = {
		...context.executionState.contextCarryover,
		...data,
	};
	saveContext(context, cwd);
}

/**
 * NOVO: Resetar estado de execução (para nova tarefa)
 */
export function resetExecutionState(cwd: string = process.cwd()): void {
	const context = loadOrCreateContext(undefined, cwd);
	context.executionState = createEmptyExecutionState();
	context.intermediateResults = new Map();
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
		const icon = node.type === 'folder' ? '📁' : '📄';
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
