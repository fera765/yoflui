/**
 * Task Decomposer - Decompõe tarefas grandes em sub-tarefas gerenciáveis
 * 
 * Evita timeout em tarefas complexas criando Kanban automaticamente
 */

import OpenAI from 'openai';
import { getConfig } from '../llm-config.js';
import { withTimeout, TIMEOUT_CONFIG } from '../config/timeout-config.js';

export interface Subtask {
	id: string;
	title: string;
	description: string;
	dependencies: string[]; // IDs de subtasks que devem ser concluídas antes
	estimated_tokens: number;
	priority: number; // 1-10
	validation?: string; // Requisitos quantitativos ou critérios de sucesso
}

export interface DecompositionResult {
	shouldDecompose: boolean;
	reason: string;
	subtasks: Subtask[];
	estimated_total_time: number; // Em segundos
}

/**
 * Extrai PATH de arquivo especificado pelo usuário
 */
function extractFilePath(prompt: string): string | null {
	// Padrões para detectar path de arquivo (mais robustos)
	const patterns = [
		// "Salvar em work/arquivo.md"
		/salvar\s+(?:em|no)\s+([^\s,;)]+\.(?:md|txt|html|json|ts|tsx|js|jsx|py|java|cpp))/i,
		// "Save to work/file.md"
		/save\s+(?:to|in)\s+([^\s,;)]+\.(?:md|txt|html|json|ts|tsx|js|jsx|py|java|cpp))/i,
		// "Salvar Capítulo 1 em work/arquivo.md"
		/(?:capítulo|chapter|seção|section)\s+\d+\s+em\s+([^\s,;)]+\.(?:md|txt|html|json|ts|tsx|js|jsx|py|java|cpp))/i,
		// "Criar em work/arquivo.md"
		/criar\s+(?:em|no)\s+([^\s,;)]+\.(?:md|txt|html|json|ts|tsx|js|jsx|py|java|cpp))/i,
		// "Create in work/file.md"
		/create\s+(?:in|at)\s+([^\s,;)]+\.(?:md|txt|html|json|ts|tsx|js|jsx|py|java|cpp))/i,
		// "arquivo work/nome.md"
		/arquivo\s+([^\s,;)]+\.(?:md|txt|html|json|ts|tsx|js|jsx|py|java|cpp))/i,
		// "file work/name.md"
		/file\s+([^\s,;)]+\.(?:md|txt|html|json|ts|tsx|js|jsx|py|java|cpp))/i,
	];
	
	for (const pattern of patterns) {
		const match = prompt.match(pattern);
		if (match && match[1]) {
			console.log(`[extractFilePath] Detectado path: ${match[1]}`);
			return match[1];
		}
	}
	
	console.warn('[extractFilePath] Nenhum path detectado no prompt');
	return null;
}

/**
 * Extrai requisitos quantitativos do prompt (palavras, páginas, linhas, etc.)
 * CRÍTICO: Esses requisitos devem ser incluídos nas subtasks relevantes
 */
function extractQuantitativeRequirements(prompt: string): string[] {
	const requirements: string[] = [];
	
	// Padrões de requisitos quantitativos
	const patterns = [
		// Palavras: "1000 palavras", "1000+ palavras", "mínimo 1000 palavras"
		/(\d+\+?)\s*(palavras?|words?)/gi,
		// Páginas: "50 páginas", "50+ páginas"
		/(\d+\+?)\s*(páginas?|pages?)/gi,
		// Linhas: "100 linhas", "100+ linhas"
		/(\d+\+?)\s*(linhas?|lines?)/gi,
		// Capítulos: "5 capítulos", "5+ capítulos"
		/(\d+\+?)\s*(capítulos?|chapters?)/gi,
		// Seções: "3 seções", "3+ seções"
		/(\d+\+?)\s*(seções?|sections?)/gi,
		// Caracteres: "5000 caracteres", "5000+ caracteres"
		/(\d+\+?)\s*(caracteres?|characters?)/gi,
		// Minutos: "10 minutos", "10+ minutos"
		/(\d+\+?)\s*(minutos?|minutes?)/gi,
	];
	
	for (const pattern of patterns) {
		const matches = prompt.match(pattern);
		if (matches) {
			matches.forEach(match => {
				// Normalizar para formato consistente
				const normalized = match.replace(/\s+/g, ' ').trim();
				if (!requirements.includes(normalized)) {
					requirements.push(`REQUISITO QUANTITATIVO: ${normalized}`);
				}
			});
		}
	}
	
	// Detectar requisitos com "mínimo", "máximo", "exatamente"
	const qualifiers = [
		/mínimo\s+de\s+(\d+)\s+(palavras?|páginas?|linhas?)/gi,
		/máximo\s+de\s+(\d+)\s+(palavras?|páginas?|linhas?)/gi,
		/exatamente\s+(\d+)\s+(palavras?|páginas?|linhas?)/gi,
		/pelo\s+menos\s+(\d+)\s+(palavras?|páginas?|linhas?)/gi,
		/no\s+mínimo\s+(\d+)\s+(palavras?|páginas?|linhas?)/gi,
	];
	
	for (const qualifier of qualifiers) {
		const matches = prompt.match(qualifier);
		if (matches) {
			matches.forEach(match => {
				const normalized = match.replace(/\s+/g, ' ').trim();
				if (!requirements.some(r => r.includes(normalized))) {
					requirements.push(`REQUISITO QUANTITATIVO: ${normalized}`);
				}
			});
		}
	}
	
	return requirements;
}

