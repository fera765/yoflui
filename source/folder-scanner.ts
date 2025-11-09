import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { FolderNode } from './context-manager.js';

const IGNORE_PATTERNS = [
	'.git',
	'node_modules',
	'.flui',
	'dist',
	'build',
	'.next',
	'__pycache__',
	'.pytest_cache',
	'venv',
	'.venv',
	'target',
	'.cargo',
	'.idea',
	'.vscode',
	'.DS_Store',
];

const MAX_FILES_PER_DIR = 100;
const MAX_DEPTH = 4;

/**
 * Scan folder structure recursively (names only, no file content)
 */
export function scanFolderStructure(
	dirPath: string,
	depth: number = 0,
	relativePath: string = '.'
): FolderNode[] {
	if (depth >= MAX_DEPTH) {
		return [];
	}
	
	const nodes: FolderNode[] = [];
	
	try {
		const entries = readdirSync(dirPath);
		let fileCount = 0;
		
		for (const entry of entries) {
			// Skip ignored patterns
			if (IGNORE_PATTERNS.includes(entry)) {
				continue;
			}
			
			// Skip hidden files/folders (except at root level)
			if (depth > 0 && entry.startsWith('.')) {
				continue;
			}
			
			// Limit files per directory
			if (fileCount >= MAX_FILES_PER_DIR) {
				break;
			}
			
			const fullPath = join(dirPath, entry);
			const relPath = join(relativePath, entry);
			
			try {
				const stats = statSync(fullPath);
				
				if (stats.isDirectory()) {
					const children = scanFolderStructure(fullPath, depth + 1, relPath);
					nodes.push({
						name: entry,
						type: 'folder',
						path: relPath,
						children,
					});
				} else if (stats.isFile()) {
					nodes.push({
						name: entry,
						type: 'file',
						path: relPath,
					});
					fileCount++;
				}
			} catch (err) {
				// Skip files/folders we can't access
				continue;
			}
		}
	} catch (error) {
		// Can't read directory, return empty
		return [];
	}
	
	// Sort: folders first, then files
	return nodes.sort((a, b) => {
		if (a.type === b.type) {
			return a.name.localeCompare(b.name);
		}
		return a.type === 'folder' ? -1 : 1;
	});
}

/**
 * Get quick folder summary
 */
export function getFolderSummary(dirPath: string): {
	totalFiles: number;
	totalFolders: number;
	fileTypes: Record<string, number>;
} {
	const summary = {
		totalFiles: 0,
		totalFolders: 0,
		fileTypes: {} as Record<string, number>,
	};
	
	const structure = scanFolderStructure(dirPath);
	
	function countNodes(nodes: FolderNode[]) {
		for (const node of nodes) {
			if (node.type === 'folder') {
				summary.totalFolders++;
				if (node.children) {
					countNodes(node.children);
				}
			} else {
				summary.totalFiles++;
				const ext = node.name.includes('.') 
					? node.name.split('.').pop()?.toLowerCase() || 'none'
					: 'none';
				summary.fileTypes[ext] = (summary.fileTypes[ext] || 0) + 1;
			}
		}
	}
	
	countNodes(structure);
	
	return summary;
}
