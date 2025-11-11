/**
 * MARKETING CAMPAIGN GENERATOR
 * Sistema de geração de campanhas multi-formato para Flui Marketing Agency
 * 
 * Gera simultaneamente:
 * - Vídeo script
 * - Copy de anúncio
 * - Landing page
 * - E-mail marketing
 * - Post social
 * - E-book
 * 
 * Tudo sincronizado e coeso com narrativa unificada
 */

import OpenAI from 'openai';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { getConfig } from '../llm-config.js';

export interface CampaignBrief {
	product: string;
	targetAudience: string;
	objective: 'awareness' | 'conversion' | 'engagement' | 'education';
	tone: 'professional' | 'casual' | 'funny' | 'inspirational' | 'urgent';
	brandVoice?: string;
	keyMessages: string[];
	cta?: string;
}

export interface MultiFormatCampaign {
	campaignName: string;
	coreNarrative: string;
	videoScript: VideoScript;
	adCopy: AdCopy;
	landingPage: LandingPage;
	email: Email;
	socialPost: SocialPost;
	ebook?: EbookOutline;
	cohesionScore: number;
	generatedAt: string;
}

export interface VideoScript {
	title: string;
	duration: string; // "15s", "30s", "60s"
	hook: string; // Primeiros 3 segundos
	scenes: VideoScene[];
	cta: string;
}

export interface VideoScene {
	sceneNumber: number;
	duration: string;
	visual: string;
	audio: string;
	text: string;
}

export interface AdCopy {
	headline: string;
	subheadline: string;
	body: string;
	cta: string;
	variations: string[]; // 3-5 variações para A/B testing
	platforms: {
		facebook?: string;
		instagram?: string;
		linkedin?: string;
		google?: string;
	};
}

export interface LandingPage {
	title: string;
	heroHeadline: string;
	heroSubheadline: string;
	sections: LandingSection[];
	cta: string;
	metaDescription: string;
	keywords: string[];
}

export interface LandingSection {
	title: string;
	content: string;
	cta?: string;
}

export interface Email {
	subject: string;
	preheader: string;
	greeting: string;
	body: string;
	cta: string;
	signature: string;
}

export interface SocialPost {
	platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';
	content: string;
	hashtags: string[];
	cta?: string;
}

export interface EbookOutline {
	title: string;
	description: string;
	chapters: EbookChapter[];
	totalPages: number;
}

export interface EbookChapter {
	chapterNumber: number;
	title: string;
	keyPoints: string[];
	estimatedWords: number;
}

export class MarketingCampaignGenerator {
	private openai: OpenAI;
	private copyTemplates: Map<string, any>;

	constructor(openai: OpenAI) {
		this.openai = openai;
		this.copyTemplates = new Map();
		this.loadCopyTemplates();
	}

	/**
	 * GERA CAMPANHA MULTI-FORMATO COMPLETA
	 */
	async generateCampaign(brief: CampaignBrief, workDir: string): Promise<MultiFormatCampaign> {
		// FASE 1: Criar narrativa central unificada
		const coreNarrative = await this.createCoreNarrative(brief);

		// FASE 2: Gerar todos os formatos simultaneamente (paralelo)
		const [videoScript, adCopy, landingPage, email, socialPost, ebook] = await Promise.all([
			this.generateVideoScript(brief, coreNarrative),
			this.generateAdCopy(brief, coreNarrative),
			this.generateLandingPage(brief, coreNarrative),
			this.generateEmail(brief, coreNarrative),
			this.generateSocialPost(brief, coreNarrative),
			brief.objective === 'education' ? this.generateEbookOutline(brief, coreNarrative) : Promise.resolve(undefined)
		]);

		// FASE 3: Validar coesão narrativa
		const cohesionScore = await this.validateCohesion(coreNarrative, {
			videoScript,
			adCopy,
			landingPage,
			email,
			socialPost,
			ebook
		});

		const campaign: MultiFormatCampaign = {
			campaignName: `${brief.product} - ${brief.objective} Campaign`,
			coreNarrative,
			videoScript,
			adCopy,
			landingPage,
			email,
			socialPost,
			ebook,
			cohesionScore,
			generatedAt: new Date().toISOString()
		};

		// FASE 4: Salvar campanha completa
		await this.saveCampaign(campaign, workDir);

		return campaign;
	}

