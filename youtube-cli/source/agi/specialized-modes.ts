/**
 * Specialized Modes - Modos especializados por domínio
 * 
 * Diferentes configurações de comportamento para contextos específicos:
 * - Academic: Pesquisa acadêmica rigorosa
 * - Developer: Desenvolvimento de software
 * - Research: Pesquisa geral com citations
 * - Creative: Tarefas criativas (copy, design, conteúdo)
 * - Business: Análises de negócio e relatórios
 */

export type SpecializedMode = 'academic' | 'developer' | 'research' | 'creative' | 'business' | 'default';

export interface ModeConfig {
	name: string;
	description: string;
	systemPromptModifier: string;
	temperature: number;
	requireCitations: boolean;
	autoValidateCode: boolean;
	formalLanguage: boolean;
	focusAreas: string[];
	preferredTools: string[];
	outputFormat: string;
}

/**
 * Configurações de cada modo especializado
 */
export const SPECIALIZED_MODES: Record<SpecializedMode, ModeConfig> = {
	academic: {
		name: 'Academic Mode',
		description: 'Pesquisa acadêmica com rigor científico e citations obrigatórias',
		systemPromptModifier: `
Você está em MODO ACADÊMICO. Siga estes princípios rigorosamente:

1. CITATIONS OBRIGATÓRIAS: Toda informação factual DEVE ter citation [N]
2. RIGOR CIENTÍFICO: Use metodologia clara e verificável
3. MÚLTIPLAS FONTES: Sempre consulte pelo menos 3 fontes independentes
4. LINGUAGEM FORMAL: Tom acadêmico, sem informalidades
5. ESTRUTURA CLARA: Introdução, Metodologia, Resultados, Conclusão
6. IMPARCIALIDADE: Apresente múltiplas perspectivas
7. REFERÊNCIAS: Liste todas as referências no formato ABNT/APA

NUNCA faça afirmações sem citations. Se não encontrar fontes, declare explicitamente.
		`,
		temperature: 0.2, // Muito preciso
		requireCitations: true,
		autoValidateCode: false,
		formalLanguage: true,
		focusAreas: ['research', 'analysis', 'methodology', 'evidence'],
		preferredTools: ['research_with_citations', 'intelligent_web_research', 'web_scraper'],
		outputFormat: 'structured_academic'
	},
	
	developer: {
		name: 'Developer Mode',
		description: 'Desenvolvimento de software com best practices e auto-testing',
		systemPromptModifier: `
Você está em MODO DESENVOLVEDOR. Siga estes princípios:

1. CÓDIGO LIMPO: Sempre aplique Clean Code principles
2. BEST PRACTICES: Use padrões de projeto e convenções
3. TESTES: Sugira/crie testes para código crítico
4. DOCUMENTAÇÃO: Comente código complexo, documente APIs
5. PERFORMANCE: Considere performance e escalabilidade
6. SEGURANÇA: Valide inputs, evite vulnerabilidades
7. TYPE SAFETY: Prefira TypeScript, use tipos estritos
8. AUTO-VALIDATION: Código será validado automaticamente

Sempre explique decisões técnicas e trade-offs.
		`,
		temperature: 0.1, // Extremamente preciso
		requireCitations: false,
		autoValidateCode: true,
		formalLanguage: false,
		focusAreas: ['code_quality', 'architecture', 'testing', 'documentation'],
		preferredTools: ['write_file', 'read_file', 'edit_file', 'execute_shell', 'find_files'],
		outputFormat: 'code_with_docs'
	},
	
	research: {
		name: 'Research Mode',
		description: 'Pesquisa geral com citations e verificação de fontes',
		systemPromptModifier: `
Você está em MODO PESQUISA. Siga estes princípios:

1. MÚLTIPLAS FONTES: Consulte diversas fontes independentes
2. CITATIONS: Cite fontes para informações importantes [N]
3. VERIFICAÇÃO: Cross-check informações entre fontes
4. ATUALIZAÇÃO: Prefira informações recentes e atualizadas
5. CREDIBILIDADE: Avalie credibilidade das fontes
6. SÍNTESE: Sintetize informações de forma clara
7. TRANSPARÊNCIA: Indique quando há incerteza ou conflito entre fontes

Seja completo mas conciso. Qualidade > Quantidade.
		`,
		temperature: 0.3,
		requireCitations: true,
		autoValidateCode: false,
		formalLanguage: false,
		focusAreas: ['research', 'synthesis', 'verification', 'sources'],
		preferredTools: ['research_with_citations', 'intelligent_web_research', 'web_scraper'],
		outputFormat: 'research_report'
	},
	
	creative: {
		name: 'Creative Mode',
		description: 'Tarefas criativas: copywriting, conteúdo, design, storytelling',
		systemPromptModifier: `
Você está em MODO CRIATIVO. Siga estes princípios:

1. ORIGINALIDADE: Seja criativo e original
2. STORYTELLING: Use narrativas envolventes quando apropriado
3. PERSUASÃO: Aplique técnicas de copywriting (AIDA, PAS)
4. EMOÇÃO: Conecte-se emocionalmente com o público
5. CLAREZA: Criatividade não sacrifica clareza
6. ADAPTAÇÃO: Adapte tom e estilo ao público-alvo
7. IMPACTO: Foque em criar impacto e memorabilidade

Seja ousado mas estratégico. Criatividade com propósito.
		`,
		temperature: 0.7, // Mais criativo
		requireCitations: false,
		autoValidateCode: false,
		formalLanguage: false,
		focusAreas: ['creativity', 'storytelling', 'persuasion', 'impact'],
		preferredTools: ['write_file', 'web_scraper'],
		outputFormat: 'creative_content'
	},
	
	business: {
		name: 'Business Mode',
		description: 'Análises de negócio, relatórios, estratégia',
		systemPromptModifier: `
Você está em MODO BUSINESS. Siga estes princípios:

1. DADOS: Base análises em dados concretos
2. ROI: Considere retorno sobre investimento
3. ACIONÁVEL: Insights devem ser acionáveis
4. EXECUTIVO: Seja conciso, executivos têm pouco tempo
5. ESTRUTURA: Use frameworks (SWOT, Porter, etc)
6. VISÃO: Considere short-term e long-term
7. RISCO: Identifique riscos e mitigações

Seja prático, objetivo e focado em resultados de negócio.
		`,
		temperature: 0.4,
		requireCitations: false,
		autoValidateCode: false,
		formalLanguage: true,
		focusAreas: ['analysis', 'strategy', 'roi', 'actionable'],
		preferredTools: ['web_scraper', 'intelligent_web_research', 'write_file'],
		outputFormat: 'business_report'
	},
	
	default: {
		name: 'Default Mode',
		description: 'Modo padrão, balanceado para uso geral',
		systemPromptModifier: '',
		temperature: 0.5,
		requireCitations: false,
		autoValidateCode: false,
		formalLanguage: false,
		focusAreas: [],
		preferredTools: [],
		outputFormat: 'default'
	}
};

