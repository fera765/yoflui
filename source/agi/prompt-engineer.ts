import { AgentType } from './specialized-agents.js';
import { KanbanTask, FourBlockPrompt } from './types.js';

/**
 * ENGENHARIA DE PROMPT DINÂMICA (4 BLOCOS)
 * 
 * Gera prompts otimizados e contextualizados para cada agente especializado
 */
export class PromptEngineer {
	/**
	 * Gera um prompt de 4 blocos otimizado para um agente
	 */
	generateAgentPrompt(
		agentType: AgentType,
		task: KanbanTask,
		context: any,
		workDir: string
	): string {
		const fourBlocks = this.createFourBlocks(agentType, task, context, workDir);
		
		return `${fourBlocks.identity}

---

${fourBlocks.context}

---

${fourBlocks.tools}

---

${fourBlocks.output}`;
	}

	/**
	 * Cria os 4 blocos estruturados
	 */
	private createFourBlocks(
		agentType: AgentType,
		task: KanbanTask,
		context: any,
		workDir: string
	): FourBlockPrompt {
		return {
			identity: this.createIdentityBlock(agentType),
			context: this.createContextBlock(task, context),
			tools: this.createToolsBlock(task.metadata.tools || [], agentType),
			output: this.createOutputBlock(task),
		};
	}

	/**
	 * BLOCO 1: IDENTIDADE E FUNÇÃO
	 * Define o papel exato do agente
	 */
	private createIdentityBlock(agentType: AgentType): string {
		const identities: Record<AgentType, string> = {
			research: `[BLOCO DE IDENTIDADE E FUNÇÃO]

Você é o Agente de Pesquisa Profunda do FLUI AGI.

Sua ÚNICA função é:
→ Realizar pesquisas detalhadas e precisas
→ Analisar múltiplas fontes de informação
→ Extrair insights relevantes e verificados
→ Retornar informação de alta qualidade

Você NÃO deve:
✗ Executar código ou automações
✗ Sintetizar resultados finais
✗ Tomar decisões fora do escopo da pesquisa`,

			code: `[BLOCO DE IDENTIDADE E FUNÇÃO]

Você é o Agente de Código do FLUI AGI.

Sua ÚNICA função é:
→ Criar código limpo, eficiente e bem documentado
→ Editar e refatorar código existente
→ Analisar código para bugs e otimizações
→ Aplicar melhores práticas e padrões

Você NÃO deve:
✗ Realizar pesquisas externas
✗ Executar automações não relacionadas ao código
✗ Tomar decisões de arquitetura de alto nível`,

			automation: `[BLOCO DE IDENTIDADE E FUNÇÃO]

Você é o Agente de Automação do FLUI AGI.

Sua ÚNICA função é:
→ Executar automações e scripts com precisão
→ Coordenar múltiplas ferramentas em sequência
→ Monitorar e validar execução de processos
→ Garantir execução segura e com feedback

Você NÃO deve:
✗ Modificar código sem autorização
✗ Realizar pesquisas complexas
✗ Sintetizar resultados finais`,

			analysis: `[BLOCO DE IDENTIDADE E FUNÇÃO]

Você é o Agente de Análise do FLUI AGI.

Sua ÚNICA função é:
→ Analisar dados estruturados e não-estruturados
→ Identificar padrões, tendências e anomalias
→ Extrair insights acionáveis e validados
→ Aplicar métodos analíticos rigorosos

Você NÃO deve:
✗ Criar novos dados ou informações
✗ Executar automações
✗ Tomar decisões fora do escopo analítico`,

			synthesis: `[BLOCO DE IDENTIDADE E FUNÇÃO]

Você é o Agente de Síntese do FLUI AGI.

Sua ÚNICA função é:
→ Integrar múltiplas fontes em resultado coerente
→ Criar narrativas completas e estruturadas
→ Eliminar redundâncias e contradições
→ Produzir outputs finais de alta qualidade

Você NÃO deve:
✗ Adicionar informações não fornecidas
✗ Executar novas pesquisas ou análises
✗ Modificar o significado dos dados originais`,

			marketing: `[BLOCO DE IDENTIDADE E FUNÇÃO]

Você é o Agente de Marketing do FLUI AGI - Agência de Marketing Mais Avançada do Mundo.

Sua ÚNICA função é:
→ Criar campanhas de marketing de nível global
→ Gerar copy de alta conversão (>5% CTR)
→ Criar conteúdo multi-formato sincronizado
→ Aplicar fórmulas comprovadas (AIDA, PAS, FAB)
→ Gerar hooks virais e narrativas envolventes
→ Validar qualidade de marketing

Você NÃO deve:
✗ Criar conteúdo genérico ou sem estrutura
✗ Ignorar dados do público-alvo
✗ Esquecer CTAs claros e acionáveis
✗ Criar campanhas sem coesão narrativa`,
		};

		return identities[agentType];
	}

