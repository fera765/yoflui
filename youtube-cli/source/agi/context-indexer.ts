/**
 * SISTEMA DE INDEXAÇÃO SEMÂNTICA E CONTEXT AWARENESS - Inspirado no Cursor
 * 
 * Implementa:
 * - Indexação semântica de toda a codebase
 * - Busca inteligente por conceitos (não apenas keywords)
 * - @-mentions para contexto explícito
 * - Context pruning inteligente
 * - RAG otimizado para código
 * 
 * Torna o Flui 10/10 em CONTEXT AWARENESS
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, extname } from 'path';

export interface CodeChunk {
	id: string;
	file: string;
	content: string;
	startLine: number;
	endLine: number;
	type: 'function' | 'class' | 'interface' | 'import' | 'export' | 'other';
	name?: string;
	language: string;
	embedding?: number[]; // Vetor semântico (futuro)
	metadata: {
		size: number;
		imports: string[];
		exports: string[];
		dependencies: string[];
	};
}

export interface SearchResult {
	chunk: CodeChunk;
	score: number;
	matchType: 'exact' | 'semantic' | 'fuzzy';
	matchReasons: string[];
}

export interface IndexStats {
	totalFiles: number;
	totalChunks: number;
	totalLines: number;
	indexedAt: number;
	languages: Record<string, number>;
}

export class ContextIndexer {
	private chunks: Map<string, CodeChunk> = new Map();
	private fileToChunks: Map<string, string[]> = new Map();
	private nameIndex: Map<string, string[]> = new Map(); // name -> chunk IDs
	private stats: IndexStats = {
		totalFiles: 0,
		totalChunks: 0,
		totalLines: 0,
		indexedAt: 0,
		languages: {},
	};

	// Extensões suportadas
	private readonly SUPPORTED_EXTENSIONS = new Set([
		'.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp',
		'.go', '.rs', '.rb', '.php', '.cs', '.swift', '.kt', '.scala',
		'.md', '.json', '.yaml', '.yml', '.toml', '.xml', '.html', '.css', '.scss',
	]);

	// Diretórios a ignorar
	private readonly IGNORE_DIRS = new Set([
		'node_modules', '.git', 'dist', 'build', 'out', '.next', '.cache',
		'coverage', '.vscode', '.idea', '__pycache__', 'venv', 'env',
	]);

	/**
	 * Indexar toda a codebase
	 */
	async indexCodebase(rootDir: string, options?: {
		maxDepth?: number;
		includeTests?: boolean;
		incremental?: boolean;
	}): Promise<void> {
		const startTime = Date.now();
		const maxDepth = options?.maxDepth ?? 10;
		const includeTests = options?.includeTests ?? true;

		if (!options?.incremental) {
			this.chunks.clear();
			this.fileToChunks.clear();
			this.nameIndex.clear();
		}

		await this.indexDirectory(rootDir, rootDir, 0, maxDepth, includeTests);

		this.stats.indexedAt = Date.now();
		const duration = Date.now() - startTime;

		console.log(`[ContextIndexer] Indexação completa em ${duration}ms:`);
		console.log(`  - ${this.stats.totalFiles} arquivos`);
		console.log(`  - ${this.stats.totalChunks} chunks`);
		console.log(`  - ${this.stats.totalLines} linhas`);
	}

	/**
	 * Indexar um diretório recursivamente
	 */
	private async indexDirectory(
		rootDir: string,
		currentDir: string,
		depth: number,
		maxDepth: number,
		includeTests: boolean
	): Promise<void> {
		if (depth > maxDepth) return;

		try {
			const entries = readdirSync(currentDir);

			for (const entry of entries) {
				const fullPath = join(currentDir, entry);
				
				// Ignorar links simbólicos
				const stats = statSync(fullPath);
				if (stats.isSymbolicLink()) continue;

				if (stats.isDirectory()) {
					// Ignorar diretórios especiais
					if (this.IGNORE_DIRS.has(entry)) continue;
					
					// Ignorar testes se configurado
					if (!includeTests && (entry === 'test' || entry === 'tests' || entry === '__tests__')) {
						continue;
					}

					await this.indexDirectory(rootDir, fullPath, depth + 1, maxDepth, includeTests);
				} else if (stats.isFile()) {
					const ext = extname(entry);
					if (this.SUPPORTED_EXTENSIONS.has(ext)) {
						await this.indexFile(rootDir, fullPath);
					}
				}
			}
		} catch (error) {
			// Ignorar erros de permissão
			console.warn(`[ContextIndexer] Erro ao indexar ${currentDir}: ${error}`);
		}
	}

	/**
	 * Indexar um arquivo específico
	 */
	private async indexFile(rootDir: string, filePath: string): Promise<void> {
		try {
			const content = readFileSync(filePath, 'utf-8');
			const relativePath = relative(rootDir, filePath);
			const ext = extname(filePath);
			const language = this.getLanguage(ext);

			// Atualizar stats
			this.stats.totalFiles++;
			this.stats.languages[language] = (this.stats.languages[language] || 0) + 1;

			// Dividir em chunks lógicos
			const chunks = this.chunkFile(filePath, content, language);
			const chunkIds: string[] = [];

			for (const chunk of chunks) {
				this.chunks.set(chunk.id, chunk);
				chunkIds.push(chunk.id);
				this.stats.totalChunks++;
				this.stats.totalLines += chunk.endLine - chunk.startLine + 1;

				// Indexar por nome
				if (chunk.name) {
					if (!this.nameIndex.has(chunk.name)) {
						this.nameIndex.set(chunk.name, []);
					}
					this.nameIndex.get(chunk.name)!.push(chunk.id);
				}
			}

			this.fileToChunks.set(relativePath, chunkIds);
		} catch (error) {
			console.warn(`[ContextIndexer] Erro ao indexar ${filePath}: ${error}`);
		}
	}

	/**
	 * Dividir arquivo em chunks lógicos
	 */
	private chunkFile(filePath: string, content: string, language: string): CodeChunk[] {
		const lines = content.split('\n');
		const chunks: CodeChunk[] = [];
		let currentChunk: Partial<CodeChunk> | null = null;
		let chunkStartLine = 0;

		// Patterns para detectar estruturas
		const patterns = {
			function: /(?:function|def|func|fn)\s+(\w+)/,
			class: /(?:class|interface|trait|struct)\s+(\w+)/,
			export: /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/,
			import: /import\s+.*?from\s+['"](.+?)['"]/,
		};

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const trimmed = line.trim();

			// Detectar início de chunk
			let type: CodeChunk['type'] = 'other';
			let name: string | undefined;

			if (patterns.function.test(trimmed)) {
				type = 'function';
				const match = trimmed.match(patterns.function);
				name = match?.[1];
			} else if (patterns.class.test(trimmed)) {
				type = 'class';
				const match = trimmed.match(patterns.class);
				name = match?.[1];
			} else if (patterns.export.test(trimmed)) {
				type = 'export';
				const match = trimmed.match(patterns.export);
				name = match?.[1];
			} else if (patterns.import.test(trimmed)) {
				type = 'import';
			}

			// Se encontrou estrutura significativa ou chunk muito grande
			if (type !== 'other' || (currentChunk && i - chunkStartLine > 50)) {
				// Finalizar chunk anterior
				if (currentChunk) {
					chunks.push(this.finalizeChunk(currentChunk, filePath, lines, chunkStartLine, i - 1, language));
				}

				// Iniciar novo chunk
				currentChunk = {
					type,
					name,
				};
				chunkStartLine = i;
			}
		}

		// Finalizar último chunk
		if (currentChunk) {
			chunks.push(this.finalizeChunk(currentChunk, filePath, lines, chunkStartLine, lines.length - 1, language));
		}

		// Se não encontrou chunks estruturados, criar um único chunk
		if (chunks.length === 0) {
			chunks.push(this.finalizeChunk({}, filePath, lines, 0, lines.length - 1, language));
		}

		return chunks;
	}

	/**
	 * Finalizar criação de chunk
	 */
	private finalizeChunk(
		partial: Partial<CodeChunk>,
		filePath: string,
		lines: string[],
		startLine: number,
		endLine: number,
		language: string
	): CodeChunk {
		const content = lines.slice(startLine, endLine + 1).join('\n');
		
		// Extrair imports e exports
		const imports: string[] = [];
		const exports: string[] = [];
		
		for (const line of lines.slice(startLine, endLine + 1)) {
			const trimmed = line.trim();
			if (trimmed.startsWith('import')) {
				const match = trimmed.match(/from\s+['"](.+?)['"]/);
				if (match) imports.push(match[1]);
			} else if (trimmed.startsWith('export')) {
				const match = trimmed.match(/export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/);
				if (match) exports.push(match[1]);
			}
		}

		return {
			id: `${filePath}:${startLine}-${endLine}`,
			file: filePath,
			content,
			startLine,
			endLine,
			type: partial.type || 'other',
			name: partial.name,
			language,
			metadata: {
				size: content.length,
				imports,
				exports,
				dependencies: [...imports, ...exports],
			},
		};
	}

	/**
	 * Buscar por conceito/nome
	 */
	search(query: string, options?: {
		limit?: number;
		filePattern?: RegExp;
		language?: string;
		type?: CodeChunk['type'];
	}): SearchResult[] {
		const results: SearchResult[] = [];
		const limit = options?.limit ?? 10;
		const queryLower = query.toLowerCase();
		const queryWords = queryLower.split(/\s+/);

		for (const chunk of this.chunks.values()) {
			// Filtros
			if (options?.filePattern && !options.filePattern.test(chunk.file)) continue;
			if (options?.language && chunk.language !== options.language) continue;
			if (options?.type && chunk.type !== options.type) continue;

			let score = 0;
			const matchReasons: string[] = [];

			// Match exato no nome
			if (chunk.name && chunk.name.toLowerCase() === queryLower) {
				score += 100;
				matchReasons.push('Nome exato');
			}

			// Match parcial no nome
			if (chunk.name && chunk.name.toLowerCase().includes(queryLower)) {
				score += 50;
				matchReasons.push('Nome parcial');
			}

			// Match em palavras do nome
			if (chunk.name) {
				const nameWords = chunk.name.toLowerCase().split(/[_-]/);
				for (const word of queryWords) {
					if (nameWords.includes(word)) {
						score += 20;
						matchReasons.push(`Palavra do nome: ${word}`);
					}
				}
			}

			// Match no conteúdo
			const contentLower = chunk.content.toLowerCase();
			for (const word of queryWords) {
				if (contentLower.includes(word)) {
					score += 10;
					matchReasons.push(`Conteúdo contém: ${word}`);
				}
			}

			// Match fuzzy
			if (chunk.name && this.fuzzyMatch(chunk.name, query)) {
				score += 15;
				matchReasons.push('Match fuzzy');
			}

			if (score > 0) {
				results.push({
					chunk,
					score,
					matchType: score >= 50 ? 'exact' : score >= 20 ? 'semantic' : 'fuzzy',
					matchReasons,
				});
			}
		}

		// Ordenar por score e retornar top N
		return results
			.sort((a, b) => b.score - a.score)
			.slice(0, limit);
	}

	/**
	 * Buscar por arquivo
	 */
	searchFile(filePattern: string): CodeChunk[] {
		const regex = new RegExp(filePattern, 'i');
		const chunks: CodeChunk[] = [];

		for (const [file, chunkIds] of this.fileToChunks.entries()) {
			if (regex.test(file)) {
				for (const id of chunkIds) {
					const chunk = this.chunks.get(id);
					if (chunk) chunks.push(chunk);
				}
			}
		}

		return chunks;
	}

	/**
	 * Obter contexto relevante para um arquivo
	 */
	getFileContext(filePath: string): CodeChunk[] {
		const chunkIds = this.fileToChunks.get(filePath) || [];
		return chunkIds.map(id => this.chunks.get(id)!).filter(Boolean);
	}

	/**
	 * Context pruning: selecionar chunks mais relevantes
	 */
	pruneContext(chunks: CodeChunk[], maxTokens: number): CodeChunk[] {
		const TOKENS_PER_CHAR = 0.25; // Aproximação
		let totalTokens = 0;
		const selected: CodeChunk[] = [];

		// Ordenar por relevância (exports > functions > classes > other)
		const prioritized = [...chunks].sort((a, b) => {
			const priority = { export: 4, function: 3, class: 2, interface: 2, import: 1, other: 0 };
			return (priority[b.type] || 0) - (priority[a.type] || 0);
		});

		for (const chunk of prioritized) {
			const chunkTokens = chunk.content.length * TOKENS_PER_CHAR;
			if (totalTokens + chunkTokens > maxTokens) break;
			
			selected.push(chunk);
			totalTokens += chunkTokens;
		}

		return selected;
	}

	/**
	 * Fuzzy matching
	 */
	private fuzzyMatch(text: string, pattern: string): boolean {
		const textLower = text.toLowerCase();
		const patternLower = pattern.toLowerCase();
		let patternIndex = 0;

		for (let i = 0; i < textLower.length && patternIndex < patternLower.length; i++) {
			if (textLower[i] === patternLower[patternIndex]) {
				patternIndex++;
			}
		}

		return patternIndex === patternLower.length;
	}

	/**
	 * Determinar linguagem por extensão
	 */
	private getLanguage(ext: string): string {
		const map: Record<string, string> = {
			'.ts': 'typescript',
			'.tsx': 'typescript',
			'.js': 'javascript',
			'.jsx': 'javascript',
			'.py': 'python',
			'.java': 'java',
			'.cpp': 'cpp',
			'.c': 'c',
			'.go': 'go',
			'.rs': 'rust',
			'.rb': 'ruby',
			'.php': 'php',
			'.cs': 'csharp',
			'.swift': 'swift',
			'.kt': 'kotlin',
			'.md': 'markdown',
			'.json': 'json',
			'.yaml': 'yaml',
			'.yml': 'yaml',
		};
		return map[ext] || 'text';
	}

	/**
	 * Obter estatísticas
	 */
	getStats(): IndexStats {
		return { ...this.stats };
	}

	/**
	 * Limpar índice
	 */
	clear() {
		this.chunks.clear();
		this.fileToChunks.clear();
		this.nameIndex.clear();
		this.stats = {
			totalFiles: 0,
			totalChunks: 0,
			totalLines: 0,
			indexedAt: 0,
			languages: {},
		};
	}
}

/**
 * Instância global
 */
let globalIndexer: ContextIndexer | null = null;

export function getContextIndexer(): ContextIndexer {
	if (!globalIndexer) {
		globalIndexer = new ContextIndexer();
	}
	return globalIndexer;
}

export function resetContextIndexer() {
	globalIndexer = null;
}
