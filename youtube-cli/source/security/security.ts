import { resolve, normalize, relative, isAbsolute } from 'path';
import { cwd } from 'process';

/**
 * Security module for file and shell operations
 * Ensures integrity and prevents dangerous operations
 */

// Blocked directories (package folders and system folders)
const BLOCKED_DIRECTORIES = [
	'node_modules',
	'vendor',
	'.git',
	'.vscode',
	'.idea',
	'__pycache__',
	'.pytest_cache',
	'.venv',
	'venv',
	'env',
	'.env',
	'build',
	'dist',
	'.next',
	'.nuxt',
	'.cache',
	'coverage',
	'.nyc_output',
	'target',
	'bin',
	'obj',
	'.vs',
	'.gradle',
	'.mvn',
	'jspm_packages',
	'bower_components',
	'.sass-cache',
	'.bundle',
	'.vagrant',
	'.terraform',
	'.serverless',
	'.sls',
];

// Blocked file patterns
const BLOCKED_FILE_PATTERNS = [
	/\.lock$/i,
	/package-lock\.json$/i,
	/yarn\.lock$/i,
	/\.env$/i,
	/\.pem$/i,
	/\.key$/i,
	/\.cert$/i,
	/id_rsa$/i,
	/id_dsa$/i,
];

// Dangerous shell commands/patterns
const DANGEROUS_COMMANDS = [
	/rm\s+-rf\s+[\/\\\\]/i,           // rm -rf /
	/rm\s+-rf\s+\.\./i,                // rm -rf ..
	/rm\s+-rf\s+~/i,                   // rm -rf ~
	/rm\s+-rf\s+\$HOME/i,              // rm -rf $HOME
	/format\s+/i,                      // format
	/mkfs\s+/i,                        // mkfs
	/dd\s+if=/i,                       // dd
	/fdisk\s+/i,                       // fdisk
	/parted\s+/i,                      // parted
	/chmod\s+\d+\s+[\/\\\\]/i,        // chmod [perms] /
	/chown\s+.*\s+[\/\\\\]/i,          // chown ... /
	/chattr\s+.*\s+[\/\\\\]/i,        // chattr ... /
	/systemctl\s+/i,                   // systemctl
	/service\s+/i,                     // service
	/shutdown/i,                       // shutdown
	/reboot/i,                         // reboot
	/halt/i,                           // halt
	/poweroff/i,                       // poweroff
	/init\s+[06]/i,                   // init 0/6
	/nohup.*rm\s+-rf/i,               // nohup rm -rf
	/wget.*\|\s*sh/i,                  // wget | sh
	/curl.*\|\s*sh/i,                  // curl | sh
	/eval\s+/i,                        // eval
	/exec\s+/i,                        // exec
	/>\s*\/dev\/sda/i,                 // > /dev/sda
	/>\s*\/dev\/hda/i,                 // > /dev/hda
];

// Commands that should not leave the current directory
const PATH_ESCAPE_PATTERNS = [
	/^\s*cd\s+\.\./i,                  // cd ..
	/^\s*cd\s+\//i,                    // cd /
	/^\s*cd\s+~/,                      // cd ~
	/\.\./g,                           // Parent directory in paths
	/^\s*\/\s*/,                       // Absolute path starting with /
	/^\s*~\s*/,                        // Home directory
	/\$\{HOME\}/i,                     // ${HOME}
	/\$HOME/i,                         // $HOME
];

/**
 * Get the workspace root directory
 */
function getWorkspaceRoot(): string {
	return cwd();
}

/**
 * Resolve and normalize a file path
 */
function resolvePath(filePath: string): string {
	const workspaceRoot = getWorkspaceRoot();
	
	// Handle relative paths
	if (!isAbsolute(filePath)) {
		return resolve(workspaceRoot, filePath);
	}
	
	// Check if absolute path is within workspace
	const normalized = normalize(filePath);
	const relativePath = relative(workspaceRoot, normalized);
	
	// If relative path starts with .., it's outside workspace
	if (relativePath.startsWith('..')) {
		throw new Error(`Path ${filePath} is outside workspace root`);
	}
	
	return normalized;
}

/**
 * Check if a path contains blocked directories
 */
function containsBlockedDirectory(filePath: string): boolean {
	const normalized = normalize(filePath);
	const parts = normalized.split(/[\/\\\\]/);
	
	for (const part of parts) {
		if (BLOCKED_DIRECTORIES.includes(part)) {
			return true;
		}
	}
	
	return false;
}