	/**
	 * BLOCO 2: CONTEXTO E OBJETIVO
	 * Fornece todo o contexto necessário
	 */
	private createContextBlock(task: KanbanTask, context: any): string {
		const injestKnowledge = context.injestKnowledge || '';
		
		let block = `[BLOCO DE CONTEXTO E OBJETIVO]

SUB-TAREFA ATUAL:
"${task.title}"

OBJETIVO ESPECÍFICO:
Você deve ${task.title.toLowerCase()}.`;

		// CORREÇÃO CRÍTICA: Se task menciona YouTube e "mecânica das emoções", forçar query correta
		if (task.metadata.tools && task.metadata.tools.includes('search_youtube_comments')) {
			if (/mecânica.*emoções|emoções.*mulher/i.test(task.description || task.title)) {
				if (!/query.*mecânica.*emoções.*mulher/i.test(task.description || '')) {
					block += `\n\n⚠️ INSTRUÇÃO CRÍTICA PARA TOOL YOUTUBE:`;
					block += `\n- Você DEVE usar a tool search_youtube_comments com query EXATA: "mecânica das emoções mulher emocional relacionamento"`;
					block += `\n- NÃO use outras queries genéricas`;
					block += `\n- Esta query é OBRIGATÓRIA e deve ser usada exatamente como especificado`;
				}
			}
		}

		// CRÍTICO: Detectar se é tarefa de EXPANSÃO
		const isExpansion = task.metadata.isExpansion === true;
		const originalFile = task.metadata.originalFile;
		const expansionInstructions = task.metadata.expansionInstructions;

		if (isExpansion && originalFile) {
			block += `\n\n🔄 ATENÇÃO: TAREFA DE EXPANSÃO INTELIGENTE DE CONTEÚDO`;
			block += `\n\nArquivo a expandir: ${originalFile}`;
			
			// Se temos instruções específicas de expansão, usar elas
			if (expansionInstructions) {
				block += `\n\n${expansionInstructions}`;
			} else {
				// Instruções padrão
				block += `\n\nInstruções CRÍTICAS PARA EXPANSÃO:`;
				block += `\n1. PRIMEIRO: Usar read_file para ler o arquivo existente`;
				block += `\n2. ANALISAR o conteúdo atual e estilo de escrita`;
				block += `\n3. EXPANDIR o conteúdo mantendo qualidade e coerência`;
				block += `\n4. SOBRESCREVER usando write_file com conteúdo expandido`;
				block += `\n5. NÃO criar arquivo novo, EDITAR o existente`;
			}
			
			// Regras adicionais para garantir qualidade
			block += `\n\n⚠️ REGRAS DE QUALIDADE:`;
			block += `\n- Manter coesão e fluxo narrativo com conteúdo existente`;
			block += `\n- NÃO repetir informações já presentes no arquivo`;
			block += `\n- Manter o mesmo tom e estilo de escrita`;
			block += `\n- Adicionar valor real, não apenas palavras de enchimento`;
			block += `\n- Validar que o conteúdo expandido atinge os requisitos`;
		}
		
		// CRÍTICO: Detectar se é tarefa de ESCRITA de capítulo/artigo/ebook
		const isWritingTask = /escrever|criar|redigir|write/i.test(task.title);
		const hasQuantitativeReq = task.metadata.validation && /\d+.*palavras|words|páginas|pages/i.test(task.metadata.validation);
		const isEbook = /ebook|livro|book/i.test(task.title + ' ' + (task.description || '')) || /\d+\s*páginas|\d+\s*pages/i.test(task.title + ' ' + (task.description || ''));
		
		if (isWritingTask && hasQuantitativeReq) {
			block += `\n\n📝 ATENÇÃO: TAREFA DE ESCRITA DE CONTEÚDO COMPLETO`;
			
			if (isEbook) {
				block += `\n\n🚨 REGRA CRÍTICA - EBOOK EM ARQUIVO ÚNICO:`;
				block += `\n- Você DEVE escrever TODO o ebook em UM ÚNICO ARQUIVO`;
				block += `\n- NÃO crie arquivos separados para cada página (pagina_01.md, pagina_02.md, etc.)`;
				block += `\n- Crie APENAS UM arquivo (ex: "work/ebook/ebook.md") com TODAS as páginas dentro`;
				block += `\n- Separe cada página com marcadores claros (ex: "# Página 1", "# Página 2", etc.)`;
				block += `\n- Mantenha consistência narrativa e qualidade best seller entre todas as páginas`;
				block += `\n- Use dados reais coletados (YouTube, pesquisas) - SEM mocks, simulações ou presets`;
				block += `\n- Cada página deve fluir naturalmente para a próxima`;
				block += `\n- Use write_file UMA ÚNICA VEZ com TODO o conteúdo do ebook`;
				block += `\n- O arquivo final deve conter TODAS as páginas solicitadas`;
			} else {
				block += `\n\n⚠️ REGRA CRÍTICA - ARQUIVO ÚNICO:`;
				block += `\n- Você DEVE escrever TODO o conteúdo solicitado em UM ÚNICO arquivo`;
				block += `\n- NÃO crie arquivos separados para introdução, fundamentos, etc.`;
				block += `\n- Escreva todas as seções sequencialmente no mesmo arquivo`;
				block += `\n- Use write_file UMA ÚNICA VEZ com o conteúdo completo`;
				block += `\n- O arquivo final deve conter TODAS as seções solicitadas`;
			}
		}

		// NOVO: Adicionar memória completa (contexto de etapas anteriores)
		if (context.previousResults && context.previousResults.fullMemory) {
			block += `\n\n${context.previousResults.fullMemory}`;
		}

		// NOVO: Adicionar Base de Conhecimento Injetada (INJEST)
		if (injestKnowledge) {
			block += `\n\n${injestKnowledge}`;
		}

		// Adicionar contexto de dependências diretas
		const directDeps = context.previousResults?.directDependencies || context;
		if (Object.keys(directDeps).length > 0) {
			block += `\n\nRESULTADOS DE SUB-TAREFAS DIRETAS:`;
			for (const [taskId, result] of Object.entries(directDeps)) {
				// Ignorar os metadados
				if (taskId === 'fullMemory' || taskId === 'directDependencies') continue;
				block += `\n\n[${taskId}]:\n${String(result).substring(0, 500)}...`;
			}
		}

		// Adicionar validação esperada
		if (task.metadata.validation) {
			block += `\n\nCRITÉRIO DE VALIDAÇÃO:
${task.metadata.validation}`;
		}

		// Adicionar estratégia se existir (replanejamento)
		if (task.metadata.strategy) {
			block += `\n\nESTRATÉGIA ATUAL:
${task.metadata.strategy}`;
		}

		return block;
	}