/**
 * Detecta se uma tarefa é grande/complexa o suficiente para decomposição
 */
export function detectLargeTask(prompt: string): boolean {
	// CRÍTICO: Se tem requisito quantitativo, SEMPRE decompor para validação funcionar
	const hasQuantitativeRequirement = /(\d+\+?)\s*(palavras?|words?|páginas?|pages?|linhas?|lines?)/i.test(prompt);
	if (hasQuantitativeRequirement) {
		console.log('[detectLargeTask] Requisito quantitativo detectado - forçando decomposição');
		return true;
	}
	
	const indicators = [
		// Tamanho do prompt
		prompt.length > 500,
		
		// Múltiplos requisitos numerados
		(prompt.match(/\d+[.)]\s+/g) || []).length > 5,
		
		// Keywords de complexidade
		/completo|complete|detalhado|detailed|extenso|extensive/i.test(prompt),
		
		// Keywords de tamanho
		/mínimo|minimum|máximo|maximum|(\d+)\s*(palavras|words|páginas|pages|capítulos|chapters)/i.test(prompt),
		
		// Múltiplas seções/capítulos
		/(capítulo|chapter|seção|section)/gi.test(prompt) && (prompt.match(/(capítulo|chapter|seção|section)/gi) || []).length > 3,
		
		// Projeto completo
		/projeto\s+(completo|frontend|backend|fullstack)/i.test(prompt),
		
		// Ebook/Documento grande
		/ebook|livro|book|documento\s+completo/i.test(prompt)
	];
	
	// Se 3 ou mais indicadores, é tarefa grande
	const matchCount = indicators.filter(Boolean).length;
	return matchCount >= 3;
}

/**
 * Decompõe tarefa em sub-tarefas usando LLM
 */
