/**
 * VALIDADOR DE QUALIDADE DE CONTEÚDO EM TEMPO REAL
 * 
 * Sistema avançado para garantir qualidade, coesão e requisitos quantitativos
 * em conteúdos como ebooks, artigos, documentação, etc.
 * 
 * Funcionalidades:
 * - Validação de contagem de palavras por capítulo/seção
 * - Detecção de repetições e inconsistências
 * - Análise de coesão e fluxo narrativo
 * - Sugestão de expansões incrementais
 * - Validação em tempo real durante criação
 */

import OpenAI from 'openai';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getConfig } from '../llm-config.js';

export interface ContentQualityResult {
	valid: boolean;
	totalWords: number;
	chaptersAnalysis: ChapterAnalysis[];
	qualityScore: number; // 0-100
	issues: ContentIssue[];
	suggestions: string[];
	needsExpansion: boolean;
	expansionStrategy?: ExpansionStrategy;
}

export interface ChapterAnalysis {
	chapterNumber: number;
	chapterTitle: string;
	wordCount: number;
	requiredWords: number;
	meetsRequirement: boolean;
	deficit: number;
	qualityScore: number;
	issues: string[];
}

export interface ContentIssue {
	type: 'repetition' | 'inconsistency' | 'low_quality' | 'insufficient_words' | 'poor_cohesion';
	severity: 'critical' | 'high' | 'medium' | 'low';
	description: string;
	location: string;
	suggestion: string;
}

export interface ExpansionStrategy {
	mode: 'incremental' | 'batch';
	chaptersToExpand: number[];
	estimatedTokens: number;
	steps: ExpansionStep[];
}

export interface ExpansionStep {
	stepNumber: number;
	action: 'expand_chapter' | 'create_new_section' | 'enrich_content';
	target: string;
	wordsToAdd: number;
	focusAreas: string[];
}

export class ContentQualityValidator {
	private openai: OpenAI;

	constructor(openai: OpenAI) {
		this.openai = openai;
	}

	/**
	 * VALIDAÇÃO COMPLETA DE CONTEÚDO
	 * Lê o arquivo real e analisa qualidade, quantidade, coesão
	 */
	async validateContent(
		filePath: string,
		requirements: {
			minWordsPerChapter?: number;
			totalChapters?: number;
			minTotalWords?: number;
			contentType?: 'ebook' | 'article' | 'documentation';
		},
		workDir?: string
	): Promise<ContentQualityResult> {
		const absolutePath = workDir ? join(workDir, filePath) : filePath;

		// Verificar se arquivo existe
		if (!existsSync(absolutePath)) {
			return {
				valid: false,
				totalWords: 0,
				chaptersAnalysis: [],
				qualityScore: 0,
				issues: [{
					type: 'insufficient_words',
					severity: 'critical',
					description: 'Arquivo não encontrado',
					location: absolutePath,
					suggestion: 'Criar arquivo com conteúdo apropriado'
				}],
				suggestions: ['Criar arquivo primeiro'],
				needsExpansion: true
			};
		}

		// Ler conteúdo do arquivo
		const content = readFileSync(absolutePath, 'utf-8');

		// Analisar estrutura (capítulos)
		const chaptersAnalysis = this.analyzeChapters(
			content, 
			requirements.minWordsPerChapter || 700
		);

		// Contar palavras totais
		const totalWords = this.countWords(content);

		// Detectar problemas de qualidade
		const qualityIssues = await this.detectQualityIssues(content, filePath);

		// Calcular score de qualidade
		const qualityScore = this.calculateQualityScore(chaptersAnalysis, qualityIssues);

		// Determinar se precisa expansão
		const needsExpansion = chaptersAnalysis.some(ch => !ch.meetsRequirement) ||
			(requirements.minTotalWords && totalWords < requirements.minTotalWords);

		// Gerar estratégia de expansão se necessário
		let expansionStrategy: ExpansionStrategy | undefined;
		if (needsExpansion) {
			expansionStrategy = this.generateExpansionStrategy(
				chaptersAnalysis,
				requirements
			);
		}

		// Gerar sugestões
		const suggestions = this.generateSuggestions(
			chaptersAnalysis,
			qualityIssues,
			needsExpansion
		);

		// Validação final
		const valid = !needsExpansion && 
			qualityScore >= 70 && 
			qualityIssues.filter(i => i.severity === 'critical').length === 0;

		return {
			valid,
			totalWords,
			chaptersAnalysis,
			qualityScore,
			issues: qualityIssues,
			suggestions,
			needsExpansion,
			expansionStrategy
		};
	}