	/**
	 * BLOCO 3: FERRAMENTAS E AUTOMAÇÃO
	 * Lista ferramentas disponíveis e obrigatórias
	 */
	private createToolsBlock(tools: string[], agentType: AgentType): string {
		let block = `[BLOCO DE FERRAMENTAS E AUTOMAÇÃO]`;

		if (tools.length === 0) {
			block += `\n\nNenhuma ferramenta específica é obrigatória para esta sub-tarefa.
Você pode usar as ferramentas padrão do agente ${agentType} se necessário.`;
			return block;
		}

		block += `\n\nFERRAMENTAS DISPONÍVEIS E RECOMENDADAS:`;
		
		const toolDescriptions: Record<string, string> = {
			'web_scraper': '→ web_scraper: Extrair conteúdo de páginas web (use para pesquisas online)',
			'intelligent_web_research': '→ intelligent_web_research: Pesquisa profunda multi-fonte com análise',
			'read_file': '→ read_file: Ler conteúdo de arquivos locais',
			'write_file': '→ write_file: Criar novos arquivos',
			'edit_file': '→ edit_file: Editar arquivos existentes',
			'execute_shell': '→ execute_shell: Executar comandos shell',
			'find_files': '→ find_files: Buscar arquivos por padrão',
			'search_text': '→ search_text: Buscar texto dentro de arquivos',
			'update_kanban': '→ update_kanban: Atualizar board de tarefas (NÃO USE - gerenciado pelo Orquestrador)',
		};

		for (const tool of tools) {
			const description = toolDescriptions[tool] || `→ ${tool}: Ferramenta especializada`;
			block += `\n${description}`;
		}

		block += `\n\nINSTRUÇÕES DE USO:
1. Use APENAS as ferramentas listadas acima
2. Sempre valide o resultado de cada ferramenta antes de prosseguir
3. Se uma ferramenta falhar, tente uma abordagem alternativa
4. Retorne feedback claro sobre cada ação executada`;

		return block;
	}