export async function decomposeTask(
	prompt: string,
	openai: OpenAI
): Promise<DecompositionResult> {
	// Verificar se deve decompor
	if (!detectLargeTask(prompt)) {
		return {
			shouldDecompose: false,
			reason: 'Tarefa pequena/média - não requer decomposição',
			subtasks: [],
			estimated_total_time: 60
		};
	}
	
	try {
		// CRÍTICO: Extrair requisitos quantitativos e PATH do prompt original
		const quantitativeRequirements = extractQuantitativeRequirements(prompt);
		const filePath = extractFilePath(prompt);
		
		// Usar LLM para decompor
		const decompositionPrompt = `Você é um especialista em planejamento de tarefas. Analise a seguinte tarefa e decomponha-a em sub-tarefas menores e gerenciáveis.

TAREFA DO USUÁRIO:
${prompt}

REQUISITOS QUANTITATIVOS DETECTADOS (CRÍTICO - DEVE SER INCLUÍDO NAS SUBTASKS RELEVANTES):
${quantitativeRequirements.length > 0 ? quantitativeRequirements.join('\n') : 'Nenhum requisito quantitativo específico'}

PATH DE ARQUIVO ESPECIFICADO (CRÍTICO - DEVE SER USADO EXATAMENTE COMO ESTÁ):
${filePath || 'Nenhum path específico, use padrão work/[nome-arquivo].md'}

INSTRUÇÕES:
1. Identifique todos os requisitos e componentes
2. Decomponha em sub-tarefas PEQUENAS (máximo 5 minutos cada)
3. Ordene por dependências (o que deve ser feito primeiro)
4. **CRÍTICO:** Se houver requisitos quantitativos (palavras, páginas, linhas), INCLUA-OS EXPLICITAMENTE na descrição da subtask relevante
5. **CRÍTICO:** Se houver PATH de arquivo especificado, INCLUA-O EXATAMENTE na descrição da subtask de escrita/salvamento
6. **CRÍTICO - REGRA DE ARQUIVO ÚNICO:** 
   - TODO o conteúdo de um capítulo/artigo/documento DEVE ser escrito em UM ÚNICO arquivo
   - NUNCA crie subtasks separadas para "introdução.md", "fundamentos.md", etc.
   - A subtask de escrita deve gerar TODO o conteúdo de uma vez no arquivo especificado
   - Se o usuário pediu "work/ebook-cap1.md", TODO o capítulo 1 vai nesse arquivo ÚNICO
   - NÃO fragmente em múltiplos arquivos
7. Para cada subtask, forneça:
   - ID único
   - Título claro
   - Descrição específica (INCLUINDO requisitos quantitativos E path de arquivo se aplicável)
   - Dependências (IDs de outras subtasks)
   - Estimativa de tokens necessários
   - Prioridade (1-10)

EXEMPLO DE SUBTASK COM REQUISITO QUANTITATIVO E PATH (ARQUIVO ÚNICO):
{
  "id": "3",
  "title": "Escrever e salvar capítulo completo",
  "description": "Escrever TODO o Capítulo 1 completo (introdução, fundamentos, técnicas, exemplos, exercícios) com MÍNIMO 1200 palavras. IMPORTANTE: Escrever TUDO em UM ÚNICO arquivo work/ebook-cap1.md (NÃO criar arquivos separados para cada seção). VALIDAR contagem antes de concluir.",
  "dependencies": ["2"],
  "estimated_tokens": 2000,
  "priority": 8
}

RETORNE APENAS UM JSON VÁLIDO neste formato:
{
  "subtasks": [
    {
      "id": "1",
      "title": "Título da subtask",
      "description": "Descrição detalhada",
      "dependencies": [],
      "estimated_tokens": 1000,
      "priority": 10
    }
  ],
  "estimated_total_time": 300
}

NÃO inclua explicações, apenas o JSON.`;

		const response = await withTimeout(
			openai.chat.completions.create({
				model: getConfig().model,
				messages: [
					{ role: 'system', content: 'You are a task decomposition expert. Return only valid JSON.' },
					{ role: 'user', content: decompositionPrompt }
				],
				temperature: 0.3,
			}),
			TIMEOUT_CONFIG.LLM_COMPLETION,
			'Task decomposition'
		);

		const content = response.choices[0]?.message?.content || '';
		
		// Extrair JSON
		const jsonMatch = content.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error('LLM não retornou JSON válido');
		}
		
		const decomposition = JSON.parse(jsonMatch[0]);
		
	// Validar estrutura
	if (!decomposition.subtasks || !Array.isArray(decomposition.subtasks)) {
		throw new Error('JSON sem campo subtasks');
	}
	
	// CRÍTICO: INJETAR requisitos quantitativos nas subtasks de escrita
	if (quantitativeRequirements.length > 0) {
		console.log(`[DECOMPOSER] Injetando ${quantitativeRequirements.length} requisitos quantitativos nas subtasks`);
		for (const subtask of decomposition.subtasks) {
			// Detectar se é subtask de escrita/criação
			const isWritingTask = /escrever|criar|redigir|write|gerar.*texto|artigo|capítulo/i.test(subtask.title + ' ' + (subtask.description || ''));
			if (isWritingTask) {
				// Adicionar requisitos ao campo validation
				const reqText = quantitativeRequirements.join(' ');
				subtask.validation = subtask.validation 
					? `${subtask.validation} ${reqText}` 
					: reqText;
				console.log(`[DECOMPOSER] Requisito injetado em "${subtask.title}": ${reqText}`);
			}
		}
	}
	
	return {
		shouldDecompose: true,
		reason: `Tarefa complexa decompost em ${decomposition.subtasks.length} sub-tarefas`,
		subtasks: decomposition.subtasks,
		estimated_total_time: decomposition.subtasks_total_time || 300
	};
		
	} catch (error) {
		// Fallback: decomposição manual baseada em padrões
		const fallbackSubtasks = fallbackDecomposition(prompt);
		
		if (fallbackSubtasks.length > 0) {
			return {
				shouldDecompose: true,
				reason: 'Decomposição automática (fallback)',
				subtasks: fallbackSubtasks,
				estimated_total_time: fallbackSubtasks.length * 60
			};
		}
		
		// Se falhar tudo, não decompõe
		return {
			shouldDecompose: false,
			reason: `Erro na decomposição: ${error instanceof Error ? error.message : String(error)}`,
			subtasks: [],
			estimated_total_time: 120
		};
	}
}