	/**
	 * CRIAR NARRATIVA CENTRAL UNIFICADA
	 */
	private async createCoreNarrative(brief: CampaignBrief): Promise<string> {
		const prompt = `Você é um Diretor Criativo de uma agência de marketing global de nível mundial.

Crie uma NARRATIVA CENTRAL UNIFICADA para uma campanha de marketing que será usada em TODOS os formatos (vídeo, anúncio, landing page, e-mail, post social, e-book).

PRODUTO/SERVIÇO: ${brief.product}
PÚBLICO-ALVO: ${brief.targetAudience}
OBJETIVO: ${brief.objective}
TOM: ${brief.tone}
VOZ DA MARCA: ${brief.brandVoice || 'Profissional e autêntica'}
MENSAGENS-CHAVE: ${brief.keyMessages.join(', ')}
CTA: ${brief.cta || 'Descubra mais'}

A narrativa deve:
1. Ser emocionalmente envolvente e memorável
2. Conectar com as dores e aspirações do público-alvo
3. Comunicar claramente o valor único do produto
4. Ser adaptável para diferentes formatos mantendo essência
5. Ter estrutura clara: Problema → Solução → Benefício → Ação

Retorne APENAS a narrativa central (200-300 palavras), sem formatação adicional.`;

		const response = await this.openai.chat.completions.create({
			model: getConfig().model || 'gpt-4',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.8,
			max_tokens: 500
		});

		return response.choices[0]?.message?.content || '';
	}

	/**
	 * GERAR SCRIPT DE VÍDEO
	 */
	private async generateVideoScript(brief: CampaignBrief, narrative: string): Promise<VideoScript> {
		const prompt = `Você é um roteirista de vídeos virais especializado em criar scripts que engajam e convertem.

NARRATIVA CENTRAL: ${narrative}

Crie um script de vídeo de 15-60 segundos seguindo esta estrutura:

1. HOOK (primeiros 3 segundos): Deve ser irresistível e prender atenção imediatamente
2. PROBLEMA (5-10s): Apresentar a dor do público
3. SOLUÇÃO (10-20s): Introduzir o produto como solução
4. BENEFÍCIO (5-10s): Mostrar resultado transformador
5. CTA (últimos 3-5s): Chamada para ação clara

PRODUTO: ${brief.product}
TOM: ${brief.tone}
DURAÇÃO ALVO: 30 segundos

Retorne JSON com esta estrutura:
{
  "title": "Título do vídeo",
  "duration": "30s",
  "hook": "Texto do hook (3 segundos)",
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": "3s",
      "visual": "Descrição visual",
      "audio": "Descrição de áudio/música",
      "text": "Texto na tela"
    }
  ],
  "cta": "CTA final"
}`;

		const response = await this.openai.chat.completions.create({
			model: getConfig().model || 'gpt-4',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.7,
			max_tokens: 1500
		});

		const content = response.choices[0]?.message?.content || '{}';
		const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		return JSON.parse(cleanContent);
	}

