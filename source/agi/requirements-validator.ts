/**
 * REQUIREMENTS VALIDATOR - Validação Inteligente de Requisitos
 * 
 * Compara os requisitos solicitados com o resultado entregue
 * e gera um relatório detalhado de conformidade.
 */

import { OpenAI } from 'openai';

export interface RequirementCheck {
	requirement: string;
	status: 'met' | 'partial' | 'missing';
	evidence: string;
	severity: 'critical' | 'important' | 'nice-to-have';
}

export interface ValidationReport {
	totalRequirements: number;
	metRequirements: number;
	partialRequirements: number;
	missingRequirements: number;
	conformancePercentage: number;
	checks: RequirementCheck[];
	recommendations: string[];
	shouldReplan: boolean;
	replanReason?: string;
}

export class RequirementsValidator {
	private openai: OpenAI;

	constructor(openai: OpenAI) {
		this.openai = openai;
	}

	/**
	 * Extrair requisitos do prompt original
	 */
	async extractRequirements(userPrompt: string): Promise<string[]> {
		const systemPrompt = `Você é um especialista em extração de requisitos.

Analise o prompt do usuário e extraia TODOS os requisitos explícitos e implícitos.

Responda em JSON com um array de requisitos:
{
  "requirements": [
    "requisito 1",
    "requisito 2",
    ...
  ]
}

Seja específico e inclua:
- Tipo de conteúdo (ebook, slides, vídeo, etc.)
- Extensão/tamanho (páginas, capítulos, duração)
- Elementos específicos (tabelas, exemplos, estudos de caso)
- Estilo/design (profissional, criativo, minimalista)
- Formato de saída (PDF, HTML, PowerPoint)
- Qualidade esperada (elegante, simples, detalhado)

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
				max_tokens: 1500
			});

			const content = response.choices[0]?.message?.content || '{"requirements": []}';
			const parsed = JSON.parse(content);
			return parsed.requirements || [];
		} catch (error) {
			console.error('[RequirementsValidator] Erro ao extrair requisitos:', error);
			return [];
		}
	}

	/**
	 * Validar resultado contra requisitos
	 */
	async validateResult(
		userPrompt: string,
		resultContent: string,
		contentType: string
	): Promise<ValidationReport> {
		// Extrair requisitos
		const requirements = await this.extractRequirements(userPrompt);

		if (requirements.length === 0) {
			return {
				totalRequirements: 0,
				metRequirements: 0,
				partialRequirements: 0,
				missingRequirements: 0,
				conformancePercentage: 100,
				checks: [],
				recommendations: [],
				shouldReplan: false
			};
		}

		// Validar cada requisito
		const checks = await this.validateEachRequirement(
			requirements,
			resultContent,
			contentType
		);

		// Calcular estatísticas
		const metCount = checks.filter(c => c.status === 'met').length;
		const partialCount = checks.filter(c => c.status === 'partial').length;
		const missingCount = checks.filter(c => c.status === 'missing').length;
		const conformancePercentage = Math.round(
			((metCount + partialCount * 0.5) / requirements.length) * 100
		);

		// Gerar recomendações
		const recommendations = this.generateRecommendations(checks);

		// Decidir se deve replanejar
		const criticalMissing = checks.filter(
			c => c.status === 'missing' && c.severity === 'critical'
		);
		const shouldReplan = criticalMissing.length > 0 || conformancePercentage < 60;

		return {
			totalRequirements: requirements.length,
			metRequirements: metCount,
			partialRequirements: partialCount,
			missingRequirements: missingCount,
			conformancePercentage,
			checks,
			recommendations,
			shouldReplan,
			replanReason: shouldReplan
				? `${criticalMissing.length} requisitos críticos não atendidos. Conformidade: ${conformancePercentage}%`
				: undefined
		};
	}

	/**
	 * Validar cada requisito contra o resultado
	 */
	private async validateEachRequirement(
		requirements: string[],
		resultContent: string,
		contentType: string
	): Promise<RequirementCheck[]> {
		const systemPrompt = `Você é um validador de requisitos.

Para cada requisito, analise se foi atendido no resultado.

Responda em JSON com um array de validações:
{
  "validations": [
    {
      "requirement": "requisito original",
      "status": "met|partial|missing",
      "evidence": "evidência do resultado ou razão da falha",
      "severity": "critical|important|nice-to-have"
    }
  ]
}

REGRAS:
- "met": Requisito completamente atendido
- "partial": Requisito parcialmente atendido
- "missing": Requisito não atendido
- Requisitos críticos: tipo de conteúdo, extensão mínima, elementos principais
- Requisitos importantes: qualidade, estilo, design
- Nice-to-have: otimizações, extras

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
						content: `Requisitos: ${requirements.join('\n')}

Tipo de conteúdo: ${contentType}

Resultado (primeiros 2000 caracteres):
${resultContent.substring(0, 2000)}`
					}
				],
				temperature: 0.3,
				max_tokens: 2000
			});

			const content = response.choices[0]?.message?.content || '{"validations": []}';
			const parsed = JSON.parse(content);
			return parsed.validations || [];
		} catch (error) {
			console.error('[RequirementsValidator] Erro ao validar requisitos:', error);
			// Retornar validações genéricas
			return requirements.map(req => ({
				requirement: req,
				status: 'partial' as const,
				evidence: 'Validação automática falhou',
				severity: 'important' as const
			}));
		}
	}

	/**
	 * Gerar recomendações baseado nas falhas
	 */
	private generateRecommendations(checks: RequirementCheck[]): string[] {
		const recommendations: string[] = [];

		const missingCritical = checks.filter(
			c => c.status === 'missing' && c.severity === 'critical'
		);
		const missingImportant = checks.filter(
			c => c.status === 'missing' && c.severity === 'important'
		);

		if (missingCritical.length > 0) {
			recommendations.push(
				`⚠️ CRÍTICO: ${missingCritical.length} requisito(s) crítico(s) não atendido(s). Replanejamento recomendado.`
			);
		}

		if (missingImportant.length > 0) {
			recommendations.push(
				`⚠️ IMPORTANTE: ${missingImportant.length} requisito(s) importante(s) não atendido(s). Considere refinar o resultado.`
			);
		}

		const partialChecks = checks.filter(c => c.status === 'partial');
		if (partialChecks.length > 0) {
			recommendations.push(
				`💡 ${partialChecks.length} requisito(s) parcialmente atendido(s). Refinamento pode melhorar a qualidade.`
			);
		}

		if (recommendations.length === 0) {
			recommendations.push('✅ Todos os requisitos foram atendidos com sucesso!');
		}

		return recommendations;
	}

	/**
	 * Formatar relatório para exibição
	 */
	formatReport(report: ValidationReport): string {
		let output = `
===========================================
📊 RELATÓRIO DE VALIDAÇÃO DE REQUISITOS
===========================================

📈 ESTATÍSTICAS:
  Total de Requisitos: ${report.totalRequirements}
  ✅ Atendidos: ${report.metRequirements}
  ⚠️  Parciais: ${report.partialRequirements}
  ❌ Faltando: ${report.missingRequirements}
  
  📊 Conformidade: ${report.conformancePercentage}%

📋 DETALHES:
`;

		for (const check of report.checks) {
			const statusIcon =
				check.status === 'met'
					? '✅'
					: check.status === 'partial'
						? '⚠️'
						: '❌';
			output += `
${statusIcon} ${check.requirement}
   Status: ${check.status.toUpperCase()}
   Evidência: ${check.evidence}
   Severidade: ${check.severity}`;
		}

		output += `

💡 RECOMENDAÇÕES:
`;
		for (const rec of report.recommendations) {
			output += `${rec}\n`;
		}

		if (report.shouldReplan) {
			output += `
🔄 REPLANEJAMENTO RECOMENDADO:
${report.replanReason}
`;
		}

		output += `
===========================================
`;

		return output;
	}
}