/**
 * Decomposição fallback baseada em padrões quando LLM falha
 */
function fallbackDecomposition(prompt: string): Subtask[] {
	const subtasks: Subtask[] = [];
	let taskId = 1;
	
	// Detectar listas numeradas (requisitos)
	const numberedItems = prompt.match(/(\d+[.)]\s+[^\n]+)/g) || [];
	
	if (numberedItems.length >= 3) {
		// Criar subtask para cada item numerado
		for (let i = 0; i < numberedItems.length; i++) {
			const item = numberedItems[i];
			const description = item.replace(/^\d+[.)]\s+/, '').trim();
			
			// Determinar dependências inteligentes
			const deps: string[] = [];
			if (i > 0 && i === 1) {
				deps.push(String(taskId - 1)); // Task 2 depende da 1
			} else if (i > 1) {
				// Tasks subsequentes podem depender de múltiplas anteriores
				deps.push(String(taskId - 1));
			}
			
			subtasks.push({
				id: String(taskId++),
				title: description.length > 60 ? description.substring(0, 60) + '...' : description,
				description,
				dependencies: deps,
				estimated_tokens: 2500,
				priority: 10 - Math.floor(i / 2) // Primeiras têm prioridade maior
			});
		}
		
		// Adicionar task final de validação
		subtasks.push({
			id: String(taskId++),
			title: 'Validar projeto completo',
			description: 'Verificar se todos os requisitos foram atendidos e testar funcionamento',
			dependencies: [String(taskId - 1)],
			estimated_tokens: 1000,
			priority: 1
		});
	} else {
		// Decomposição genérica baseada em keywords
		const patterns = [
			{ keywords: ['criar', 'create', 'setup'], title: 'Setup inicial', priority: 10 },
			{ keywords: ['configurar', 'configure'], title: 'Configuração', priority: 9 },
			{ keywords: ['implementar', 'implement'], title: 'Implementação', priority: 8 },
			{ keywords: ['component'], title: 'Criar componentes', priority: 7 },
			{ keywords: ['estilo', 'style', 'css'], title: 'Estilização', priority: 6 },
			{ keywords: ['teste', 'test'], title: 'Testes', priority: 5 },
			{ keywords: ['validar', 'validate'], title: 'Validação final', priority: 4 }
		];
		
		for (const pattern of patterns) {
			if (pattern.keywords.some(k => prompt.toLowerCase().includes(k))) {
				subtasks.push({
					id: String(taskId++),
					title: pattern.title,
					description: `${pattern.title} conforme especificado na tarefa`,
					dependencies: taskId > 2 ? [String(taskId - 2)] : [],
					estimated_tokens: 2000,
					priority: pattern.priority
				});
			}
		}
	}
	
	return subtasks;
}

/**
 * Converte subtasks para formato Kanban
 */
/**
 * Inferir tipo de agente baseado no título/descrição da tarefa
 */
function inferAgentType(title: string, description: string): string {
	const combined = `${title} ${description}`.toLowerCase();
	
	// Código/Desenvolvimento
	if (/criar.*componente|implementar|desenvolver|código|typescript|react|configurar.*arquivo/i.test(combined)) {
		return 'code';
	}
	
	// Pesquisa/Análise
	if (/pesquisar|analisar|investigar|buscar|estudar/i.test(combined)) {
		return 'research';
	}
	
	// Automação/Script
	if (/automatizar|script|comando|executar.*shell|rodar.*npm/i.test(combined)) {
		return 'automation';
	}
	
	// Teste/Validação
	if (/testar|validar|verificar|conferir/i.test(combined)) {
		return 'analysis';
	}
	
	// Documentação/Síntese
	if (/documentar|escrever|criar.*readme|finalizar|resumir/i.test(combined)) {
		return 'synthesis';
	}
	
	// Default para código (frontend é principalmente código)
	return 'code';
}

