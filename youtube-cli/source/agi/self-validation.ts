import OpenAI from 'openai';
import { getConfig } from '../llm-config.js';

/**
 * SISTEMA DE AUTO-VALIDAÇÃO E VERIFICAÇÃO
 * 
 * Este módulo é responsável por:
 * 1. Validar resultados finais antes de entregar ao usuário
 * 2. Verificar completude e qualidade
 * 3. Detectar inconsistências ou lacunas
 * 4. Gerar relatórios de qualidade
 */

export interface ValidationReport {
	isValid: boolean;
	qualityScore: number; // 0-100
	completeness: number; // 0-100
	accuracy: number; // 0-100
	issues: ValidationIssue[];
	suggestions: string[];
	passedCriteria: string[];
	failedCriteria: string[];
}

export interface ValidationIssue {
	severity: 'critical' | 'warning' | 'info';
	category: 'completeness' | 'accuracy' | 'format' | 'logic';
	description: string;
	location?: string;
	suggestedFix?: string;
}

export class SelfValidationSystem {
	private openai: OpenAI;

	constructor(openai: OpenAI) {
		this.openai = openai;
	}

	/**
	 * Validar resultado final antes de entregar ao usuário
	 * 
	 * Verifica:
	 * 1. Todos os critérios de sucesso foram atendidos?
	 * 2. O resultado está completo?
	 * 3. A qualidade está adequada?
	 * 4. Há inconsistências ou erros?
	 */
	async validateFinalResult(
		userGoal: string,
		successCriteria: string[],
		finalResult: string,
		intermediateSteps: string[]
	): Promise<ValidationReport> {
		const config = getConfig();

		// FASE 1: Validações rápidas (sem LLM)
		const quickValidation = this.quickValidation(finalResult, successCriteria);

		if (quickValidation.qualityScore >= 90) {
			// Alta confiança na validação rápida
			return quickValidation;
		}

		// FASE 2: Validação profunda com LLM
		const validationPrompt = `Você é o Sistema de Auto-Validação do FLUI AGI.

OBJETIVO DO USUÁRIO:
${userGoal}

CRITÉRIOS DE SUCESSO ESPERADOS:
${successCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

RESULTADO FINAL GERADO:
"""
${finalResult.substring(0, 2000)}
"""

ETAPAS INTERMEDIÁRIAS (contexto):
${intermediateSteps.slice(0, 3).join('\n---\n')}

Avalie o resultado final e retorne APENAS um JSON:
{
  "isValid": true/false,
  "qualityScore": 0-100,
  "completeness": 0-100,
  "accuracy": 0-100,
  "issues": [
    {
      "severity": "critical|warning|info",
      "category": "completeness|accuracy|format|logic",
      "description": "descrição do problema",
      "suggestedFix": "como corrigir"
    }
  ],
  "suggestions": ["sugestão 1", "sugestão 2"],
  "passedCriteria": ["critério que passou"],
  "failedCriteria": ["critério que falhou"]
}

Critérios de avaliação:
- qualityScore: Nota geral 0-100
- completeness: O resultado responde TUDO que foi pedido?
- accuracy: As informações estão corretas?
- issues: Problemas específicos encontrados
- suggestions: Como melhorar o resultado`;

		try {
			const response = await this.openai.chat.completions.create({
				model: config.model || 'qwen-max',
				messages: [{ role: 'user', content: validationPrompt }],
				temperature: 0.1,
			});

			const content = response.choices[0]?.message?.content || '{}';
			const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
			const validation: ValidationReport = JSON.parse(cleanContent);

			return validation;
		} catch (error) {
			// Fallback: retornar validação rápida
			return quickValidation;
		}
	}

