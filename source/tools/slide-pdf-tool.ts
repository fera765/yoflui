/**
 * SLIDE PDF TOOL DEFINITION AND EXECUTION
 * Tool para criar slides elegantes e converter para PDF/PowerPoint
 */

import { SlidePDFGenerator, SlidePDFOptions, SlideConfig } from './slide-pdf.js';
import { getConfig } from '../llm-config.js';
import { loadQwenCredentials, getValidAccessToken } from '../qwen-oauth.js';
import OpenAI from 'openai';
import { join } from 'path';

let slideGenerator: SlidePDFGenerator | null = null;

async function getSlideGenerator(): Promise<SlidePDFGenerator> {
	if (!slideGenerator) {
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
		slideGenerator = new SlidePDFGenerator(openai);
	}
	return slideGenerator;
}

/**
 * TOOL DEFINITION: slide_pdf
 */
export const slidePDFToolDefinition = {
	type: 'function' as const,
	function: {
		name: 'slide_pdf',
		description: 'Cria slides elegantes usando HTML e converte para PDF ou PowerPoint. Mantém consistência visual entre todas as páginas.',
		parameters: {
			type: 'object',
			properties: {
				title: {
					type: 'string',
					description: 'Título do documento/presentação'
				},
				slides: {
					type: 'array',
					description: 'Array de objetos slide com title, subtitle, content, etc',
					items: {
						type: 'object',
						properties: {
							title: { type: 'string' },
							subtitle: { type: 'string' },
							content: { type: 'string' },
							slideNumber: { type: 'number' },
							totalSlides: { type: 'number' },
							layout: {
								type: 'string',
								enum: ['title', 'content', 'image-content', 'split', 'quote']
							},
							imageUrl: { type: 'string' }
						},
						required: ['title', 'content']
					}
				},
				outputFormat: {
					type: 'string',
					enum: ['pdf', 'pptx', 'both'],
					description: 'Formato de saída desejado'
				},
				outputPath: {
					type: 'string',
					description: 'Caminho onde salvar o arquivo (sem extensão, será adicionada automaticamente)'
				},
				theme: {
					type: 'object',
					description: 'Tema visual (cores, fontes)',
					properties: {
						primaryColor: { type: 'string' },
						secondaryColor: { type: 'string' },
						backgroundColor: { type: 'string' },
						textColor: { type: 'string' },
						fontFamily: { type: 'string' }
					}
				}
			},
			required: ['title', 'slides', 'outputFormat', 'outputPath']
		}
	}
};

/**
 * EXECUTAR TOOL slide_pdf
 */