/**
 * Detecta modo apropriado baseado no prompt do usuário
 */
export function detectMode(prompt: string): SpecializedMode {
	const lowerPrompt = prompt.toLowerCase();
	
	// Academic keywords
	if (
		lowerPrompt.includes('pesquisa acadêmica') ||
		lowerPrompt.includes('paper') ||
		lowerPrompt.includes('artigo científico') ||
		lowerPrompt.includes('revisão de literatura') ||
		lowerPrompt.includes('metodologia') ||
		lowerPrompt.includes('referências bibliográficas')
	) {
		return 'academic';
	}
	
	// Developer keywords
	if (
		lowerPrompt.includes('código') ||
		lowerPrompt.includes('programar') ||
		lowerPrompt.includes('desenvolver') ||
		lowerPrompt.includes('app') ||
		lowerPrompt.includes('api') ||
		lowerPrompt.includes('frontend') ||
		lowerPrompt.includes('backend') ||
		lowerPrompt.includes('bug') ||
		lowerPrompt.includes('debug')
	) {
		return 'developer';
	}
	
	// Creative keywords
	if (
		lowerPrompt.includes('copy') ||
		lowerPrompt.includes('criativo') ||
		lowerPrompt.includes('storytelling') ||
		lowerPrompt.includes('campanha') ||
		lowerPrompt.includes('conteúdo') ||
		lowerPrompt.includes('persuasivo') ||
		lowerPrompt.includes('marketing')
	) {
		return 'creative';
	}
	
	// Business keywords
	if (
		lowerPrompt.includes('análise de negócio') ||
		lowerPrompt.includes('business') ||
		lowerPrompt.includes('estratégia') ||
		lowerPrompt.includes('roi') ||
		lowerPrompt.includes('mercado') ||
		lowerPrompt.includes('competitivo') ||
		lowerPrompt.includes('swot')
	) {
		return 'business';
	}
	
	// Research keywords
	if (
		lowerPrompt.includes('pesquise') ||
		lowerPrompt.includes('investigue') ||
		lowerPrompt.includes('compare') ||
		lowerPrompt.includes('analise') ||
		lowerPrompt.includes('estude')
	) {
		return 'research';
	}
	
	return 'default';
}