/**
 * Check if a file matches blocked patterns
 */
function matchesBlockedPattern(filePath: string): boolean {
	for (const pattern of BLOCKED_FILE_PATTERNS) {
		if (pattern.test(filePath)) {
			return true;
		}
	}
	return false;
}

/**
 * Validate file path for read/write operations
 */
export function validateFilePath(filePath: string): { valid: boolean; error?: string } {
	try {
		const resolved = resolvePath(filePath);
		
		// Check for blocked directories
		if (containsBlockedDirectory(resolved)) {
			return {
				valid: false,
				error: `Access denied: Path contains blocked directory (node_modules, vendor, .git, etc.)`,
			};
		}
		
		// Check for blocked file patterns
		if (matchesBlockedPattern(resolved)) {
			return {
				valid: false,
				error: `Access denied: File matches blocked pattern (lock files, .env, keys, etc.)`,
			};
		}
		
		// Ensure path is within workspace
		const workspaceRoot = getWorkspaceRoot();
		const relativePath = relative(workspaceRoot, resolved);
		
		if (relativePath.startsWith('..')) {
			return {
				valid: false,
				error: `Access denied: Path is outside workspace root`,
			};
		}
		
		return { valid: true };
	} catch (error) {
		return {
			valid: false,
			error: error instanceof Error ? error.message : 'Invalid path',
		};
	}
}

/**
 * Validate directory path for read operations
 */
export function validateDirectoryPath(dirPath: string): { valid: boolean; error?: string } {
	try {
		const resolved = resolvePath(dirPath);
		
		// Check for blocked directories
		if (containsBlockedDirectory(resolved)) {
			return {
				valid: false,
				error: `Access denied: Directory contains blocked folder (node_modules, vendor, .git, etc.)`,
			};
		}
		
		// Ensure path is within workspace
		const workspaceRoot = getWorkspaceRoot();
		const relativePath = relative(workspaceRoot, resolved);
		
		if (relativePath.startsWith('..')) {
			return {
				valid: false,
				error: `Access denied: Directory is outside workspace root`,
			};
		}
		
		return { valid: true };
	} catch (error) {
		return {
			valid: false,
			error: error instanceof Error ? error.message : 'Invalid directory path',
		};
	}
}

/**
 * Check if a shell command is dangerous
 */
function isDangerousCommand(command: string): boolean {
	const normalized = command.trim();
	
	for (const pattern of DANGEROUS_COMMANDS) {
		if (pattern.test(normalized)) {
			return true;
		}
	}
	
	return false;
}

/**
 * Check if a shell command tries to escape the workspace
 */
function triesToEscapeWorkspace(command: string): boolean {
	for (const pattern of PATH_ESCAPE_PATTERNS) {
		if (pattern.test(command)) {
			return true;
		}
	}
	
	return false;
}

/**
 * Validate shell command
 */
export function validateShellCommand(command: string): { valid: boolean; error?: string } {
	const normalized = command.trim();
	
	if (!normalized) {
		return {
			valid: false,
			error: 'Empty command',
		};
	}
	
	// Check for dangerous commands
	if (isDangerousCommand(normalized)) {
		return {
			valid: false,
			error: 'Command blocked: Dangerous operation detected (rm -rf /, format, shutdown, etc.)',
		};
	}
	
	// Check for path escape attempts
	if (triesToEscapeWorkspace(normalized)) {
		return {
			valid: false,
			error: 'Command blocked: Cannot execute commands outside workspace root (use of .., /, ~, $HOME is not allowed)',
		};
	}
	
	// Additional checks for specific dangerous patterns
	if (normalized.includes('|') && (normalized.includes('sh') || normalized.includes('bash'))) {
		// Check for pipe to shell
		if (normalized.match(/[|&]\s*(sh|bash|zsh|fish)\s*$/i)) {
			return {
				valid: false,
				error: 'Command blocked: Piping to shell is not allowed',
			};
		}
	}
	
	return { valid: true };
}

/**
 * Sanitize file path - resolves and normalizes but doesn't validate
 */
export function sanitizeFilePath(filePath: string): string {
	try {
		return resolvePath(filePath);
	} catch (error) {
		throw new Error(`Invalid file path: ${filePath}`);
	}
}

/**
 * Get safe working directory for shell commands
 */
export function getSafeWorkingDirectory(): string {
	return getWorkspaceRoot();
}
