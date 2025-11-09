/**
 * Task Validator - Valida se todos os requisitos foram cumpridos
 * 
 * Evita que FLUI pare prematuramente em tarefas complexas
 */

export interface TaskRequirement {
	description: string;
	keywords: string[];
	priority: 'critical' | 'high' | 'medium';
}

export interface ValidationResult {
	complete: boolean;
	completionRate: number; // 0-100
	metRequirements: TaskRequirement[];
	missingRequirements: TaskRequirement[];
	suggestions: string[];
}

/**
 * Extrai requisitos do prompt do usuário
 */
export function extractRequirements(prompt: string): TaskRequirement[] {
	const requirements: TaskRequirement[] = [];
	
	// Detectar listas numeradas: 1), 2), 3) ou 1., 2., 3.
	const numberedItems = prompt.match(/(\d+[.)]\s+[^\n]+)/g) || [];
	
	for (const item of numberedItems) {
		// Remover número e pontuação
		const description = item.replace(/^\d+[.)]\s+/, '').trim();
		
		// Extrair keywords importantes
		const keywords = extractKeywords(description);
		
		// Determinar prioridade baseado em keywords
		const priority = determinePriority(description);
		
		requirements.push({
			description,
			keywords,
			priority
		});
	}
	
	// Se não tem lista numerada, extrair requisitos gerais
	if (requirements.length === 0) {
		requirements.push(...extractGeneralRequirements(prompt));
	}
	
	return requirements;
}

/**
 * Extrai keywords importantes de uma descrição
 */
function extractKeywords(description: string): string[] {
	const keywords: string[] = [];
	const lowerDesc = description.toLowerCase();
	
	// Keywords de ação
	const actionKeywords = [
		'criar', 'create', 'implementar', 'implement', 'adicionar', 'add',
		'configurar', 'configure', 'instalar', 'install', 'gerar', 'generate',
		'desenvolver', 'develop', 'construir', 'build', 'escrever', 'write'
	];
	
	// Keywords de estrutura/componentes
	const structureKeywords = [
		'header', 'footer', 'nav', 'navigation', 'hero', 'section', 'card',
		'component', 'page', 'landing', 'form', 'button', 'input',
		'dark', 'light', 'theme', 'toggle', 'responsive', 'mobile',
		'animation', 'animação', 'tailwind', 'css', 'style'
	];
	
	// Keywords de conteúdo
	const contentKeywords = [
		'capítulo', 'chapter', 'seção', 'section', 'introdução', 'introduction',
		'conclusão', 'conclusion', 'exemplo', 'example', 'receita', 'recipe',
		'depoimento', 'testimonial', 'feature', 'funcionalidade'
	];
	
	// Extrair keywords encontradas
	[...actionKeywords, ...structureKeywords, ...contentKeywords].forEach(keyword => {
		if (lowerDesc.includes(keyword)) {
			keywords.push(keyword);
		}
	});
	
	return keywords;
}

/**
 * Determina prioridade do requisito
 */
function determinePriority(description: string): 'critical' | 'high' | 'medium' {
	const lowerDesc = description.toLowerCase();
	
	// Critical: itens essenciais para funcionalidade básica
	const criticalKeywords = [
		'obrigatório', 'required', 'essencial', 'essential', 'crítico', 'critical',
		'mínimo', 'minimum', 'deve', 'must', 'precisa', 'need'
	];
	
	if (criticalKeywords.some(k => lowerDesc.includes(k))) {
		return 'critical';
	}
	
	// High: itens importantes
	const highKeywords = [
		'importante', 'important', 'principal', 'main', 'key', 'chave'
	];
	
	if (highKeywords.some(k => lowerDesc.includes(k))) {
		return 'high';
	}
	
	return 'medium';
}

/**
 * Extrai requisitos gerais quando não há lista numerada
 */
function extractGeneralRequirements(prompt: string): TaskRequirement[] {
	const requirements: TaskRequirement[] = [];
	
	// Detectar palavras-chave de requisitos
	const patterns = [
		{ pattern: /criar|create/i, desc: 'Criar estrutura básica', priority: 'critical' as const },
		{ pattern: /implementar|implement/i, desc: 'Implementar funcionalidades', priority: 'high' as const },
		{ pattern: /configurar|configure/i, desc: 'Configurar ambiente/ferramentas', priority: 'critical' as const },
		{ pattern: /estilo|style|css|tailwind/i, desc: 'Estilização', priority: 'high' as const },
		{ pattern: /responsive|responsivo/i, desc: 'Responsividade', priority: 'high' as const },
		{ pattern: /component/i, desc: 'Criar componentes', priority: 'critical' as const }
	];
	
	for (const { pattern, desc, priority } of patterns) {
		if (pattern.test(prompt)) {
			requirements.push({
				description: desc,
				keywords: [pattern.source.replace(/[|\\]/g, ' ').trim()],
				priority
			});
		}
	}
	
	return requirements;
}

/**
 * Valida se requisitos foram cumpridos baseado nos steps executados
 */