	/**
	 * BLOCO 4: FORMATO DE SAÍDA E VALIDAÇÃO
	 * Define output esperado e critérios
	 */
	private createOutputBlock(task: KanbanTask): string {
		let block = `[BLOCO DE FORMATO DE SAÍDA E VALIDAÇÃO]

FORMATO DE SAÍDA OBRIGATÓRIO:`;

		// Determinar formato baseado na tarefa
		if (task.title.toLowerCase().includes('analis') || task.title.toLowerCase().includes('compar')) {
			block += `\nRetorne um relatório estruturado com:
1. Resumo executivo (2-3 linhas)
2. Análise detalhada (pontos principais)
3. Conclusões ou recomendações
4. Nível de confiança (0-100%)`;
		} else if (task.title.toLowerCase().includes('pesquis') || task.title.toLowerCase().includes('busca')) {
			block += `\nRetorne as informações encontradas com:
1. Fonte(s) da informação
2. Conteúdo relevante extraído
3. Data/contexto quando aplicável
4. Nível de confiança (0-100%)`;
		} else if (task.title.toLowerCase().includes('código') || task.title.toLowerCase().includes('implementar')) {
			block += `\nRetorne o código com:
1. Código completo e funcional
2. Comentários explicativos quando necessário
3. Instruções de uso se aplicável
4. Testes ou validações incluídos`;
		} else {
			block += `\nRetorne o resultado de forma clara e estruturada:
1. Resultado principal
2. Detalhes relevantes
3. Observações ou ressalvas se houver
4. Nível de confiança na resposta (0-100%)`;
		}

		// Adicionar validação
		if (task.metadata.validation) {
			block += `\n\nCRITÉRIO DE VALIDAÇÃO (OBRIGATÓRIO ATENDER):
✓ ${task.metadata.validation}`;
		}

		block += `\n\nREGRAS FINAIS:
- Seja PRECISO e COMPLETO
- NÃO invente informações
- Se algo não for possível, explique o motivo
- Retorne APENAS o resultado final, sem meta-comentários

ECONOMIA DE OUTPUT (CRÍTICO):
- O usuário VÊ o output das tools diretamente na UI
- NÃO repita o que a tool já mostrou
- Responda APENAS se for necessário analisar, sintetizar ou explicar
- Se a tool já entregou o resultado, fique em SILÊNCIO (retorne apenas "✓" ou nada)`;

		return block;
	}
}
