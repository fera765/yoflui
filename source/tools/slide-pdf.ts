/**
 * SLIDE PDF TOOL
 * Cria slides elegantes usando HTML e converte para PDF/PowerPoint
 * Mantém consistência visual entre todas as páginas
 */

import OpenAI from 'openai';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { getConfig } from '../llm-config.js';
import { getValidAccessToken } from '../qwen-oauth.js';

export interface SlideConfig {
	title: string;
	subtitle?: string;
	content: string;
	slideNumber: number;
	totalSlides: number;
	theme?: {
		primaryColor?: string;
		secondaryColor?: string;
		backgroundColor?: string;
		textColor?: string;
		fontFamily?: string;
	};
	imageUrl?: string;
	layout?: 'title' | 'content' | 'image-content' | 'split' | 'quote';
}

export interface SlidePDFOptions {
	slides: SlideConfig[];
	outputFormat: 'pdf' | 'pptx' | 'both';
	outputPath: string;
	theme?: {
		primaryColor?: string;
		secondaryColor?: string;
		backgroundColor?: string;
		textColor?: string;
		fontFamily?: string;
	};
	title?: string;
}

export class SlidePDFGenerator {
	private openai: OpenAI;
	private defaultTheme = {
		primaryColor: '#4A90E2', // Azul vibrante para destaque
		secondaryColor: '#B0B0B0', // Cinza claro para texto secundário
		backgroundColor: '#1A202C', // Fundo escuro (Tailwind gray-900)
		textColor: '#E2E8F0', // Texto claro (Tailwind gray-200)
		fontFamily: 'SF Pro'
	};

	constructor(openai: OpenAI) {
		this.openai = openai;
	}

	/**
	 * GERAR SLIDE HTML INDIVIDUAL
	 */
	async generateSlideHTML(config: SlideConfig, globalTheme?: any): Promise<string> {
		const theme = { ...this.defaultTheme, ...globalTheme, ...config.theme };
		
		// Se já temos HTML gerado pelo LLM, usar template direto para consistência
		// Por enquanto, gerar usando template direto para garantir qualidade
		return this.createSlideHTMLTemplate(config, theme);
	}