	/**
	 * ANÁLISE DE CAPÍTULOS/PÁGINAS
	 * Identifica capítulos/páginas e conta palavras em cada um
	 */
	private analyzeChapters(content: string, requiredWords: number): ChapterAnalysis[] {
		const analysis: ChapterAnalysis[] = [];

		// Detectar capítulos/páginas (markdown headers ## Capítulo/Página)
		// Suporta: ## Capítulo 1, ## Página 1, # Página 1, etc.
		const chapterPattern = /^(#{1,2})\s+(Capítulo|Chapter|Página|Page)\s+(\d+)[:\s]*(.+)?$/gm;
		const matches = [...content.matchAll(chapterPattern)];

		if (matches.length === 0) {
			// Sem capítulos/páginas detectados, analisar como documento único
			const totalWords = this.countWords(content);
			return [{
				chapterNumber: 1,
				chapterTitle: 'Documento completo',
				wordCount: totalWords,
				requiredWords,
				meetsRequirement: totalWords >= requiredWords,
				deficit: Math.max(0, requiredWords - totalWords),
				qualityScore: totalWords >= requiredWords ? 100 : Math.round((totalWords / requiredWords) * 100),
				issues: totalWords < requiredWords ? ['Palavras insuficientes'] : []
			}];
		}

		// Analisar cada capítulo/página
		for (let i = 0; i < matches.length; i++) {
			const match = matches[i];
			const chapterNumber = parseInt(match[3]); // match[3] é o número (após Capítulo/Página)
			const chapterTitle = (match[4] || `Página ${chapterNumber}`).trim(); // match[4] é o título opcional
			const startIndex = match.index || 0;
			
			// Encontrar fim do capítulo/página (início do próximo ou fim do arquivo)
			const endIndex = i < matches.length - 1 
				? matches[i + 1].index || content.length 
				: content.length;

			const chapterContent = content.substring(startIndex, endIndex);
			const wordCount = this.countWords(chapterContent);
			const meetsRequirement = wordCount >= requiredWords;
			const deficit = Math.max(0, requiredWords - wordCount);

			analysis.push({
				chapterNumber,
				chapterTitle,
				wordCount,
				requiredWords,
				meetsRequirement,
				deficit,
				qualityScore: Math.min(100, Math.round((wordCount / requiredWords) * 100)),
				issues: meetsRequirement ? [] : [`Faltam ${deficit} palavras`]
			});
		}

		return analysis;
	}

	/**
	 * CONTAGEM DE PALAVRAS
	 */
	private countWords(text: string): number {
		// Remover código markdown, links, etc
		const cleanText = text
			.replace(/```[\s\S]*?```/g, '') // Remove code blocks
			.replace(/`[^`]+`/g, '') // Remove inline code
			.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
			.replace(/#+\s/g, '') // Remove headers markers
			.replace(/[*_~]/g, ''); // Remove formatting

		// Contar palavras
		const words = cleanText
			.split(/\s+/)
			.filter(word => word.length > 0 && /\w/.test(word));

		return words.length;
	}

	/**
	 * DETECTAR PROBLEMAS DE QUALIDADE
	 * Usa LLM para análise profunda
	 */
	private async detectQualityIssues(
		content: string,
		filePath: string
	): Promise<ContentIssue[]> {
		const issues: ContentIssue[] = [];

		// Análise rápida local
		const localIssues = this.detectLocalQualityIssues(content);
		issues.push(...localIssues);

		// Análise profunda com LLM (apenas se conteúdo não for muito grande)
		if (content.length < 20000) {
			const llmIssues = await this.detectLLMQualityIssues(content, filePath);
			issues.push(...llmIssues);
		}

		return issues;
	}

	/**
	 * DETECÇÃO LOCAL DE PROBLEMAS
	 * Rápida, sem LLM
	 */
	private detectLocalQualityIssues(content: string): ContentIssue[] {
		const issues: ContentIssue[] = [];

		// Detectar repetições excessivas
		const repetitions = this.detectRepetitions(content);
		if (repetitions.length > 0) {
			issues.push({
				type: 'repetition',
				severity: 'medium',
				description: `Frases/parágrafos repetidos detectados: ${repetitions.length}`,
				location: 'Múltiplas localizações',
				suggestion: 'Reescrever seções repetidas com variações'
			});
		}

		// Detectar parágrafos muito curtos (< 50 palavras)
		const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
		const shortParagraphs = paragraphs.filter(p => this.countWords(p) < 50);
		
		if (shortParagraphs.length > paragraphs.length * 0.5) {
			issues.push({
				type: 'low_quality',
				severity: 'medium',
				description: `Muitos parágrafos curtos (${shortParagraphs.length}/${paragraphs.length})`,
				location: 'Documento inteiro',
				suggestion: 'Expandir parágrafos para desenvolver melhor as ideias'
			});
		}

		// Detectar conteúdo vazio ou placeholder
		if (content.includes('TODO') || content.includes('FIXME') || content.includes('[...]')) {
			issues.push({
				type: 'low_quality',
				severity: 'high',
				description: 'Placeholders ou TODOs detectados',
				location: 'Verificar documento',
				suggestion: 'Substituir placeholders por conteúdo real'
			});
		}

		return issues;
	}

	/**
	 * DETECÇÃO DE REPETIÇÕES
	 */
	private detectRepetitions(content: string): string[] {
		const repetitions: string[] = [];
		const sentences = content
			.split(/[.!?]+/)
			.map(s => s.trim().toLowerCase())
			.filter(s => s.length > 30);

		// Detectar sentenças duplicadas
		const seenSentences = new Set<string>();
		for (const sentence of sentences) {
			if (seenSentences.has(sentence)) {
				repetitions.push(sentence.substring(0, 50) + '...');
			}
			seenSentences.add(sentence);
		}

		return [...new Set(repetitions)].slice(0, 5); // Max 5 exemplos
	}

	/**
	 * DETECÇÃO LLM DE PROBLEMAS
	 */
	private async detectLLMQualityIssues(
		content: string,
		filePath: string
	): Promise<ContentIssue[]> {
		const config = getConfig();

		// Truncar conteúdo para análise
		const sampleContent = content.length > 5000 
			? content.substring(0, 2500) + '\n...\n' + content.substring(content.length - 2500)
			: content;

		const prompt = `Você é um Analista de Qualidade de Conteúdo do FLUI.

**CONTEÚDO A ANALISAR:**
${sampleContent}

**SUA MISSÃO:**
Analise a qualidade deste conteúdo identificando:
1. **Coesão**: O conteúdo flui bem? Há transições naturais?
2. **Consistência**: O tom e estilo são consistentes?
3. **Repetições**: Há ideias ou frases repetidas desnecessariamente?
4. **Profundidade**: O conteúdo é superficial ou bem desenvolvido?

**RETORNE APENAS JSON:**
{
  "issues": [
    {
      "type": "poor_cohesion|repetition|inconsistency|low_quality",
      "severity": "critical|high|medium|low",
      "description": "descrição clara",
      "location": "seção/capítulo",
      "suggestion": "como melhorar"
    }
  ],
  "overallQuality": 0-100,
  "strengths": ["ponto forte 1", "ponto forte 2"],
  "weaknesses": ["ponto fraco 1", "ponto fraco 2"]
}`;

		try {
			const response = await this.openai.chat.completions.create({
				model: config.model || 'qwen-max',
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.2,
				max_tokens: 1000
			});

			const contentResponse = response.choices[0]?.message?.content || '{"issues": []}';
			const cleanContent = contentResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
			const analysis = JSON.parse(cleanContent);

			return analysis.issues || [];
		} catch (error) {
			return [];
		}
	}

	/**
	 * CALCULAR SCORE DE QUALIDADE
	 */
	private calculateQualityScore(
		chaptersAnalysis: ChapterAnalysis[],
		issues: ContentIssue[]
	): number {
		let score = 100;

		// Penalizar por capítulos incompletos
		const incompleteChapters = chaptersAnalysis.filter(ch => !ch.meetsRequirement);
		score -= incompleteChapters.length * 10;

		// Penalizar por problemas de qualidade
		for (const issue of issues) {
			switch (issue.severity) {
				case 'critical':
					score -= 25;
					break;
				case 'high':
					score -= 15;
					break;
				case 'medium':
					score -= 5;
					break;
				case 'low':
					score -= 2;
					break;
			}
		}

		// Bonus por capítulos que excedem requisitos
		const overachievers = chaptersAnalysis.filter(
			ch => ch.wordCount > ch.requiredWords * 1.2
		);
		score += overachievers.length * 5;

		return Math.max(0, Math.min(100, score));
	}

	/**
	 * GERAR ESTRATÉGIA DE EXPANSÃO
	 */
	private generateExpansionStrategy(
		chaptersAnalysis: ChapterAnalysis[],
		requirements: any
	): ExpansionStrategy {
		const chaptersNeedingExpansion = chaptersAnalysis
			.filter(ch => !ch.meetsRequirement)
			.map(ch => ch.chapterNumber);

		const totalWordsNeeded = chaptersAnalysis
			.filter(ch => !ch.meetsRequirement)
			.reduce((sum, ch) => sum + ch.deficit, 0);

		// Decidir modo: incremental (capítulo por capítulo) ou batch (todos de uma vez)
		const mode: 'incremental' | 'batch' = 
			chaptersNeedingExpansion.length > 5 || totalWordsNeeded > 5000 
				? 'incremental' 
				: 'batch';

		const steps: ExpansionStep[] = [];

		if (mode === 'incremental') {
			// Criar step para cada capítulo
			chaptersNeedingExpansion.forEach((chapterNum, index) => {
				const chapter = chaptersAnalysis.find(ch => ch.chapterNumber === chapterNum);
				if (chapter) {
					steps.push({
						stepNumber: index + 1,
						action: 'expand_chapter',
						target: `Capítulo ${chapterNum}: ${chapter.chapterTitle}`,
						wordsToAdd: chapter.deficit,
						focusAreas: [
							'Adicionar exemplos práticos',
							'Desenvolver conceitos com mais profundidade',
							'Incluir casos de uso',
							'Adicionar contexto histórico/técnico'
						]
					});
				}
			});
		} else {
			// Expansão em batch
			steps.push({
				stepNumber: 1,
				action: 'expand_chapter',
				target: `Capítulos ${chaptersNeedingExpansion.join(', ')}`,
				wordsToAdd: totalWordsNeeded,
				focusAreas: [
					'Expandir todos os capítulos simultaneamente',
					'Manter coesão entre seções',
					'Garantir qualidade uniforme'
				]
			});
		}

		return {
			mode,
			chaptersToExpand: chaptersNeedingExpansion,
			estimatedTokens: Math.ceil(totalWordsNeeded * 1.5), // Estimativa de tokens
			steps
		};
	}

	/**
	 * GERAR SUGESTÕES
	 */
	private generateSuggestions(
		chaptersAnalysis: ChapterAnalysis[],
		issues: ContentIssue[],
		needsExpansion: boolean
	): string[] {
		const suggestions: string[] = [];

		if (needsExpansion) {
			const incompleteCount = chaptersAnalysis.filter(ch => !ch.meetsRequirement).length;
			suggestions.push(
				`📝 ${incompleteCount} capítulo(s) precisa(m) ser expandido(s)`
			);

			const totalDeficit = chaptersAnalysis
				.filter(ch => !ch.meetsRequirement)
				.reduce((sum, ch) => sum + ch.deficit, 0);
			
			suggestions.push(
				`📊 Total de ${totalDeficit} palavras faltando para completar requisitos`
			);
		}

		// Sugestões por tipo de problema
		const repetitionIssues = issues.filter(i => i.type === 'repetition');
		if (repetitionIssues.length > 0) {
			suggestions.push(
				`🔄 Reescrever ${repetitionIssues.length} seção(ões) com conteúdo repetido`
			);
		}

		const cohesionIssues = issues.filter(i => i.type === 'poor_cohesion');
		if (cohesionIssues.length > 0) {
			suggestions.push(
				`🔗 Melhorar coesão em ${cohesionIssues.length} seção(ões)`
			);
		}

		// Sugestão de capítulos prioritários
		const mostIncomplete = chaptersAnalysis
			.filter(ch => !ch.meetsRequirement)
			.sort((a, b) => b.deficit - a.deficit)
			.slice(0, 3);

		if (mostIncomplete.length > 0) {
			suggestions.push(
				`🎯 Prioridade: ${mostIncomplete.map(ch => `Cap ${ch.chapterNumber} (faltam ${ch.deficit} palavras)`).join(', ')}`
			);
		}

		return suggestions;
	}

	/**
	 * FORMATAR RELATÓRIO DE QUALIDADE
	 */
	formatQualityReport(result: ContentQualityResult): string {
		let report = '\n📊 RELATÓRIO DE QUALIDADE DE CONTEÚDO\n';
		report += '═'.repeat(60) + '\n\n';

		// Status geral
		report += result.valid ? '✅ VÁLIDO\n' : '❌ REQUER ATENÇÃO\n';
		report += `📝 Total de palavras: ${result.totalWords}\n`;
		report += `⭐ Score de qualidade: ${result.qualityScore}/100\n`;
		report += '\n';

		// Análise por capítulo
		if (result.chaptersAnalysis.length > 0) {
			report += '📚 ANÁLISE POR CAPÍTULO:\n';
			report += '─'.repeat(60) + '\n';

			for (const chapter of result.chaptersAnalysis) {
				const status = chapter.meetsRequirement ? '✅' : '⚠️';
				const percentage = Math.round((chapter.wordCount / chapter.requiredWords) * 100);
				
				report += `${status} Cap ${chapter.chapterNumber}: ${chapter.chapterTitle}\n`;
				report += `   Palavras: ${chapter.wordCount}/${chapter.requiredWords} (${percentage}%)\n`;
				
				if (!chapter.meetsRequirement) {
					report += `   ⚠️  Faltam: ${chapter.deficit} palavras\n`;
				}
				
				if (chapter.issues.length > 0) {
					chapter.issues.forEach(issue => {
						report += `   ⚠️  ${issue}\n`;
					});
				}
				
				report += '\n';
			}
		}

		// Problemas de qualidade
		if (result.issues.length > 0) {
			report += '🔍 PROBLEMAS DETECTADOS:\n';
			report += '─'.repeat(60) + '\n';

			const critical = result.issues.filter(i => i.severity === 'critical');
			const high = result.issues.filter(i => i.severity === 'high');
			const medium = result.issues.filter(i => i.severity === 'medium');

			if (critical.length > 0) {
				report += `🚨 Críticos (${critical.length}):\n`;
				critical.forEach(issue => {
					report += `   • ${issue.description}\n`;
					report += `     💡 ${issue.suggestion}\n`;
				});
				report += '\n';
			}

			if (high.length > 0) {
				report += `⚠️  Alta prioridade (${high.length}):\n`;
				high.forEach(issue => {
					report += `   • ${issue.description}\n`;
				});
				report += '\n';
			}

			if (medium.length > 0) {
				report += `⚡ Média prioridade (${medium.length}):\n`;
				medium.forEach(issue => {
					report += `   • ${issue.description}\n`;
				});
				report += '\n';
			}
		}

		// Estratégia de expansão
		if (result.needsExpansion && result.expansionStrategy) {
			report += '🚀 ESTRATÉGIA DE EXPANSÃO:\n';
			report += '─'.repeat(60) + '\n';
			report += `Modo: ${result.expansionStrategy.mode === 'incremental' ? 'Incremental (capítulo por capítulo)' : 'Batch (todos de uma vez)'}\n`;
			report += `Capítulos a expandir: ${result.expansionStrategy.chaptersToExpand.length}\n`;
			report += `Tokens estimados: ~${result.expansionStrategy.estimatedTokens}\n\n`;

			report += 'Passos:\n';
			result.expansionStrategy.steps.forEach(step => {
				report += `${step.stepNumber}. ${step.action}: ${step.target}\n`;
				report += `   Adicionar: ~${step.wordsToAdd} palavras\n`;
			});
			report += '\n';
		}

		// Sugestões
		if (result.suggestions.length > 0) {
			report += '💡 SUGESTÕES:\n';
			report += '─'.repeat(60) + '\n';
			result.suggestions.forEach(suggestion => {
				report += `   ${suggestion}\n`;
			});
			report += '\n';
		}

		report += '═'.repeat(60) + '\n';

		return report;
	}
}