	/**
	 * Validação rápida (baseada em heurísticas)
	 */
	private quickValidation(
		result: string,
		successCriteria: string[]
	): ValidationReport {
		const issues: ValidationIssue[] = [];
		const passedCriteria: string[] = [];
		const failedCriteria: string[] = [];

		// 1. Verificar se resultado não está vazio
		if (!result || result.trim().length < 20) {
			issues.push({
				severity: 'critical',
				category: 'completeness',
				description: 'Resultado vazio ou muito curto',
				suggestedFix: 'Regenerar resultado com mais informações',
			});
			failedCriteria.push('Resultado deve ter conteúdo significativo');
		} else {
			passedCriteria.push('Resultado tem conteúdo significativo');
		}

		// 2. Verificar presença de placeholders
		const placeholderPatterns = [
			/\{\{[^}]+\}\}/g,
			/<[A-Z_]+>/g,
			/YOUR_[A-Z_]+/g,
			/\[YOUR [^\]]+\]/gi,
		];

		for (const pattern of placeholderPatterns) {
			if (pattern.test(result)) {
				issues.push({
					severity: 'critical',
					category: 'completeness',
					description: 'Placeholders não substituídos detectados',
					suggestedFix: 'Substituir todos os placeholders com valores reais',
				});
				failedCriteria.push('Não deve conter placeholders');
				break;
			}
		}

		if (issues.length === 0 || !failedCriteria.includes('Não deve conter placeholders')) {
			passedCriteria.push('Sem placeholders detectados');
		}

		// 3. Verificar palavras-chave dos critérios no resultado
		for (const criterion of successCriteria) {
			const keywords = this.extractKeywords(criterion);
			const hasKeywords = keywords.some(kw => 
				result.toLowerCase().includes(kw.toLowerCase())
			);

			if (hasKeywords) {
				passedCriteria.push(criterion);
			} else {
				failedCriteria.push(criterion);
				issues.push({
					severity: 'warning',
					category: 'completeness',
					description: `Critério pode não ter sido atendido: ${criterion}`,
					suggestedFix: 'Verificar se o critério foi realmente atendido',
				});
			}
		}

		// 4. Verificar erros explícitos
		if (result.toLowerCase().includes('error:') || 
		    result.toLowerCase().includes('failed:')) {
			issues.push({
				severity: 'critical',
				category: 'logic',
				description: 'Mensagens de erro detectadas no resultado',
				suggestedFix: 'Investigar e corrigir os erros antes de entregar',
			});
		}

		// Calcular scores
		const criticalIssues = issues.filter(i => i.severity === 'critical').length;
		const warningIssues = issues.filter(i => i.severity === 'warning').length;

		const qualityScore = Math.max(0, 100 - (criticalIssues * 30) - (warningIssues * 10));
		const completeness = Math.max(0, 100 - (failedCriteria.length * 20));
		const accuracy = criticalIssues === 0 ? 90 : 60;

		return {
			isValid: criticalIssues === 0 && qualityScore >= 70,
			qualityScore,
			completeness,
			accuracy,
			issues,
			suggestions: issues.map(i => i.suggestedFix).filter(Boolean) as string[],
			passedCriteria,
			failedCriteria,
		};
	}

	/**
	 * Extrair palavras-chave de um critério
	 */
	private extractKeywords(criterion: string): string[] {
		// Remover stopwords e extrair palavras significativas
		const stopwords = ['o', 'a', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não'];
		
		const words = criterion.toLowerCase()
			.replace(/[^\w\s]/g, ' ')
			.split(/\s+/)
			.filter(w => w.length > 3 && !stopwords.includes(w));
		
		return words;
	}

	/**
	 * Validar consistência entre etapas intermediárias
	 * 
	 * Detecta se há contradições ou inconsistências entre diferentes
	 * etapas da execução
	 */
	async validateConsistency(
		steps: Array<{ title: string; result: string }>
	): Promise<{ consistent: boolean; issues: string[] }> {
		// Validação rápida: verificar se há contradições óbvias
		const issues: string[] = [];

		// Verificar se etapas subsequentes contradizem anteriores
		for (let i = 1; i < steps.length; i++) {
			const prevResult = steps[i - 1].result.toLowerCase();
			const currResult = steps[i].result.toLowerCase();

			// Detectar contradições simples
			if (prevResult.includes('não encontrado') && currResult.includes('encontrado')) {
				issues.push(`Possível contradição entre "${steps[i-1].title}" e "${steps[i].title}"`);
			}

			if (prevResult.includes('criado com sucesso') && currResult.includes('arquivo não existe')) {
				issues.push(`Inconsistência: recurso criado mas não encontrado posteriormente`);
			}
		}

		return {
			consistent: issues.length === 0,
			issues,
		};
	}

	/**
	 * Gerar relatório de qualidade formatado
	 */
	generateQualityReport(validation: ValidationReport): string {
		const lines: string[] = [];

		lines.push('## 📊 RELATÓRIO DE QUALIDADE\n');

		// Scores
		lines.push(`**Qualidade Geral:** ${validation.qualityScore}/100 ${this.getScoreEmoji(validation.qualityScore)}`);
		lines.push(`**Completude:** ${validation.completeness}/100`);
		lines.push(`**Precisão:** ${validation.accuracy}/100`);
		lines.push('');

		// Status
		const status = validation.isValid ? '✅ APROVADO' : '❌ REQUER REVISÃO';
		lines.push(`**Status:** ${status}\n`);

		// Critérios atendidos
		if (validation.passedCriteria.length > 0) {
			lines.push('### ✅ Critérios Atendidos:');
			for (const criterion of validation.passedCriteria) {
				lines.push(`- ${criterion}`);
			}
			lines.push('');
		}

		// Critérios não atendidos
		if (validation.failedCriteria.length > 0) {
			lines.push('### ❌ Critérios Não Atendidos:');
			for (const criterion of validation.failedCriteria) {
				lines.push(`- ${criterion}`);
			}
			lines.push('');
		}

		// Issues
		if (validation.issues.length > 0) {
			lines.push('### ⚠️ Problemas Identificados:');
			for (const issue of validation.issues) {
				const emoji = this.getIssueEmoji(issue.severity);
				lines.push(`${emoji} **${issue.category}**: ${issue.description}`);
				if (issue.suggestedFix) {
					lines.push(`  → _Sugestão: ${issue.suggestedFix}_`);
				}
			}
			lines.push('');
		}

		// Sugestões
		if (validation.suggestions.length > 0) {
			lines.push('### 💡 Sugestões de Melhoria:');
			for (const suggestion of validation.suggestions) {
				lines.push(`- ${suggestion}`);
			}
		}

		return lines.join('\n');
	}

	private getScoreEmoji(score: number): string {
		if (score >= 90) return '🌟';
		if (score >= 75) return '✅';
		if (score >= 60) return '⚠️';
		return '❌';
	}

	private getIssueEmoji(severity: string): string {
		switch (severity) {
			case 'critical': return '🔴';
			case 'warning': return '🟡';
			case 'info': return '🔵';
			default: return '⚪';
		}
	}
}
