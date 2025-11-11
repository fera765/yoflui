/**
 * MARKETING QUALITY VALIDATOR
 * Validador específico para conteúdo de marketing
 * Valida: CTR potencial, coesão narrativa, estrutura AIDA/PAS, etc.
 */

import OpenAI from 'openai';
import { getConfig } from '../llm-config.js';
import { ContentQualityResult } from '../agi/content-quality-validator.js';

export interface MarketingQualityResult {
	overallScore: number; // 0-100
	ctrPotential: number; // CTR estimado em %
	cohesionScore: number; // Coesão narrativa 0-100
	structureScore: number; // Estrutura (AIDA/PAS/etc) 0-100
	emotionalAppeal: number; // Apelo emocional 0-100
	clarityScore: number; // Clareza da mensagem 0-100
	ctaEffectiveness: number; // Efetividade do CTA 0-100
	issues: MarketingIssue[];
	suggestions: string[];
	viralPotential: number; // Potencial viral 0-100
}

export interface MarketingIssue {
	type: 'low_ctr' | 'weak_hook' | 'poor_structure' | 'unclear_message' | 'weak_cta' | 'low_emotion';
	severity: 'critical' | 'high' | 'medium' | 'low';
	description: string;
	suggestion: string;
	location?: string;
}

export class MarketingQualityValidator {
	private openai: OpenAI;

	constructor(openai: OpenAI) {
		this.openai = openai;
	}

	/**
	 * VALIDAR COPY DE ANÚNCIO
	 */
	async validateAdCopy(copy: {
		headline: string;
		subheadline?: string;
		body: string;
		cta: string;
	}): Promise<MarketingQualityResult> {
		const prompt = `Você é um especialista em validação de copy de marketing com expertise em anúncios que convertem >5% CTR.

Analise este copy de anúncio:

HEADLINE: ${copy.headline}
SUBHEADLINE: ${copy.subheadline || 'N/A'}
BODY: ${copy.body}
CTA: ${copy.cta}

Avalie e retorne JSON com:
{
  "overallScore": 0-100,
  "ctrPotential": 0-10 (CTR estimado em %),
  "cohesionScore": 0-100,
  "structureScore": 0-100,
  "emotionalAppeal": 0-100,
  "clarityScore": 0-100,
  "ctaEffectiveness": 0-100,
  "viralPotential": 0-100,
  "issues": [
    {
      "type": "low_ctr" | "weak_hook" | "poor_structure" | "unclear_message" | "weak_cta" | "low_emotion",
      "severity": "critical" | "high" | "medium" | "low",
      "description": "Descrição do problema",
      "suggestion": "Sugestão de melhoria"
    }
  ],
  "suggestions": ["Sugestão 1", "Sugestão 2"]
}

Critérios:
- CTR Potential: Headline deve ser irresistível, criar curiosidade ou urgência
- Structure: Deve seguir AIDA, PAS ou outra fórmula comprovada
- Emotional Appeal: Deve conectar emocionalmente com o público
- CTA: Deve ser claro, urgente e acionável
- Viral Potential: Deve ter elementos que incentivam compartilhamento`;

		const response = await this.openai.chat.completions.create({
			model: getConfig().model || 'gpt-4',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.3,
			max_tokens: 2000
		});

		const content = response.choices[0]?.message?.content || '{}';
		const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		return JSON.parse(cleanContent);
	}

	/**
	 * VALIDAR SCRIPT DE VÍDEO
	 */
	async validateVideoScript(script: {
		hook: string;
		scenes: any[];
		cta: string;
	}): Promise<MarketingQualityResult> {
		const prompt = `Você é um especialista em validação de scripts de vídeo virais.

Analise este script:

HOOK (primeiros 3s): ${script.hook}
CENAS: ${JSON.stringify(script.scenes)}
CTA: ${script.cta}

Avalie:
- Hook deve prender atenção em 3 segundos
- Estrutura deve seguir: Problema → Solução → Benefício → Ação
- CTA deve ser claro e acionável
- Potencial viral (compartilhamento)

Retorne JSON com mesma estrutura do validateAdCopy.`;

		const response = await this.openai.chat.completions.create({
			model: getConfig().model || 'gpt-4',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.3,
			max_tokens: 2000
		});

		const content = response.choices[0]?.message?.content || '{}';
		const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		return JSON.parse(cleanContent);
	}

	/**
	 * VALIDAR LANDING PAGE
	 */
	async validateLandingPage(page: {
		heroHeadline: string;
		sections: any[];
		cta: string;
	}): Promise<MarketingQualityResult> {
		const prompt = `Você é um especialista em landing pages de alta conversão (>5%).

Analise esta landing page:

HERO HEADLINE: ${page.heroHeadline}
SEÇÕES: ${JSON.stringify(page.sections)}
CTA: ${page.cta}

Avalie:
- Hero deve comunicar valor imediatamente
- Estrutura AIDA clara
- CTA visível e efetivo
- Fluxo lógico até conversão

Retorne JSON com mesma estrutura.`;

		const response = await this.openai.chat.completions.create({
			model: getConfig().model || 'gpt-4',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.3,
			max_tokens: 2000
		});

		const content = response.choices[0]?.message?.content || '{}';
		const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		return JSON.parse(cleanContent);
	}

	/**
	 * VALIDAR CAMPANHA COMPLETA
	 */
	async validateCampaign(campaign: any): Promise<MarketingQualityResult> {
		// Validar cada formato
		const [adCopyResult, videoResult, landingResult] = await Promise.all([
			this.validateAdCopy(campaign.adCopy),
			this.validateVideoScript(campaign.videoScript),
			this.validateLandingPage(campaign.landingPage)
		]);

		// Calcular score geral (média ponderada)
		const overallScore = (
			adCopyResult.overallScore * 0.4 +
			videoResult.overallScore * 0.3 +
			landingResult.overallScore * 0.3
		);

		// Combinar issues
		const allIssues = [
			...adCopyResult.issues.map(i => ({ ...i, location: 'ad-copy' })),
			...videoResult.issues.map(i => ({ ...i, location: 'video-script' })),
			...landingResult.issues.map(i => ({ ...i, location: 'landing-page' }))
		];

		// Combinar sugestões
		const allSuggestions = [
			...adCopyResult.suggestions,
			...videoResult.suggestions,
			...landingResult.suggestions
		];

		return {
			overallScore: Math.round(overallScore),
			ctrPotential: adCopyResult.ctrPotential,
			cohesionScore: campaign.cohesionScore || 0,
			structureScore: Math.round((adCopyResult.structureScore + videoResult.structureScore + landingResult.structureScore) / 3),
			emotionalAppeal: Math.round((adCopyResult.emotionalAppeal + videoResult.emotionalAppeal + landingResult.emotionalAppeal) / 3),
			clarityScore: Math.round((adCopyResult.clarityScore + videoResult.clarityScore + landingResult.clarityScore) / 3),
			ctaEffectiveness: Math.round((adCopyResult.ctaEffectiveness + videoResult.ctaEffectiveness + landingResult.ctaEffectiveness) / 3),
			viralPotential: Math.round((adCopyResult.viralPotential + videoResult.viralPotential) / 2),
			issues: allIssues,
			suggestions: [...new Set(allSuggestions)] // Remover duplicatas
		};
	}
}
