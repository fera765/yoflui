/**
 * RESPONSE OPTIMIZER - Token Economy Layer
 * 
 * Intercepta respostas da LLM e otimiza para economia de tokens.
 * Corta respostas redundantes que apenas repetem o output das tools.
 */

export interface ToolExecution {
	name: string;
	result: string;
	timestamp: number;
}

export class ResponseOptimizer {
	private recentToolExecutions: ToolExecution[] = [];
	private readonly MAX_RECENT_TOOLS = 5;
	
	/**
	 * Registra execução de uma tool para análise posterior
	 */
	registerToolExecution(name: string, result: string): void {
		this.recentToolExecutions.push({
			name,
			result,
			timestamp: Date.now(),
		});
		
		// Manter apenas as últimas N execuções
		if (this.recentToolExecutions.length > this.MAX_RECENT_TOOLS) {
			this.recentToolExecutions.shift();
		}
	}
	
	/**
	 * Otimiza resposta da LLM para economia de tokens
	 * 
	 * Regras:
	 * 1. Se tool foi executada e LLM está repetindo output → cortar para "✓"
	 * 2. Se resposta começa com "Aqui está" ou "O resultado é" → provavelmente redundante
	 * 3. Se resposta tem > 80% de similaridade com tool output → cortar
	 * 4. Se resposta adiciona análise/valor → manter completa
	 */
	optimizeResponse(llmResponse: string, userPrompt: string): string {
		// Se não houve tools recentes, retornar resposta completa
		if (this.recentToolExecutions.length === 0) {
			return llmResponse;
		}
		
		const lastTool = this.recentToolExecutions[this.recentToolExecutions.length - 1];
		
		// Se tool foi executada há menos de 5 segundos
		const timeSinceExecution = Date.now() - lastTool.timestamp;
		if (timeSinceExecution > 5000) {
			return llmResponse;
		}
		
		// Verificar se usuário pediu análise explícita
		const analysisKeywords = [
			'analis', 'analyz', 'explain', 'explic', 'compar', 'suger', 'suggest',
			'melhor', 'improv', 'recomend', 'o que', 'por que', 'como funciona'
		];
		
		const promptLower = userPrompt.toLowerCase();
		const requestedAnalysis = analysisKeywords.some(kw => promptLower.includes(kw));
		
		if (requestedAnalysis) {
			// Análise foi pedida - manter resposta completa
			return llmResponse;
		}
		
		// Verificar se resposta está apenas transcrevendo tool output
		const redundancyPhrases = [
			'aqui está',
			'o resultado é',
			'o conteúdo é',
			'encontrei',
			'listei',
			'executei',
			'o comando retornou',
			'o arquivo contém',
			'here is',
			'the result is',
			'i found',
			'i executed',
		];
		
		const responseLower = llmResponse.toLowerCase();
		const hasRedundancyPhrase = redundancyPhrases.some(phrase => 
			responseLower.includes(phrase)
		);
		
		if (hasRedundancyPhrase) {
			// Calcular similaridade entre resposta e tool output
			const similarity = this.calculateSimilarity(llmResponse, lastTool.result);
			
			if (similarity > 0.5) {
				// Mais de 50% de similaridade = resposta redundante
				return this.createMinimalResponse(lastTool.name);
			}
		}
		
		// Verificar se resposta apenas repete o output (copia literal)
		const toolOutputSnippet = lastTool.result.substring(0, 200);
		if (llmResponse.includes(toolOutputSnippet)) {
			return this.createMinimalResponse(lastTool.name);
		}
		
		// Resposta adiciona valor - manter completa
		return llmResponse;
	}
	
	/**
	 * Criar resposta mínima para economia de tokens
	 */
	private createMinimalResponse(toolName: string): string {
		// Mapeamento de tools para respostas mínimas contextuais
		const minimalResponses: Record<string, string> = {
			'execute_shell': '✓',
			'read_file': '✓',
			'write_file': '✓ Arquivo criado',
			'edit_file': '✓ Arquivo editado',
			'find_files': '✓',
			'search_text': '✓',
			'read_folder': '✓',
			'web_scraper': '✓',
			'web_search': '✓',
		};
		
		return minimalResponses[toolName] || '✓';
	}
	
	/**
	 * Calcular similaridade entre duas strings (0 a 1)
	 * Usa algoritmo simples de Jaccard com n-grams
	 */
	private calculateSimilarity(str1: string, str2: string): number {
		const ngrams1 = this.getNGrams(str1, 3);
		const ngrams2 = this.getNGrams(str2, 3);
		
		const set1 = new Set(ngrams1);
		const set2 = new Set(ngrams2);
		
		const intersection = new Set([...set1].filter(x => set2.has(x)));
		const union = new Set([...set1, ...set2]);
		
		return intersection.size / union.size;
	}
	
	/**
	 * Gerar n-grams de uma string
	 */
	private getNGrams(str: string, n: number): string[] {
		const normalized = str.toLowerCase().replace(/\s+/g, ' ');
		const ngrams: string[] = [];
		
		for (let i = 0; i <= normalized.length - n; i++) {
			ngrams.push(normalized.substring(i, i + n));
		}
		
		return ngrams;
	}
	
	/**
	 * Limpar histórico de tools (chamar ao iniciar nova conversa)
	 */
	clearHistory(): void {
		this.recentToolExecutions = [];
	}
}

/**
 * Singleton global
 */
export const responseOptimizer = new ResponseOptimizer();