/**
 * Inferir tools necessárias baseado no título/descrição
 */
function inferTools(title: string, description: string): string[] {
	const combined = `${title} ${description}`.toLowerCase();
	const tools: string[] = [];
	
	// CRÍTICO: Detectar requisito quantitativo
	const hasQuantitativeRequirement = /(\d+)\+?\s*(palavras?|words?|páginas?|pages?|linhas?|lines?)/i.test(combined);
	
	// Shell commands
	if (/npm|instalar|comando|executar|criar.*projeto|vite/i.test(combined)) {
		tools.push('execute_shell');
	}
	
	// File operations
	if (/criar.*arquivo|escrever|configurar.*arquivo|componente/i.test(combined)) {
		tools.push('write_file');
	}
	
	// CRÍTICO: Se task é de ESCRITA com requisito quantitativo, FORÇAR write_file
	if (hasQuantitativeRequirement && /escrever|redigir|write|criar.*conteúdo|gerar.*texto|artigo|capítulo/i.test(combined)) {
		if (!tools.includes('write_file')) {
			tools.push('write_file');
		}
		// Também adicionar read_file para validação
		if (!tools.includes('read_file')) {
			tools.push('read_file');
		}
	}
	
	// Read operations
	if (/ler|verificar|analisar.*arquivo/i.test(combined)) {
		tools.push('read_file');
	}
	
	// Folder operations
	if (/estruturar.*pastas|criar.*pasta|organizar/i.test(combined)) {
		tools.push('read_folder');
	}
	
	// Web search
	if (/pesquisar|buscar.*online|consultar/i.test(combined)) {
		tools.push('web_search');
	}
	
	// Se não detectou nenhuma, assume write_file como padrão
	if (tools.length === 0) {
		tools.push('write_file');
	}
	
	return tools;
}

export function convertToKanbanTasks(subtasks: Subtask[]): any[] {
	return subtasks.map((subtask, index) => {
		const agentType = inferAgentType(subtask.title, subtask.description);
		const tools = inferTools(subtask.title, subtask.description);
		
		return {
			id: subtask.id,
			title: subtask.title,
			description: subtask.description,
			status: index === 0 ? 'in_progress' : 'todo',
			column: 'execution_queue', // Sempre queue, o orchestrator movimenta
			dependencies: subtask.dependencies,
		metadata: {
			agentType,
			tools,
			estimated_tokens: subtask.estimated_tokens,
			priority: subtask.priority,
			// CRÍTICO: Preservar validation injetado (com requisitos quantitativos)
			validation: subtask.validation || `${subtask.title} completed successfully`,
			decomposed: true, // Flag para indicar que args serão gerados pelo agent
			stepIndex: index + 1,
			totalSteps: subtasks.length
		}
		};
	});
}

/**
 * Formata relatório de decomposição
 */
export function formatDecompositionReport(decomposition: DecompositionResult): string {
	const lines: string[] = [];
	
	if (!decomposition.shouldDecompose) {
		lines.push(`\n✅ Tarefa simples - sem necessidade de decomposição`);
		lines.push(`Motivo: ${decomposition.reason}`);
		return lines.join('\n');
	}
	
	lines.push('\n📊 Decomposição de Tarefa Complexa\n');
	lines.push(`🔄 Detectado: Tarefa grande/complexa`);
	lines.push(`📋 Sub-tarefas: ${decomposition.subtasks.length}`);
	lines.push(`⏱️  Tempo estimado: ${Math.floor(decomposition.estimated_total_time / 60)} minutos\n`);
	
	lines.push('📝 Plano de Execução:\n');
	decomposition.subtasks.forEach((subtask, index) => {
		const icon = index === 0 ? '▶️' : '⏸️';
		const deps = subtask.dependencies.length > 0 
			? ` (depende de: ${subtask.dependencies.join(', ')})` 
			: '';
		lines.push(`${icon} ${subtask.id}. ${subtask.title}${deps}`);
	});
	
	return lines.join('\n');
}