	/**
	 * GERAR COPY DE ANÚNCIO
	 */
	private async generateAdCopy(brief: CampaignBrief, narrative: string): Promise<AdCopy> {
		const prompt = `Você é um copywriter de elite especializado em criar anúncios que convertem >5% CTR.

NARRATIVA CENTRAL: ${narrative}

Crie copy de anúncio seguindo estas fórmulas comprovadas:

HEADLINE: Use fórmula AIDA ou PAS
- AIDA: Atenção → Interesse → Desejo → Ação
- PAS: Problema → Agitação → Solução

SUBHEADLINE: Amplifica o benefício principal

BODY: Conecta com emoção e apresenta prova social

CTA: Ação clara e urgente

PRODUTO: ${brief.product}
TOM: ${brief.tone}
CTA: ${brief.cta || 'Descubra mais'}

Retorne JSON:
{
  "headline": "Headline principal",
  "subheadline": "Subheadline",
  "body": "Corpo do anúncio (2-3 parágrafos)",
  "cta": "CTA",
  "variations": ["Variação 1", "Variação 2", "Variação 3"],
  "platforms": {
    "facebook": "Copy adaptado para Facebook",
    "instagram": "Copy adaptado para Instagram",
    "linkedin": "Copy adaptado para LinkedIn",
    "google": "Copy adaptado para Google Ads"
  }
}`;

		const response = await this.openai.chat.completions.create({
			model: getConfig().model || 'gpt-4',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.7,
			max_tokens: 1500
		});

		const content = response.choices[0]?.message?.content || '{}';
		const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		return JSON.parse(cleanContent);
	}

	/**
	 * GERAR LANDING PAGE
	 */
	private async generateLandingPage(brief: CampaignBrief, narrative: string): Promise<LandingPage> {
		const prompt = `Você é um especialista em landing pages de alta conversão (>5% taxa de conversão).

NARRATIVA CENTRAL: ${narrative}

Crie uma landing page completa seguindo estrutura AIDA:

HERO SECTION:
- Headline: Foco no benefício principal
- Subheadline: Amplifica o valor
- CTA primário

SEÇÕES:
1. Problema (dor do público)
2. Solução (como o produto resolve)
3. Benefícios (3-5 benefícios principais)
4. Prova social (testemunhos, números)
5. Oferta especial (se houver)
6. CTA final

PRODUTO: ${brief.product}
TOM: ${brief.tone}

Retorne JSON:
{
  "title": "Título da página",
  "heroHeadline": "Headline hero",
  "heroSubheadline": "Subheadline hero",
  "sections": [
    {
      "title": "Título da seção",
      "content": "Conteúdo da seção",
      "cta": "CTA opcional"
    }
  ],
  "cta": "CTA principal",
  "metaDescription": "Meta description para SEO",
  "keywords": ["keyword1", "keyword2"]
}`;

		const response = await this.openai.chat.completions.create({
			model: getConfig().model || 'gpt-4',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.7,
			max_tokens: 2000
		});

		const content = response.choices[0]?.message?.content || '{}';
		const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		return JSON.parse(cleanContent);
	}

	/**
	 * GERAR E-MAIL MARKETING
	 */
	private async generateEmail(brief: CampaignBrief, narrative: string): Promise<Email> {
		const prompt = `Você é um especialista em e-mail marketing com taxa de abertura >30%.

NARRATIVA CENTRAL: ${narrative}

Crie um e-mail seguindo estrutura:
1. SUBJECT LINE: Curto, intrigante, cria curiosidade
2. PREHEADER: Complementa subject line
3. GREETING: Personalizado
4. BODY: Conecta com narrativa, apresenta valor, cria urgência
5. CTA: Claro e destacado
6. SIGNATURE: Profissional

PRODUTO: ${brief.product}
TOM: ${brief.tone}

Retorne JSON:
{
  "subject": "Subject line",
  "preheader": "Preheader text",
  "greeting": "Olá [Nome]",
  "body": "Corpo do e-mail",
  "cta": "CTA",
  "signature": "Assinatura"
}`;

		const response = await this.openai.chat.completions.create({
			model: getConfig().model || 'gpt-4',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.7,
			max_tokens: 1000
		});

		const content = response.choices[0]?.message?.content || '{}';
		const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		return JSON.parse(cleanContent);
	}

