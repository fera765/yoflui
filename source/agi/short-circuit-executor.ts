/**
 * SHORT-CIRCUIT EXECUTOR
 * 
 * Detecta comandos SIMPLES e DIRETOS e executa IMEDIATAMENTE,
 * pulando o ciclo AGI completo para máxima eficiência e precisão.
 * 
 * Use cases:
 * - "Crie um arquivo X com conteúdo Y" → Executa write_file diretamente
 * - "Liste arquivos .json" → Executa find_files diretamente
 * - "Leia arquivo X" → Executa read_file diretamente
 * 
 * Isso garante que detalhes específicos (nomes, conteúdos) sejam PRESERVADOS.
 */

import { writeFile, readdir } from 'fs/promises';
import { join } from 'path';

export interface ShortCircuitResult {
	handled: boolean;
	result?: string;
	toolUsed?: string;
}

export class ShortCircuitExecutor {
	/**
	 * Tentar executar comando diretamente se for simples e direto
	 */
	async tryShortCircuit(userPrompt: string, workDir: string): Promise<ShortCircuitResult> {
		// 1. CRIAR ARQUIVO
		const createFileMatch = this.matchCreateFile(userPrompt);
		if (createFileMatch) {
			try {
				const fullPath = join(workDir, createFileMatch.filename);
				await writeFile(fullPath, createFileMatch.content, 'utf-8');
				return {
					handled: true,
					result: `✅ Arquivo ${createFileMatch.filename} criado com sucesso!\n\nConteúdo:\n${createFileMatch.content}`,
					toolUsed: 'write_file (short-circuit)',
				};
			} catch (error) {
				return {
					handled: false,
				};
			}
		}

		// 2. LISTAR ARQUIVOS (padrão específico)
		const listFilesMatch = this.matchListFiles(userPrompt);
		if (listFilesMatch) {
			try {
				const files = await readdir(workDir);
				const filtered = files.filter(f => f.endsWith(listFilesMatch.extension));
				return {
					handled: true,
					result: `✅ Encontrados ${filtered.length} arquivo(s) ${listFilesMatch.extension}:\n\n${filtered.map(f => `- ${f}`).join('\n')}`,
					toolUsed: 'find_files (short-circuit)',
				};
			} catch (error) {
				return {
					handled: false,
				};
			}
		}

		// 3. ANÁLISE DE PACKAGE.JSON (dependências)
		const packageAnalysis = this.matchPackageAnalysis(userPrompt);
		if (packageAnalysis) {
			try {
				const { readFile } = await import('fs/promises');
				const pkgPath = join(workDir, 'package.json');
				const pkgContent = await readFile(pkgPath, 'utf-8');
				const pkg = JSON.parse(pkgContent);
				
				if (packageAnalysis.type === 'dependencies') {
					const depCount = Object.keys(pkg.dependencies || {}).length;
					const devDepCount = Object.keys(pkg.devDependencies || {}).length;
					return {
						handled: true,
						result: `✅ Análise de package.json:\n\n**Dependências de Produção:** ${depCount}\n**Dependências de Desenvolvimento:** ${devDepCount}\n**Total:** ${depCount + devDepCount}`,
						toolUsed: 'read_file + analysis (short-circuit)',
					};
				}
			} catch (error) {
				return {
					handled: false,
				};
			}
		}

		// Não detectou comando short-circuit
		return {
			handled: false,
		};
	}

	/**
	 * Detectar comando "Crie arquivo X com conteúdo Y"
	 */
	private matchCreateFile(prompt: string): { filename: string; content: string } | null {
		// Padrões para detectar criação de arquivo (MUITO FLEXÍVEIS)
		const patterns = [
			// "Crie um arquivo chamado X contendo Y" (mais flexível - aceita qualquer espaço)
			/(?:crie|criar|create)\s+(?:um\s+)?arquivo\s+(?:chamado\s+)?([^\s]+)\s+(?:contendo|containing)\s+(.+)/i,
			// "Crie arquivo X com Y"
			/(?:crie|criar|create)\s+(?:um\s+)?arquivo\s+([^\s]+)\s+com\s+(?:o\s+)?(?:conteúdo|texto|text)?\s*(.+)/i,
			// "Criar X contendo Y" (para extensões específicas)
			/(?:crie|criar|create)\s+([^\s]+\.txt|[^\s]+\.json|[^\s]+\.md)\s+(?:contendo|with|containing)\s+(.+)/i,
		];

		for (const pattern of patterns) {
			const match = prompt.match(pattern);
			if (match) {
				// Limpar o conteúdo de prefixos comuns
				let content = match[2].trim();
				// Remover "o texto:", "o texto ", "the text:", etc
				content = content.replace(/^(?:o\s+texto\s*:\s*|the\s+text\s*:\s*)/i, '');
				
				return {
					filename: match[1].trim(),
					content: content.trim(),
				};
			}
		}

		return null;
	}

	/**
	 * Detectar comando "Liste arquivos .ext"
	 */
	private matchListFiles(prompt: string): { extension: string } | null {
		// Padrões para listar arquivos
		const patterns = [
			/(?:liste|list|listar)\s+(?:quantos\s+)?arquivos?\s+(\.[\w]+)/i,
			/(?:liste|list|listar)\s+(?:os\s+)?arquivos?\s+(\.[\w]+)/i,
			/quantos\s+arquivos?\s+(\.[\w]+)/i,
		];

		for (const pattern of patterns) {
			const match = prompt.match(pattern);
			if (match) {
				return {
					extension: match[1],
				};
			}
		}

		return null;
	}

	/**
	 * Detectar análise de package.json
	 */
	private matchPackageAnalysis(prompt: string): { type: string } | null {
		const lower = prompt.toLowerCase();
		
		// Detectar análise de dependências
		if ((lower.includes('dependência') || lower.includes('dependencies')) && 
		    lower.includes('package.json')) {
			return {
				type: 'dependencies',
			};
		}

		if ((lower.includes('quantas') || lower.includes('how many')) && 
		    lower.includes('package.json')) {
			return {
				type: 'dependencies',
			};
		}

		return null;
	}
}
