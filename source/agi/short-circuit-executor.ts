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
		// CRÍTICO: Detectar campanha de marketing e usar ferramenta diretamente
		const marketingMatch = this.matchMarketingCampaign(userPrompt);
		if (marketingMatch) {
			try {
				const { executeMarketingTool, initializeMarketingTools } = await import('../marketing/marketing-tools.js');
				const { getConfig } = await import('../llm-config.js');
				const { loadQwenCredentials, getValidAccessToken } = await import('../qwen-oauth.js');
				const OpenAI = (await import('openai')).default;
				
				const config = getConfig();
				const qwenCreds = loadQwenCredentials();
				let endpoint = config.endpoint;
				let apiKey = config.apiKey || 'not-needed';
				
				if (qwenCreds?.access_token) {
					const validToken = await getValidAccessToken();
					if (validToken) {
						apiKey = validToken;
						const resourceUrl = qwenCreds.resource_url || 'portal.qwen.ai';
						endpoint = `https://${resourceUrl}/v1`;
					}
				}
				
				const openai = new OpenAI({ baseURL: endpoint, apiKey });
				initializeMarketingTools(openai);
				
				const result = await executeMarketingTool('generate_marketing_campaign', marketingMatch, workDir);
				
				return {
					handled: true,
					toolUsed: 'generate_marketing_campaign',
					result: JSON.stringify(result, null, 2)
				};
			} catch (error) {
				console.error('[ShortCircuit] Erro ao executar campanha de marketing:', error);
				// Se falhar, deixar orquestração normal tratar
				return { handled: false };
			}
		}
		
		// CRÍTICO: Detectar slide_pdf e usar ferramenta diretamente
		const slidePDFMatch = this.matchSlidePDF(userPrompt);
		if (slidePDFMatch) {
			try {
				console.log('[ShortCircuit] slide_pdf detectado:', slidePDFMatch.title, slidePDFMatch.slides.length, 'slides');
				const { executeSlidePDFTool } = await import('../tools/slide-pdf-tool.js');
				const result = await executeSlidePDFTool(slidePDFMatch, workDir);
				
				return {
					handled: true,
					toolUsed: 'slide_pdf',
					result: JSON.stringify(result, null, 2)
				};
			} catch (error) {
				console.error('[ShortCircuit] Erro ao executar slide_pdf:', error);
				return { handled: false };
			}
		}
		
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
	/**
	 * Detectar e extrair parâmetros de campanha de marketing
	 */
	private matchMarketingCampaign(prompt: string): any | null {
		const lowerPrompt = prompt.toLowerCase();
		
		// Verificar se é tarefa de campanha de marketing
		if (!/campanha.*marketing|marketing.*campaign|criar.*campanha/i.test(lowerPrompt)) {
			return null;
		}
		
		// Extrair parâmetros do prompt
		const productMatch = prompt.match(/produto[:\s]+['"]([^'"]+)['"]|produto[:\s]+([^\n,]+)/i);
		const audienceMatch = prompt.match(/público-alvo[:\s]+([^\n,]+)|target.*audience[:\s]+([^\n,]+)/i);
		const objectiveMatch = prompt.match(/objetivo[:\s]+(awareness|conversion|engagement|education|conversão|engajamento|educação|conscientização)/i);
		const toneMatch = prompt.match(/tom[:\s]+(professional|casual|funny|inspirational|urgent|profissional|casual|engraçado|inspirador|urgente)/i);
		const messagesMatch = prompt.match(/mensagens-chave[:\s]+([^\n]+)|key.*messages[:\s]+([^\n]+)/i);
		const ctaMatch = prompt.match(/cta[:\s]+([^\n,]+)/i);
		
		if (!productMatch || !audienceMatch) {
			return null; // Parâmetros obrigatórios não encontrados
		}
		
		const product = (productMatch[1] || productMatch[2] || '').trim();
		const targetAudience = (audienceMatch[1] || audienceMatch[2] || '').trim();
		const objective = objectiveMatch ? (objectiveMatch[1] || objectiveMatch[2]).toLowerCase() : 'conversion';
		const tone = toneMatch ? (toneMatch[1] || toneMatch[2]).toLowerCase() : 'professional';
		
		// Normalizar objective
		let normalizedObjective: 'awareness' | 'conversion' | 'engagement' | 'education' = 'conversion';
		if (objective.includes('awareness') || objective.includes('conscientização')) normalizedObjective = 'awareness';
		else if (objective.includes('conversion') || objective.includes('conversão')) normalizedObjective = 'conversion';
		else if (objective.includes('engagement') || objective.includes('engajamento')) normalizedObjective = 'engagement';
		else if (objective.includes('education') || objective.includes('educação')) normalizedObjective = 'education';
		
		// Normalizar tone
		let normalizedTone: 'professional' | 'casual' | 'funny' | 'inspirational' | 'urgent' = 'professional';
		if (tone.includes('casual')) normalizedTone = 'casual';
		else if (tone.includes('funny') || tone.includes('engraçado')) normalizedTone = 'funny';
		else if (tone.includes('inspirational') || tone.includes('inspirador')) normalizedTone = 'inspirational';
		else if (tone.includes('urgent') || tone.includes('urgente')) normalizedTone = 'urgent';
		
		// Extrair mensagens-chave
		let keyMessages: string[] = [];
		if (messagesMatch) {
			const messagesText = (messagesMatch[1] || messagesMatch[2] || '').trim();
			keyMessages = messagesText.split(',').map(m => m.trim()).filter(m => m.length > 0);
		}
		
		const cta = ctaMatch ? ctaMatch[1].trim() : undefined;
		
		return {
			product,
			targetAudience,
			objective: normalizedObjective,
			tone: normalizedTone,
			keyMessages: keyMessages.length > 0 ? keyMessages : ['Automação total', 'Qualidade global'],
			cta
		};
	}

	/**
	 * Detectar e extrair parâmetros de slide_pdf
	 * IMPORTANTE: Ser preciso para não confundir ebook com slides
	 */
	private matchSlidePDF(prompt: string): any | null {
		const lowerPrompt = prompt.toLowerCase();
		
		// CORREÇÃO: Ser mais preciso - detectar EXPLICITAMENTE slides/powerpoint
		// NÃO confundir ebook simples com slide_pdf
		const hasExplicitSlideKeyword = /slide|powerpoint|pptx|apresentação|slide_pdf/i.test(lowerPrompt);
		const hasEbookKeyword = /ebook/i.test(lowerPrompt);
		const hasPDFKeyword = /pdf/i.test(lowerPrompt);
		
		// Se menciona ebook SEM mencionar slides/powerpoint, NÃO é short-circuit
		// Deixar orquestração normal tratar para gerar ebook completo
		if (hasEbookKeyword && !hasExplicitSlideKeyword) {
			return null; // Deixar para orquestração normal gerar ebook
		}
		
		// Só fazer short-circuit se for EXPLICITAMENTE slides/powerpoint
		if (!hasExplicitSlideKeyword && !(/slide.*pdf|slide_pdf/i.test(lowerPrompt))) {
			return null;
		}
		
		// Extrair informações do prompt
		const titleMatch = prompt.match(/ebook.*?de\s+([^com]+?)(?:\s+com|\s+usando|$)/i) || 
		                  prompt.match(/criar.*?(?:ebook|slide|apresentação).*?([^com]+?)(?:\s+com|\s+usando|$)/i) ||
		                  prompt.match(/(?:ebook|slide|apresentação).*?de\s+([^\s]+)/i);
		
		const pagesMatch = prompt.match(/(\d+)\s*(?:páginas?|pages?|slides?)/i);
		const formatMatch = prompt.match(/salve?\s+como\s+(pdf|pptx|powerpoint)/i);
		const themeMatch = prompt.match(/tema[:\s]+([^\.]+)/i);
		
		// CORREÇÃO: Validar que temos informações suficientes
		// Se menciona slide_pdf ou slide/pdf explicitamente, processar
		if (!titleMatch && !pagesMatch && !/slide.*pdf|slide_pdf|powerpoint|pptx/i.test(lowerPrompt)) {
			return null; // Informações insuficientes
		}
		
		// Extrair título
		let title = 'Ebook';
		if (titleMatch) {
			title = titleMatch[1].trim();
		} else if (lowerPrompt.includes('emagrecimento')) {
			title = 'Ebook de Emagrecimento';
		} else if (lowerPrompt.includes('low ticket')) {
			title = 'Ebook Low Ticket';
		}
		
		const pages = pagesMatch ? parseInt(pagesMatch[1]) : 20;
		const outputFormat = formatMatch ? (formatMatch[1].toLowerCase() === 'powerpoint' ? 'pptx' : formatMatch[1].toLowerCase()) : 'pdf';
		
		// Extrair tema de cores
		let theme: any = {};
		if (themeMatch) {
			const themeText = themeMatch[1].toLowerCase();
			if (themeText.includes('verde') || themeText.includes('green')) {
				theme = {
					primaryColor: '#22C55E', // Verde
					secondaryColor: '#FFFFFF',
					backgroundColor: '#000000',
					textColor: '#FFFFFF',
					fontFamily: 'SF Pro'
				};
			} else if (themeText.includes('branco') || themeText.includes('white')) {
				theme = {
					primaryColor: '#FFFFFF',
					secondaryColor: '#000000',
					backgroundColor: '#000000',
					textColor: '#FFFFFF',
					fontFamily: 'SF Pro'
				};
			}
		}
		
		// Se menciona verde e branco, usar tema verde
		if (lowerPrompt.includes('verde') && lowerPrompt.includes('branco')) {
			theme = {
				primaryColor: '#22C55E', // Verde
				secondaryColor: '#FFFFFF',
				backgroundColor: '#000000',
				textColor: '#FFFFFF',
				fontFamily: 'SF Pro'
			};
		}
		
		// Gerar slides básicos (o LLM vai criar o conteúdo depois)
		const slides: any[] = [];
		for (let i = 1; i <= pages; i++) {
			slides.push({
				title: i === 1 ? title : `Página ${i}`,
				content: `Conteúdo da página ${i} será gerado pelo LLM`,
				slideNumber: i,
				totalSlides: pages,
				layout: i === 1 ? 'title' : 'content'
			});
		}
		
		return {
			title: title,
			slides: slides,
			outputFormat: outputFormat,
			outputPath: `work/${title.replace(/[^a-z0-9]/gi, '_')}`,
			theme: theme
		};
	}

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