	/**
	 * GERAR POST SOCIAL
	 */
	private async generateSocialPost(brief: CampaignBrief, narrative: string): Promise<SocialPost> {
		const prompt = `Você é um especialista em conteúdo viral para redes sociais.

NARRATIVA CENTRAL: ${narrative}

Crie posts para diferentes plataformas:

FACEBOOK: Texto mais longo, storytelling
INSTAGRAM: Visual-first, captions envolventes
LINKEDIN: Profissional, insights
TWITTER: Conciso, impactante
TIKTOK: Hook forte, storytelling rápido

PRODUTO: ${brief.product}
TOM: ${brief.tone}

Retorne JSON para Instagram (plataforma principal):
{
  "platform": "instagram",
  "content": "Conteúdo do post",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "cta": "CTA"
}`;

		const response = await this.openai.chat.completions.create({
			model: getConfig().model || 'gpt-4',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.8,
			max_tokens: 500
		});

		const content = response.choices[0]?.message?.content || '{}';
		const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		return JSON.parse(cleanContent);
	}

	/**
	 * GERAR OUTLINE DE E-BOOK
	 */
	private async generateEbookOutline(brief: CampaignBrief, narrative: string): Promise<EbookOutline> {
		const prompt = `Você é um especialista em criar e-books educativos que convertem.

NARRATIVA CENTRAL: ${narrative}

Crie um outline completo de e-book (30 páginas, 700+ palavras por página) que:
1. Educa o público sobre o problema
2. Apresenta soluções
3. Posiciona o produto como melhor solução
4. Inclui casos de sucesso
5. Termina com CTA

PRODUTO: ${brief.product}
OBJETIVO: ${brief.objective}

Retorne JSON:
{
  "title": "Título do e-book",
  "description": "Descrição",
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "Título do capítulo",
      "keyPoints": ["Ponto 1", "Ponto 2"],
      "estimatedWords": 700
    }
  ],
  "totalPages": 30
}`;

		const response = await this.openai.chat.completions.create({
			model: getConfig().model || 'gpt-4',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.7,
			max_tokens: 2000
		});

		const content = response.choices[0]?.message?.content || '{}';
		const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		return JSON.parse(cleanContent);
	}

	/**
	 * VALIDAR COESÃO NARRATIVA
	 */
	private async validateCohesion(narrative: string, formats: any): Promise<number> {
		const prompt = `Analise a coesão narrativa entre a narrativa central e os formatos gerados.

NARRATIVA CENTRAL: ${narrative}

FORMATOS GERADOS:
${JSON.stringify(formats, null, 2)}

Avalie de 0-100:
- Alinhamento com narrativa central (0-40)
- Consistência de tom e voz (0-30)
- Coerência de mensagens-chave (0-30)

Retorne APENAS o número (0-100).`;

		const response = await this.openai.chat.completions.create({
			model: getConfig().model || 'gpt-4',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.3,
			max_tokens: 10
		});

		const score = parseInt(response.choices[0]?.message?.content || '0');
		return Math.min(100, Math.max(0, score));
	}

	/**
	 * SALVAR CAMPANHA
	 */
	private async saveCampaign(campaign: MultiFormatCampaign, workDir: string): Promise<void> {
		const campaignDir = join(workDir, 'work', 'campaigns', campaign.campaignName.replace(/[^a-z0-9]/gi, '_'));
		
		// Criar estrutura de diretórios
		try {
			await mkdir(campaignDir, { recursive: true });
		} catch (error) {
			// Diretório já existe, continuar
		}
		
		await writeFile(join(campaignDir, 'campaign.json'), JSON.stringify(campaign, null, 2));
		await writeFile(join(campaignDir, 'video-script.md'), this.formatVideoScript(campaign.videoScript));
		await writeFile(join(campaignDir, 'ad-copy.md'), this.formatAdCopy(campaign.adCopy));
		await writeFile(join(campaignDir, 'landing-page.md'), this.formatLandingPage(campaign.landingPage));
		await writeFile(join(campaignDir, 'email.md'), this.formatEmail(campaign.email));
		await writeFile(join(campaignDir, 'social-post.md'), this.formatSocialPost(campaign.socialPost));
		
		if (campaign.ebook) {
			await writeFile(join(campaignDir, 'ebook-outline.md'), this.formatEbookOutline(campaign.ebook));
		}
	}

