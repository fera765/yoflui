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
}

export interface DecompositionResult {
	shouldDecompose: boolean;
	reason: string;
	subtasks: Subtask[];
	estimated_total_time: number; // Em segundos
}

/**
 * Detecta se uma tarefa é grande/complexa o suficiente para decomposição
 */
export function detectLargeTask(prompt: string): boolean {
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
		// Usar LLM para decompor
		const decompositionPrompt = `Você é um especialista em planejamento de tarefas. Analise a seguinte tarefa e decomponha-a em sub-tarefas menores e gerenciáveis.

TAREFA DO USUÁRIO:
${prompt}

INSTRUÇÕES:
1. Identifique todos os requisitos e componentes
2. Decomponha em sub-tarefas PEQUENAS (máximo 5 minutos cada)
3. Ordene por dependências (o que deve ser feito primeiro)
4. Para cada subtask, forneça:
   - ID único
   - Título claro
   - Descrição específica
   - Dependências (IDs de outras subtasks)
   - Estimativa de tokens necessários
   - Prioridade (1-10)

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
		
		return {
			shouldDecompose: true,
			reason: `Tarefa complexa decompost em ${decomposition.subtasks.length} sub-tarefas`,
			subtasks: decomposition.subtasks,
			estimated_total_time: decomposition.estimated_total_time || 300
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
	
	// Detectar listas numeradas
	const numberedItems = prompt.match(/(\d+[.)]\s+[^\n]+)/g) || [];
	
	if (numberedItems.length > 0) {
		// Criar subtask para cada item numerado
		for (const item of numberedItems) {
			const description = item.replace(/^\d+[.)]\s+/, '').trim();
			
			subtasks.push({
				id: String(taskId++),
				title: description.substring(0, 50),
				description,
				dependencies: taskId > 2 ? [String(taskId - 2)] : [], // Depende da anterior
				estimated_tokens: 2000,
				priority: 5
			});
		}
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
export function convertToKanbanTasks(subtasks: Subtask[]): any[] {
	return subtasks.map((subtask, index) => ({
		id: subtask.id,
		title: subtask.title,
		description: subtask.description,
		status: index === 0 ? 'in_progress' : 'todo',
		column: index === 0 ? 'in_progress' : 'todo',
		dependencies: subtask.dependencies,
		metadata: {
			estimated_tokens: subtask.estimated_tokens,
			priority: subtask.priority
		}
	}));
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