/**
 * Obtém configuração do modo
 */
export function getModeConfig(mode: SpecializedMode): ModeConfig {
	return SPECIALIZED_MODES[mode];
}

/**
 * Aplica configuração do modo ao orchestrator
 */
export function applyModeToPrompt(userPrompt: string, mode: SpecializedMode): {
	enhancedPrompt: string;
	config: ModeConfig;
} {
	const config = getModeConfig(mode);
	
	let enhancedPrompt = userPrompt;
	
	if (config.systemPromptModifier) {
		enhancedPrompt = `${config.systemPromptModifier}\n\nUSER REQUEST: ${userPrompt}`;
	}
	
	return {
		enhancedPrompt,
		config
	};
}

/**
 * Formata saída baseado no modo
 */
export function formatOutputForMode(
	content: string,
	mode: SpecializedMode,
	metadata?: {
		sources?: string[];
		validationResult?: any;
		executionTime?: number;
	}
): string {
	const config = getModeConfig(mode);
	const lines: string[] = [];
	
	// Header com modo
	lines.push(`\n# 🎯 ${config.name}\n`);
	
	// Conteúdo principal
	lines.push(content);
	lines.push('\n');
	
	// Footer com metadata por modo
	switch (mode) {
		case 'academic':
			if (metadata?.sources && metadata.sources.length > 0) {
				lines.push('## 📚 Referências\n');
				metadata.sources.forEach((source, idx) => {
					lines.push(`[${idx + 1}] ${source}`);
				});
			}
			break;
		
		case 'developer':
			if (metadata?.validationResult) {
				lines.push('## ✅ Validação de Código\n');
				lines.push(`Score: ${metadata.validationResult.score}/100`);
				if (metadata.validationResult.isValid) {
					lines.push('Status: ✅ Código válido');
				} else {
					lines.push('Status: ⚠️ Revisar recomendado');
				}
			}
			break;
		
		case 'research':
			if (metadata?.sources && metadata.sources.length > 0) {
				lines.push('## 🔍 Fontes Consultadas\n');
				metadata.sources.forEach(source => {
					lines.push(`- ${source}`);
				});
			}
			break;
	}
	
	// Execution time (todos os modos)
	if (metadata?.executionTime) {
		lines.push(`\n*Executado em ${(metadata.executionTime / 1000).toFixed(2)}s no modo ${config.name}*`);
	}
	
	return lines.join('\n');
}