	/**
	 * CARREGAR TEMPLATES DE COPY
	 */
	private loadCopyTemplates(): void {
		// Templates serão carregados de arquivo ou banco de dados
		// Por enquanto, placeholder
	}

	// Formatters
	private formatVideoScript(script: VideoScript): string {
		return `# ${script.title}\n\n**Duração:** ${script.duration}\n\n## Hook\n${script.hook}\n\n## Cenas\n\n${script.scenes.map(s => `### Cena ${s.sceneNumber} (${s.duration})\n- **Visual:** ${s.visual}\n- **Áudio:** ${s.audio}\n- **Texto:** ${s.text}\n`).join('\n')}\n\n## CTA\n${script.cta}`;
	}

	private formatAdCopy(copy: AdCopy): string {
		return `# Copy de Anúncio\n\n## Headline\n${copy.headline}\n\n## Subheadline\n${copy.subheadline}\n\n## Body\n${copy.body}\n\n## CTA\n${copy.cta}\n\n## Variações\n${copy.variations.map((v, i) => `${i + 1}. ${v}`).join('\n')}\n\n## Por Plataforma\n${Object.entries(copy.platforms).map(([p, c]) => `### ${p}\n${c}`).join('\n\n')}`;
	}

	private formatLandingPage(page: LandingPage): string {
		let content = `# ${page.title}\n\n## Hero\n**Headline:** ${page.heroHeadline}\n**Subheadline:** ${page.heroSubheadline}\n**CTA:** ${page.cta}\n\n## Seções\n\n`;
		
		for (const section of page.sections) {
			content += `### ${section.title}\n`;
			
			// Tratar conteúdo que pode ser string ou array de objetos
			if (typeof section.content === 'string') {
				content += `${section.content}\n`;
			} else if (Array.isArray(section.content)) {
				// Se for array de benefícios/testemunhos
				for (const item of section.content) {
					if (typeof item === 'object') {
						if (item.benefit) {
							content += `- **${item.benefit}:** ${item.description}\n`;
						} else if (item.testimonial) {
							content += `> "${item.testimonial}"\n> — ${item.author}\n\n`;
						} else if (item.stat) {
							content += `**${item.stat}** — ${item.description}\n\n`;
						} else {
							content += `${JSON.stringify(item, null, 2)}\n`;
						}
					} else {
						content += `${item}\n`;
					}
				}
			} else {
				content += `${section.content}\n`;
			}
			
			if (section.cta) {
				content += `\n**CTA:** ${section.cta}\n`;
			}
			content += '\n';
		}
		
		content += `## SEO\n**Meta Description:** ${page.metaDescription}\n**Keywords:** ${page.keywords.join(', ')}`;
		
		return content;
	}

	private formatEmail(email: Email): string {
		return `# E-mail Marketing\n\n**Subject:** ${email.subject}\n**Preheader:** ${email.preheader}\n\n---\n\n${email.greeting}\n\n${email.body}\n\n**${email.cta}**\n\n---\n\n${email.signature}`;
	}

	private formatSocialPost(post: SocialPost): string {
		return `# Post Social - ${post.platform}\n\n${post.content}\n\n${post.hashtags.join(' ')}\n\n${post.cta ? `**CTA:** ${post.cta}` : ''}`;
	}

	private formatEbookOutline(ebook: EbookOutline): string {
		return `# ${ebook.title}\n\n${ebook.description}\n\n## Capítulos\n\n${ebook.chapters.map(c => `### Capítulo ${c.chapterNumber}: ${c.title}\n**Palavras estimadas:** ${c.estimatedWords}\n\n**Pontos-chave:**\n${c.keyPoints.map(p => `- ${p}`).join('\n')}`).join('\n\n')}\n\n**Total de páginas:** ${ebook.totalPages}`;
	}
}