	/**
	 * CRIAR TEMPLATE HTML BASE
	 */
		private createSlideHTMLTemplate(config: SlideConfig, theme: any, content?: string): string {
			// Se o conteúdo for gerado pela LLM, ele já é o HTML do body.
			const isLLMContent = content && !content.includes('será gerado pelo LLM');
			const finalContent = isLLMContent ? content : this.generateLayoutContent(config, theme);
		const imageStyle = config.imageUrl 
			? `<img src="${config.imageUrl}" alt="${config.title}" class="void-image">`
			: '';
		
			const layoutContent = finalContent;
		
		return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=SF+Pro:wght@300;400;600&display=swap');
      
      body {
        margin: 0;
        padding: 0;
        font-family: '${theme.fontFamily}', sans-serif;
      }
      
      .slide-container {
        width: 1280px;
        min-height: 720px;
        background: ${theme.backgroundColor};
        color: ${theme.textColor};
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        position: relative;
      }
      
      .title {
        font-family: 'Inter', sans-serif;
        font-size: 72px;
        font-weight: 700;
        margin-bottom: 20px;
        text-align: left;
        line-height: 1.2;
        color: ${theme.primaryColor};
      }
      
      .subtitle {
        font-family: 'Inter', sans-serif;
        font-size: 36px;
        font-weight: 300;
        margin-bottom: 60px;
        text-align: left;
        opacity: 0.8;
        color: ${theme.textColor};
      }
      
      .void-image {
        position: absolute;
       opacity: 1.0, // Imagem visível;
        z-index: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .content {
        position: relative;
        z-index: 1;
        padding: 40px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }
      
      .circle {
        width: 120px;
        height: 120px;
        border: 2px solid ${theme.primaryColor};
        border-radius: 50%;
        margin-bottom: 60px;
        opacity: 0.6;
      }
      
      .content-text {
        font-size: 28px;
        line-height: 1.8;
        max-width: 900px;
        text-align: left;
        color: ${theme.textColor};
      }
      
	      .slide-number {
	        position: absolute;
	        bottom: 20px;
	        right: 40px;
	        font-size: 18px;
	        opacity: 0.5;
	        color: ${theme.textColor};
	      }
    </style>
  </head>
  <body>
    <div class="slide-container">
      ${imageStyle}
      <div class="content">
        ${layoutContent}
      </div>
      <div class="slide-number">${config.slideNumber} / ${config.totalSlides}</div>
    </div>
  </body>
</html>`;
	}

	/**
	 * GERAR CONTEÚDO DO LAYOUT
	 */
	private generateLayoutContent(config: SlideConfig, theme: any): string {
		switch (config.layout) {
			case 'title':
				return `
        <div class="circle"></div>

		        ${config.subtitle ? `<h2 class="subtitle">${config.subtitle}</h2>` : ''}
      `;
			
			case 'content':
				return `

        <div class="content-text">${config.content}</div>
      `;
			
			case 'image-content':
				return `

        <div class="content-text" style="max-width: 800px;">${config.content}</div>
      `;
			
			case 'split':
				return `
        <div style="display: flex; width: 100%; gap: 40px;">
          <div style="flex: 1;">

          </div>
          <div style="flex: 1;" class="content-text" style="text-align: left;">
            ${config.content}
          </div>
        </div>
      `;
			
			case 'quote':
				return `
        <div class="content-text" style="font-size: 36px; font-style: italic; max-width: 900px;">
          "${config.content}"
        </div>
        ${config.title ? `<h2 class="subtitle" style="margin-top: 40px;">— ${config.title}</h2>` : ''}
      `;
			
			default:
				return `

	        ${config.subtitle ? `<h2 class="subtitle">${config.subtitle}</h2>` : ''}
			        ${config.content ? `<div class="content-text">${config.content}</div>` : ''}
		      `;
		}
	}

	/**
	 * GERAR TODOS OS SLIDES
	 */
	async generateSlides(options: SlidePDFOptions): Promise<string[]> {
		const htmlSlides: string[] = [];
		const theme = { ...this.defaultTheme, ...options.theme };
		
		for (let i = 0; i < options.slides.length; i++) {
			const slide = options.slides[i];
			const html = await this.generateSlideHTML(slide, theme);
			htmlSlides.push(html);
		}
		
		return htmlSlides;
	}

	/**
	 * SALVAR SLIDES COMO HTML
	 */
	async saveSlidesAsHTML(htmlSlides: string[], outputDir: string): Promise<string[]> {
		const paths: string[] = [];
		
		await mkdir(outputDir, { recursive: true });
		
		for (let i = 0; i < htmlSlides.length; i++) {
			const path = join(outputDir, `slide_${String(i + 1).padStart(3, '0')}.html`);
			await writeFile(path, htmlSlides[i], 'utf-8');
			paths.push(path);
		}
		
		return paths;
	}

	/**
	 * CONVERTER HTML PARA PDF
	 */
	async convertToPDF(htmlSlides: string[], outputPath: string): Promise<string> {
		// Criar HTML combinado
		const combinedHTML = this.combineHTMLSlides(htmlSlides);
		const tempHTMLPath = join(dirname(outputPath), 'temp_slides.html');
		await mkdir(dirname(outputPath), { recursive: true });
		await writeFile(tempHTMLPath, combinedHTML, 'utf-8');
		
		// Usar puppeteer para converter
		try {
			const puppeteer = await import('puppeteer');
			const browser = await puppeteer.default.launch({ 
				headless: true,
				args: ['--no-sandbox', '--disable-setuid-sandbox']
			});
			const page = await browser.newPage();
			await page.setViewport({ width: 1280, height: 720 });
			await page.goto(`file://${tempHTMLPath}`, { waitUntil: 'networkidle0' });
			
			// Converter cada slide separadamente e combinar
			const pdfBuffers: Buffer[] = [];
			for (let i = 0; i < htmlSlides.length; i++) {
				const slideHTML = htmlSlides[i];
				const slidePath = join(dirname(outputPath), `temp_slide_${i}.html`);
				await writeFile(slidePath, slideHTML, 'utf-8');
				
				const slidePage = await browser.newPage();
				await slidePage.setViewport({ width: 1280, height: 720 });
				await slidePage.goto(`file://${slidePath}`, { waitUntil: 'networkidle0' });
				const pdfBuffer = await slidePage.pdf({
					width: '1280px',
					height: '720px',
					printBackground: true,
					margin: { top: 0, right: 0, bottom: 0, left: 0 }
				});
				pdfBuffers.push(Buffer.from(pdfBuffer));
				await slidePage.close();
			}
			
			await browser.close();
			
			// Combinar PDFs usando pdf-lib
			const { PDFDocument } = await import('pdf-lib');
			const mergedPdf = await PDFDocument.create();
			
			for (const pdfBuffer of pdfBuffers) {
				const pdf = await PDFDocument.load(pdfBuffer);
				const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
				pages.forEach((page) => mergedPdf.addPage(page));
			}
			
			const mergedPdfBytes = await mergedPdf.save();
			await writeFile(outputPath, mergedPdfBytes);
			
			return outputPath;
		} catch (error) {
			// Fallback simples: salvar HTMLs e instruir conversão manual
			console.error('Erro ao converter para PDF:', error);
			throw new Error(`Erro ao converter para PDF: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * CONVERTER HTML PARA POWERPOINT
	 */
	async convertToPowerPoint(htmlSlides: string[], outputPath: string): Promise<string> {
		try {
			const PptxGenJS = await import('pptxgenjs');
			const pptx = new PptxGenJS.default();
			
			// Configurar tamanho do slide (16:9)
			pptx.layout = 'LAYOUT_WIDE';
			pptx.defineLayout({ name: 'CUSTOM', width: 10, height: 5.625 });
			pptx.layout = 'CUSTOM';
			
			for (let i = 0; i < htmlSlides.length; i++) {
				const html = htmlSlides[i];
				const slide = pptx.addSlide();
				
				// Extrair título
				const titleMatch = html.match(/<h1[^>]*class="title"[^>]*>([^<]+)<\/h1>/);
				if (titleMatch) {
					slide.addText(titleMatch[1].trim(), {
						x: 0.5,
						y: 0.5,
						w: 9,
						h: 1,
						fontSize: 48,
						bold: true,
						align: 'center',
						color: 'FFFFFF'
					});
				}
				
				// Extrair subtítulo
				const subtitleMatch = html.match(/<h2[^>]*class="subtitle"[^>]*>([^<]+)<\/h2>/);
				if (subtitleMatch) {
					slide.addText(subtitleMatch[1].trim(), {
						x: 0.5,
						y: 1.8,
						w: 9,
						h: 0.8,
						fontSize: 28,
						align: 'center',
						color: 'CCCCCC'
					});
				}
				
				// Extrair conteúdo
				const contentMatch = html.match(/<div[^>]*class="content-text"[^>]*>([\s\S]*?)<\/div>/);
				if (contentMatch) {
					const content = contentMatch[1]
						.replace(/<[^>]+>/g, '')
						.replace(/&nbsp;/g, ' ')
						.trim();
					
					if (content) {
						slide.addText(content, {
							x: 0.5,
							y: 2.8,
							w: 9,
							h: 2.5,
							fontSize: 20,
							align: 'center',
							color: 'FFFFFF',
							valign: 'middle'
						});
					}
				}
				
				// Adicionar número do slide
				slide.addText(`${i + 1} / ${htmlSlides.length}`, {
					x: 9,
					y: 5.3,
					w: 0.8,
					h: 0.3,
					fontSize: 14,
					align: 'right',
					color: '888888'
				});
			}
			
			await mkdir(dirname(outputPath), { recursive: true });
			await pptx.writeFile({ fileName: outputPath });
			
			console.log(`[slide_pdf] PowerPoint salvo em: ${outputPath}`);
			return outputPath;
		} catch (error) {
			throw new Error(`Erro ao converter para PowerPoint: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * COMBINAR SLIDES HTML EM UM ÚNICO ARQUIVO
	 */
	private combineHTMLSlides(htmlSlides: string[]): string {
		const slidesHTML = htmlSlides.map((html, index) => {
			// Extrair apenas o body content
			const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
			if (bodyMatch) {
				return `
					<div class="page-break" style="page-break-after: always;">
						${bodyMatch[1]}
					</div>
				`;
			}
			return '';
		}).join('\n');
		
		return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
	<meta charset="UTF-8">
	<style>
		.page-break {
			width: 1280px;
			height: 720px;
			margin: 0 auto;
			margin-bottom: 20px;
		}
	</style>
</head>
<body>
	${slidesHTML}
</body>
</html>`;
	}
}
