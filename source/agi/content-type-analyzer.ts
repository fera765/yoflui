/**
 * CONTENT TYPE ANALYZER - Deixa a LLM decidir o tipo de conteúdo
 * 
 * Em vez de usar detecção estática (regex), envia o prompt para a LLM
 * analisar e decidir qual é o tipo de conteúdo ideal para a tarefa.
 * 
 * Tipos de conteúdo suportados:
 * - ebook: E-book completo com múltiplas páginas
 * - slides: Apresentação em slides (PowerPoint/PDF)
 * - video_script: Roteiro de vídeo
 * - article: Artigo/blog post
 * - report: Relatório técnico
 * - course: Curso online
 */

import { OpenAI } from 'openai';

export interface ContentTypeDecision {
	contentType: 'ebook' | 'slides' | 'video_script' | 'article' | 'report' | 'course' | 'other';
	justification: string;
	recommendedFormat: 'pdf' | 'pptx' | 'html' | 'md' | 'docx';
	estimatedPages: number;
	keyFeatures: string[];
	confidence: number; // 0-100
}

export class ContentTypeAnalyzer {
	private openai: OpenAI;

	constructor(openai: OpenAI) {
		this.openai = openai;
	}

	/**
	 * Analisar o prompt e deixar a LLM decidir o tipo de conteúdo
	 */
	async analyzeContentType(userPrompt: string): Promise<ContentTypeDecision> {
		const systemPrompt = `Você é um especialista em análise de requisitos de conteúdo.

Analise o prompt do usuário e decida qual é o MELHOR tipo de conteúdo para atender a solicitação.

Responda em JSON com a seguinte estrutura:
{
  "contentType": "ebook|slides|video_script|article|report|course|other",
  "justification": "Explicação clara de por que este tipo é ideal",
  "recommendedFormat": "pdf|pptx|html|md|docx",
  "estimatedPages": número estimado de páginas/slides,
  "keyFeatures": ["feature1", "feature2", ...],
  "confidence": número entre 0-100
}

REGRAS IMPORTANTES:
1. Se o usuário menciona EXPLICITAMENTE um tipo (ex: "crie um ebook", "faça um vídeo"), respeite essa escolha
2. Se o usuário não especifica, escolha o tipo mais apropriado baseado no conteúdo
3. Considere a complexidade, extensão e propósito da tarefa
4. Confidence deve refletir quão certo você está da escolha

Exemplos:
- "Crie um ebook sobre marketing" → ebook (confidence: 95)
- "Faça um roteiro de vídeo sobre persuasão" → video_script (confidence: 95)
- "Crie 20 slides sobre vendas" → slides (confidence: 95)
- "Escreva um artigo sobre IA" → article (confidence: 90)
- "Crie um ebook com 5 capítulos, exemplos, estudos de caso, design profissional" → ebook (confidence: 95)

Responda APENAS com o JSON, sem explicações adicionais.`;

		try {
			const response = await this.openai.chat.completions.create({
				model: 'qwen3-coder-plus',
				messages: [
					{
						role: 'system',
						content: systemPrompt
					},
					{
						role: 'user',
						content: userPrompt
					}
				],
				temperature: 0.3, // Mais determinístico
				max_tokens: 500
			});

			const content = response.choices[0]?.message?.content || '{}';
			const decision = JSON.parse(content) as ContentTypeDecision;

			// Validar resposta
			if (!decision.contentType || !decision.justification) {
				throw new Error('Resposta inválida da LLM');
			}

			return decision;
		} catch (error) {
			console.error('[ContentTypeAnalyzer] Erro ao analisar tipo de conteúdo:', error);
			// Fallback para ebook se houver erro
			return {
				contentType: 'ebook',
				justification: 'Padrão fallback - análise falhou',
				recommendedFormat: 'pdf',
				estimatedPages: 20,
				keyFeatures: [],
				confidence: 30
			};
		}
	}

	/**
	 * Extrair requisitos específicos do prompt baseado no tipo de conteúdo
	 */
	async extractRequirements(
		userPrompt: string,
		contentType: ContentTypeDecision
	): Promise<Record<string, any>> {
		const systemPrompt = `Você é um especialista em extração de requisitos.

Analise o prompt do usuário e extraia os requisitos específicos para um ${contentType.contentType}.

Responda em JSON com os requisitos encontrados. Exemplo:
{
  "title": "Título do conteúdo",
  "chapters": número de capítulos (se aplicável),
  "wordCount": número de palavras esperadas,
  "style": "estilo do conteúdo",
  "includeExamples": boolean,
  "includeCaseStudies": boolean,
  "includeVisuals": boolean,
  "targetAudience": "público-alvo",
  "tone": "tom do conteúdo",
  "customRequirements": ["req1", "req2", ...]
}

Responda APENAS com o JSON.`;

		try {
			const response = await this.openai.chat.completions.create({
				model: 'qwen3-coder-plus',
				messages: [
					{
						role: 'system',
						content: systemPrompt
					},
					{
						role: 'user',
						content: userPrompt
					}
				],
				temperature: 0.3,
				max_tokens: 1000
			});

			const content = response.choices[0]?.message?.content || '{}';
			return JSON.parse(content);
		} catch (error) {
			console.error('[ContentTypeAnalyzer] Erro ao extrair requisitos:', error);
			return {};
		}
	}
}
