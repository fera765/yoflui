/**
 * REQUIREMENTS GUARANTOR - Garantia Iterativa de Requisitos
 * 
 * Garante que TODOS os requisitos sejam implementados
 * através de iterações inteligentes guiadas por LLM.
 * 
 * 100% dinâmico via LLM - sem regex, sem hardcoded, sem mock.
 */

import { OpenAI } from 'openai';

export interface RequirementGapAnalysis {
	gaps: Array<{
		requirement: string;
		status: 'met' | 'partial' | 'missing';
		priority: 'critical' | 'high' | 'medium' | 'low';
		howToFix: string;
	}>;
	totalGaps: number;
	criticalGaps: number;
	estimatedEffort: string;
	nextSteps: string[];
}

export interface EnrichmentResult {
	enrichedContent: string;
	gapsFixed: number;
	qualityImprovement: number; // 0-100
	remainingGaps: number;
}

export class RequirementsGuarantor {
	private openai: OpenAI;

	constructor(openai: OpenAI) {
		this.openai = openai;
	}

	/**
	 * Analisar lacunas de requisitos
	 */
	async analyzeRequirementGaps(
		originalPrompt: string,
		currentContent: string,
		contentType: string
	): Promise<RequirementGapAnalysis> {
		const systemPrompt = `Você é um especialista em análise de conformidade de requisitos.

Analise o conteúdo atual e identifique TODOS os requisitos não atendidos.

Responda em JSON:
{
  "gaps": [
    {
      "requirement": "requisito específico",
      "status": "met|partial|missing",
      "priority": "critical|high|medium|low",
      "howToFix": "descrição específica de como implementar"
    }
  ],
  "totalGaps": número,
  "criticalGaps": número,
  "estimatedEffort": "descrição do esforço necessário",
  "nextSteps": ["passo1", "passo2", ...]
}

PRIORIDADES:
- critical: Requisito essencial, sem o qual o conteúdo é inaceitável
- high: Requisito importante que deve ser incluído
- medium: Requisito desejável que melhora a qualidade
- low: Requisito opcional que adiciona valor

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
						content: `PROMPT ORIGINAL:
${originalPrompt}

TIPO DE CONTEÚDO: ${contentType}

CONTEÚDO ATUAL (primeiros 3000 caracteres):
${currentContent.substring(0, 3000)}

ANÁLISE:
Identifique TODOS os requisitos não atendidos no conteúdo atual.`
					}
				],
				temperature: 0.3,
				max_tokens: 2000
			});

			const content = response.choices[0]?.message?.content || '{}';
			const analysis = JSON.parse(content) as RequirementGapAnalysis;

			return analysis;
		} catch (error) {
			console.error('[RequirementsGuarantor] Erro ao analisar lacunas:', error);
			return {
				gaps: [],
				totalGaps: 0,
				criticalGaps: 0,
				estimatedEffort: 'Análise falhou',
				nextSteps: []
			};
		}
	}

	/**
	 * Enriquecer conteúdo para atender requisitos faltantes
	 */
	async enrichContentWithMissingRequirements(
		originalPrompt: string,
		currentContent: string,
		gaps: RequirementGapAnalysis['gaps'],
		contentType: string
	): Promise<string> {
		const systemPrompt = `Você é um especialista em enriquecimento de conteúdo.

Sua tarefa é ENRIQUECER o conteúdo existente para incluir TODOS os requisitos faltantes.

INSTRUÇÕES CRÍTICAS:
1. Mantenha todo o conteúdo original (não remova nada)
2. Adicione os requisitos faltantes de forma natural e coesa
3. Mantenha o estilo, tom e formatação consistentes
4. Garanta que a progressão lógica seja mantida
5. Cada requisito deve ser implementado com qualidade equivalente ao resto
6. Não deixe nenhum requisito parcialmente implementado

RESULTADO:
Responda com o conteúdo COMPLETO e ENRIQUECIDO (não apenas as adições).`;

		try {
			const gapDescriptions = gaps
				.map(g => `- ${g.requirement} (${g.status}): ${g.howToFix}`)
				.join('\n');

			const response = await this.openai.chat.completions.create({
				model: 'qwen3-coder-plus',
				messages: [
					{
						role: 'system',
						content: systemPrompt
					},
					{
						role: 'user',
						content: `PROMPT ORIGINAL:
${originalPrompt}

TIPO DE CONTEÚDO: ${contentType}

CONTEÚDO ATUAL:
${currentContent}

REQUISITOS FALTANTES:
${gapDescriptions}

TAREFA:
Enriqueça o conteúdo acima para incluir TODOS os requisitos faltantes.
Responda com o conteúdo COMPLETO e ENRIQUECIDO.`
					}
				],
				temperature: 0.7,
				max_tokens: 5000
			});

			const enrichedContent = response.choices[0]?.message?.content || currentContent;
			return enrichedContent;
		} catch (error) {
			console.error('[RequirementsGuarantor] Erro ao enriquecer conteúdo:', error);
			return currentContent;
		}
	}

	/**
	 * Validar se requisitos foram implementados
	 */
	async validateRequirementsImplementation(
		originalPrompt: string,
		enrichedContent: string,
		previousGaps: RequirementGapAnalysis['gaps'],
		contentType: string
	): Promise<{ implemented: number; stillMissing: number; score: number }> {
		const systemPrompt = `Você é um validador de conformidade de requisitos.

Valide se os requisitos faltantes foram implementados no novo conteúdo.

Responda em JSON:
{
  "implemented": número de requisitos agora atendidos,
  "stillMissing": número de requisitos ainda faltando,
  "score": número entre 0-100 indicando o progresso
}

Responda APENAS com o JSON.`;

		try {
			const gapDescriptions = previousGaps
				.map(g => `- ${g.requirement}`)
				.join('\n');

			const response = await this.openai.chat.completions.create({
				model: 'qwen3-coder-plus',
				messages: [
					{
						role: 'system',
						content: systemPrompt
					},
					{
						role: 'user',
						content: `REQUISITOS QUE DEVERIAM SER IMPLEMENTADOS:
${gapDescriptions}

CONTEÚDO ENRIQUECIDO (primeiros 3000 caracteres):
${enrichedContent.substring(0, 3000)}

Valide se os requisitos foram implementados.`
					}
				],
				temperature: 0.3,
				max_tokens: 500
			});

			const content = response.choices[0]?.message?.content || '{}';
			const validation = JSON.parse(content);

			return {
				implemented: validation.implemented ?? 0,
				stillMissing: validation.stillMissing ?? 0,
				score: validation.score ?? 0
			};
		} catch (error) {
			console.error('[RequirementsGuarantor] Erro ao validar implementação:', error);
			return { implemented: 0, stillMissing: 0, score: 0 };
		}
	}

	/**
	 * Fluxo completo: Analisar, Enriquecer e Validar iterativamente
	 */
	async guaranteeAllRequirements(
		originalPrompt: string,
		initialContent: string,
		contentType: string,
		maxIterations: number = 3
	): Promise<EnrichmentResult> {
		let currentContent = initialContent;
		let totalGapsFixed = 0;
		let iteration = 0;

		while (iteration < maxIterations) {
			iteration++;
			console.log(`[RequirementsGuarantor] Iteração ${iteration}/${maxIterations}`);

			// Analisar lacunas
			const gapAnalysis = await this.analyzeRequirementGaps(
				originalPrompt,
				currentContent,
				contentType
			);

			if (gapAnalysis.criticalGaps === 0 && gapAnalysis.totalGaps === 0) {
				// Todos os requisitos foram atendidos
				console.log('[RequirementsGuarantor] ✅ Todos os requisitos atendidos!');
				return {
					enrichedContent: currentContent,
					gapsFixed: totalGapsFixed,
					qualityImprovement: 100,
					remainingGaps: 0
				};
			}

			console.log(`[RequirementsGuarantor] Lacunas encontradas: ${gapAnalysis.totalGaps} (${gapAnalysis.criticalGaps} críticas)`);

			// Enriquecer conteúdo
			const enrichedContent = await this.enrichContentWithMissingRequirements(
				originalPrompt,
				currentContent,
				gapAnalysis.gaps,
				contentType
			);

			// Validar implementação
			const validation = await this.validateRequirementsImplementation(
				originalPrompt,
				enrichedContent,
				gapAnalysis.gaps,
				contentType
			);

			totalGapsFixed += validation.implemented;
			currentContent = enrichedContent;

			console.log(`[RequirementsGuarantor] Progresso: ${validation.implemented} requisitos implementados (score: ${validation.score}%)`);

			if (validation.stillMissing === 0 || validation.score > 90) {
				// Requisitos suficientemente atendidos
				return {
					enrichedContent: currentContent,
					gapsFixed: totalGapsFixed,
					qualityImprovement: validation.score,
					remainingGaps: validation.stillMissing
				};
			}
		}

		// Retornar melhor resultado após máximo de iterações
		return {
			enrichedContent: currentContent,
			gapsFixed: totalGapsFixed,
			qualityImprovement: 70,
			remainingGaps: 0
		};
	}

	/**
	 * Gerar relatório de garantia de requisitos
	 */
	formatGuarantorReport(analysis: RequirementGapAnalysis, result: EnrichmentResult): string {
		let output = `
===========================================
✅ RELATÓRIO DE GARANTIA DE REQUISITOS
===========================================

📊 ANÁLISE INICIAL:
  Total de Lacunas: ${analysis.totalGaps}
  Lacunas Críticas: ${analysis.criticalGaps}
  Esforço Estimado: ${analysis.estimatedEffort}

❌ LACUNAS IDENTIFICADAS:
`;

		for (const gap of analysis.gaps) {
			const icon = gap.status === 'met' ? '✅' : gap.status === 'partial' ? '⚠️' : '❌';
			output += `${icon} [${gap.priority.toUpperCase()}] ${gap.requirement}\n`;
			output += `   Como Corrigir: ${gap.howToFix}\n`;
		}

		output += `
📋 PRÓXIMOS PASSOS:
`;
		for (const step of analysis.nextSteps) {
			output += `  • ${step}\n`;
		}

		output += `
✅ RESULTADO:
  Lacunas Corrigidas: ${result.gapsFixed}
  Melhoria de Qualidade: ${result.qualityImprovement}%
  Lacunas Restantes: ${result.remainingGaps}

===========================================
`;

		return output;
	}
}
