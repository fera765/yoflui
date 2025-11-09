/**
 * Sistema de logging aprimorado para Flui
 * Fornece logs detalhados e estruturados para debugging
 */

import { writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	category: string;
	message: string;
	data?: any;
}

class EnhancedLogger {
	private logFile: string;
	private enabled: boolean = true;
	private minLevel: LogLevel = 'debug';
	
	constructor() {
		const logDir = join(process.cwd(), '.flui', 'logs');
		if (!existsSync(logDir)) {
			mkdirSync(logDir, { recursive: true });
		}
		
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		this.logFile = join(logDir, `flui-${timestamp}.log`);
	}
	
	private shouldLog(level: LogLevel): boolean {
		if (!this.enabled) return false;
		
		const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical'];
		const currentIndex = levels.indexOf(level);
		const minIndex = levels.indexOf(this.minLevel);
		
		return currentIndex >= minIndex;
	}
	
	private formatLog(entry: LogEntry): string {
		const dataStr = entry.data ? `\n${JSON.stringify(entry.data, null, 2)}` : '';
		return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}${dataStr}\n`;
	}
	
	private writeLog(entry: LogEntry): void {
		if (!this.shouldLog(entry.level)) return;
		
		const formatted = this.formatLog(entry);
		
		// Console output com cores
		const colors = {
			debug: '\x1b[36m',    // Cyan
			info: '\x1b[32m',     // Green
			warn: '\x1b[33m',     // Yellow
			error: '\x1b[31m',    // Red
			critical: '\x1b[35m'  // Magenta
		};
		const reset = '\x1b[0m';
		
		console.log(`${colors[entry.level]}${formatted.trim()}${reset}`);
		
		// File output
		try {
			appendFileSync(this.logFile, formatted, 'utf-8');
		} catch (error) {
			// Silent fail para evitar loops
		}
	}
	
	debug(category: string, message: string, data?: any): void {
		this.writeLog({
			timestamp: new Date().toISOString(),
			level: 'debug',
			category,
			message,
			data
		});
	}
	
	info(category: string, message: string, data?: any): void {
		this.writeLog({
			timestamp: new Date().toISOString(),
			level: 'info',
			category,
			message,
			data
		});
	}
	
	warn(category: string, message: string, data?: any): void {
		this.writeLog({
			timestamp: new Date().toISOString(),
			level: 'warn',
			category,
			message,
			data
		});
	}
	
	error(category: string, message: string, data?: any): void {
		this.writeLog({
			timestamp: new Date().toISOString(),
			level: 'error',
			category,
			message,
			data
		});
	}
	
	critical(category: string, message: string, data?: any): void {
		this.writeLog({
			timestamp: new Date().toISOString(),
			level: 'critical',
			category,
			message,
			data
		});
	}
	
	// Métodos específicos para operações comuns
	
	fileOperation(operation: string, path: string, success: boolean, details?: any): void {
		this.info('FILE_OPS', `${operation}: ${path}`, {
			success,
			...details
		});
	}
	
	toolExecution(toolName: string, args: any, result: string, duration?: number): void {
		this.debug('TOOL_EXEC', `Executed ${toolName}`, {
			args,
			result: result.substring(0, 200),
			duration
		});
	}
	
	taskProgress(taskId: string, status: string, details?: any): void {
		this.info('TASK', `Task ${taskId}: ${status}`, details);
	}
	
	validation(type: string, passed: boolean, reason?: string): void {
		const level = passed ? 'info' : 'warn';
		this.writeLog({
			timestamp: new Date().toISOString(),
			level,
			category: 'VALIDATION',
			message: `${type}: ${passed ? 'PASSED' : 'FAILED'}`,
			data: { reason }
		});
	}
	
	setMinLevel(level: LogLevel): void {
		this.minLevel = level;
	}
	
	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
	}
	
	getLogFile(): string {
		return this.logFile;
	}
}

// Singleton instance
export const enhancedLogger = new EnhancedLogger();