export function validateTaskCompletion(
	originalPrompt: string,
	executedSteps: any[],
	finalResult?: string
): ValidationResult {
	const requirements = extractRequirements(originalPrompt);
	
	if (requirements.length === 0) {
		// Se não conseguiu extrair requisitos, assume completo
		return {
			complete: true,
			completionRate: 100,
			metRequirements: [],
			missingRequirements: [],
			suggestions: []
		};
	}
	
	const metRequirements: TaskRequirement[] = [];
	const missingRequirements: TaskRequirement[] = [];
	
	// Verificar cada requisito
	for (const requirement of requirements) {
		const isMet = checkRequirementMet(requirement, executedSteps, finalResult);
		
		if (isMet) {
			metRequirements.push(requirement);
		} else {
			missingRequirements.push(requirement);
		}
	}
	
	// Calcular taxa de conclusão
	const completionRate = (metRequirements.length / requirements.length) * 100;
	
	// Determinar se está completo (mínimo 80% dos críticos + 60% do total)
	const criticalReqs = requirements.filter(r => r.priority === 'critical');
	const metCritical = metRequirements.filter(r => r.priority === 'critical');
	const criticalRate = criticalReqs.length > 0 
		? (metCritical.length / criticalReqs.length) * 100 
		: 100;
	
	const complete = criticalRate >= 80 && completionRate >= 60;
	
	// Gerar sugestões
	const suggestions = generateSuggestions(missingRequirements);
	
	return {
		complete,
		completionRate,
		metRequirements,
		missingRequirements,
		suggestions
	};
}

/**
 * Verifica se um requisito específico foi cumprido
 * CORRIGIDO: Agora verifica se arquivos REALMENTE foram criados
 */
function checkRequirementMet(
	requirement: TaskRequirement,
	executedSteps: any[],
	finalResult?: string
): boolean {
	// Verifica se algum step executado corresponde ao requisito
	for (const step of executedSteps) {
		const stepStr = JSON.stringify(step).toLowerCase();
		
		// CRÍTICO: Se tool é write_file, verificar se resultado indica SUCESSO REAL
		if (step.tool === 'write_file') {
			const result = step.result || '';
			// Só considera cumprido se vê "✓ File written" (confirmação real)
			const fileCreated = result.includes('✓ File written') || result.includes('File written and verified');
			
			if (fileCreated && requirement.keywords.some(k => 
				['criar', 'create', 'gerar', 'generate', 'escrever', 'write'].includes(k.toLowerCase())
			)) {
				return true;
			}
			
			// Se tool foi chamado MAS resultado tem "Error", NÃO considerar cumprido
			if (result.includes('Error:') || result.includes('Failed')) {
				continue;
			}
		}
		
		// execute_shell: verificar se comando teve SUCESSO
		if (step.tool === 'execute_shell') {
			const result = step.result || '';
			// Só considera OK se não tem erro
			const shellSuccess = !result.includes('Error:') && !result.includes('Failed');
			
			if (shellSuccess && requirement.keywords.some(k => 
				['configurar', 'configure', 'instalar', 'install', 'build'].includes(k.toLowerCase())
			)) {
				return true;
			}
		}
		
		// Se alguma keyword do requisito aparece no step com sucesso
		if (requirement.keywords.some(keyword => stepStr.includes(keyword.toLowerCase()))) {
			// Mas verificar que não houve erro
			if (!stepStr.includes('error') && !stepStr.includes('failed')) {
				return true;
			}
		}
	}
	
	// Verificar no resultado final
	if (finalResult) {
		const lowerResult = finalResult.toLowerCase();
		if (requirement.keywords.some(k => lowerResult.includes(k.toLowerCase()))) {
			return true;
		}
	}
	
	return false;
}

/**
 * Gera sugestões de próximas ações baseado em requisitos faltantes
 */
function generateSuggestions(missingRequirements: TaskRequirement[]): string[] {
	const suggestions: string[] = [];
	
	// Priorizar requisitos críticos
	const critical = missingRequirements.filter(r => r.priority === 'critical');
	const high = missingRequirements.filter(r => r.priority === 'high');
	
	if (critical.length > 0) {
		suggestions.push(`⚠️ ${critical.length} requisito(s) crítico(s) ainda não foram implementados`);
		critical.forEach(req => {
			suggestions.push(`  • ${req.description}`);
		});
	}
	
	if (high.length > 0) {
		suggestions.push(`📌 ${high.length} requisito(s) importante(s) pendente(s)`);
		high.forEach(req => {
			suggestions.push(`  • ${req.description}`);
		});
	}
	
	return suggestions;
}

/**
 * Formata relatório de validação para exibição
 */
export function formatValidationReport(validation: ValidationResult): string {
	const lines: string[] = [];
	
	lines.push('\n📊 Validação de Tarefa\n');
	lines.push(`Taxa de Conclusão: ${validation.completionRate.toFixed(0)}%`);
	lines.push(`Status: ${validation.complete ? '✅ Completo' : '⚠️ Incompleto'}\n`);
	
	if (validation.metRequirements.length > 0) {
		lines.push(`✅ Requisitos Cumpridos (${validation.metRequirements.length}):`);
		validation.metRequirements.forEach(req => {
			lines.push(`  • ${req.description}`);
		});
		lines.push('');
	}
	
	if (validation.missingRequirements.length > 0) {
		lines.push(`❌ Requisitos Pendentes (${validation.missingRequirements.length}):`);
		validation.missingRequirements.forEach(req => {
			const priorityIcon = req.priority === 'critical' ? '🔴' : req.priority === 'high' ? '🟡' : '⚪';
			lines.push(`  ${priorityIcon} ${req.description}`);
		});
		lines.push('');
	}
	
	if (validation.suggestions.length > 0) {
		lines.push('💡 Sugestões:');
		validation.suggestions.forEach(sug => {
			lines.push(sug);
		});
	}
	
	return lines.join('\n');
}