export async function executeSlidePDFTool(
	args: {
		title: string;
		slides: any[];
		outputFormat: 'pdf' | 'pptx' | 'both';
		outputPath: string;
		theme?: any;
	},
	workDir: string
): Promise<any> {
	try {
		// Inicializar gerador
		const generator = await getSlideGenerator();
		
		// Se os slides têm conteúdo placeholder, gerar conteúdo real usando LLM
		const slidesConfig: SlideConfig[] = [];
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
		
		// Gerar conteúdo real para cada slide se necessário
		console.log(`[slide_pdf] Gerando conteúdo para ${args.slides.length} slides...`);
		for (let i = 0; i < args.slides.length; i++) {
			const slide = args.slides[i];
			let title = slide.title;
			let content = slide.content;
			
			// Se conteúdo é placeholder, gerar conteúdo real
			if (content.includes('será gerado pelo LLM') || content.length < 50) {
				console.log(`[slide_pdf] Gerando conteúdo para slide ${i + 1}/${args.slides.length}...`);
				const contentPrompt = `Você é um especialista em design e criação de conteúdo para slides/ebooks. Sua tarefa é retornar APENAS o código HTML (sem tags <html> ou <body>) para o corpo do slide, utilizando classes Tailwind CSS e ícones Font Awesome para um design elegante e profissional. O design deve ser consistente com o tema escuro.

TÍTULO DO EBOOK: ${args.title}
PÁGINA: ${i + 1} de ${args.slides.length}
TÍTULO DA PÁGINA: ${title}

Crie conteúdo relevante e valioso para esta página do ebook. O conteúdo deve:
- Ser educativo e prático. O conteúdo deve ser formatado em HTML elegante, utilizando classes Tailwind (ex: <p class="text-lg">, <div class="flex items-center">) e ícones Font Awesome (ex: <i class="fas fa-check text-green-400"></i>).
- Ter entre 100-200 palavras (conciso para slide)
- Ser específico e acionável
- Manter tom profissional mas acessível
- Focar no tema principal do documento.

	Retorne APENAS o código HTML do corpo do slide. O conteúdo deve ser denso e ocupar o máximo de espaço possível no slide. **NÃO inclua o título da página no HTML gerado.**`;

				try {
						const response = await openai.chat.completions.create({
						model: config.model || 'gpt-4',
						messages: [{ role: 'user', content: contentPrompt }],
						temperature: 0.7,
						max_tokens: 300
					});
							content = response.choices[0]?.message?.content || content;
							// Limpar code blocks de markdown que a LLM insiste em adicionar
							content = content.replace(/```html\n|```/g, '').trim();
					console.log(`[slide_pdf] Conteúdo gerado para slide ${i + 1} (${content.length} caracteres)`);
				} catch (error) {
					console.error(`[slide_pdf] Erro ao gerar conteúdo para slide ${i + 1}:`, error);
					// Usar conteúdo padrão se falhar
					content = `Conteúdo sobre ${title} relacionado a emagrecimento saudável e prático.`;
				}
			}
			
			slidesConfig.push({
				title: title,
				subtitle: slide.subtitle,
				content: content,
				slideNumber: slide.slideNumber || i + 1,
				totalSlides: args.slides.length,
				layout: slide.layout || (i === 0 ? 'title' : 'content'),
				imageUrl: slide.imageUrl,
				theme: slide.theme
			});
		}
		
		// Preparar opções
		const options: SlidePDFOptions = {
			slides: slidesConfig,
			outputFormat: args.outputFormat,
			outputPath: join(workDir, args.outputPath),
			theme: args.theme,
			title: args.title
		};
		
		// Gerar slides HTML
		const htmlSlides = await generator.generateSlides(options);
		
		// Salvar HTMLs individuais
		const htmlDir = join(workDir, 'work', 'slides', args.title.replace(/[^a-z0-9]/gi, '_'));
		const htmlPaths = await generator.saveSlidesAsHTML(htmlSlides, htmlDir);
		
		const results: any = {
			success: true,
			htmlSlides: htmlPaths.length,
			files: []
		};
		
		// Converter conforme formato solicitado
		if (args.outputFormat === 'pdf' || args.outputFormat === 'both') {
			try {
				console.log(`[slide_pdf] Convertendo para PDF...`);
				const pdfPath = await generator.convertToPDF(htmlSlides, `${options.outputPath}.pdf`);
				console.log(`[slide_pdf] PDF criado: ${pdfPath}`);
				results.files.push({ type: 'pdf', path: pdfPath });
			} catch (error) {
				console.error(`[slide_pdf] Erro ao converter para PDF:`, error);
				results.pdfError = error instanceof Error ? error.message : String(error);
			}
		}
		
		if (args.outputFormat === 'pptx' || args.outputFormat === 'both') {
			try {
				console.log(`[slide_pdf] Convertendo para PowerPoint...`);
				const pptxPath = await generator.convertToPowerPoint(htmlSlides, `${options.outputPath}.pptx`);
				console.log(`[slide_pdf] PowerPoint criado: ${pptxPath}`);
				results.files.push({ type: 'pptx', path: pptxPath });
			} catch (error) {
				console.error(`[slide_pdf] Erro ao converter para PowerPoint:`, error);
				results.pptxError = error instanceof Error ? error.message : String(error);
			}
		}
		
		results.message = `Slides criados com sucesso! ${htmlSlides.length} slides gerados.`;
		
		return results;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error)
		};
	}
}
