# An?lise da Web Search Tool - Qwen Code vs Projeto Atual

## Resumo Executivo

O projeto **Qwen Code** usa uma abordagem completamente diferente para web search: utiliza a **API Tavily** em vez de scraping direto de motores de busca.

## Como funciona o Qwen Code

### Arquitetura

1. **API Tavily** (`https://api.tavily.com/search`)
   - API paga/comercial para busca na web
   - Retorna resultados estruturados em JSON
   - Requer API key (`TAVILY_API_KEY`)
   - N?o precisa fazer scraping

### Implementa??o

```typescript
// Localiza??o: /tmp/qwen-code/packages/core/src/tools/web-search.ts

class WebSearchToolInvocation {
  async execute(signal: AbortSignal): Promise<WebSearchToolResult> {
    const apiKey = this.config.getTavilyApiKey();
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: this.params.query,
        search_depth: 'advanced',
        max_results: 5,
        include_answer: true,  // Tavily gera resposta resumida automaticamente!
      }),
      signal,
    });

    const data = await response.json();
    
    // Tavily retorna:
    // - answer: resposta resumida gerada automaticamente
    // - results: array com title, url, content, score, published_date
    
    return {
      llmContent: `Web search results for "${query}":\n\n${data.answer}`,
      sources: data.results.map(r => ({ title: r.title, url: r.url }))
    };
  }
}
```

### Vantagens da abordagem Tavily

1. ? **Sem scraping** - N?o precisa lidar com bloqueios, CAPTCHAs, mudan?as de HTML
2. ? **Resposta resumida** - Tavily gera automaticamente uma resposta (`answer`) baseada nos resultados
3. ? **Resultados estruturados** - JSON limpo com title, url, content, score
4. ? **Mais confi?vel** - API oficial, n?o quebra com mudan?as de HTML
5. ? **Melhor performance** - Uma ?nica requisi??o HTTP em vez de m?ltiplas tentativas
6. ? **Conte?do completo** - Tavily extrai o conte?do das p?ginas (`content` field)

### Desvantagens

1. ? **Requer API key** - Custo (possivelmente pago)
2. ? **Depend?ncia externa** - Depende de servi?o terceiro
3. ? **Limite de requisi??es** - Provavelmente tem rate limits

## Compara??o com Projeto Atual

| Aspecto | Projeto Atual (Scraping) | Qwen Code (Tavily API) |
|---------|-------------------------|------------------------|
| **M?todo** | Scraping HTML direto | API Tavily |
| **Motores** | Google, DuckDuckGo, Bing | Tavily (agrega m?ltiplos) |
| **Custo** | Gratuito | Requer API key (pago?) |
| **Confiabilidade** | Baixa (bloqueios, HTML muda) | Alta (API est?vel) |
| **Resposta resumida** | N?o (apenas resultados) | Sim (gerada automaticamente) |
| **Manuten??o** | Alta (parsers HTML quebram) | Baixa (API mantida) |
| **Conte?do completo** | N?o (apenas snippet) | Sim (content field) |

## Recomenda??es

### Op??o 1: Manter scraping mas melhorar (atual)

**Pr?s:**
- Gratuito
- Sem depend?ncias externas
- Controle total

**Contras:**
- Manuten??o constante
- Bloqueios frequentes
- Parsers quebram com mudan?as de HTML

**Melhorias sugeridas:**
- ? J? corrigimos DuckDuckGo
- ?? Investigar Google (pode estar bloqueando)
- ?? Investigar Bing (estrutura mudou)
- ?? Adicionar fallback entre engines
- ?? Implementar cache de resultados
- ?? Adicionar retry com backoff exponencial

### Op??o 2: Migrar para Tavily API (como Qwen Code)

**Pr?s:**
- Mais confi?vel
- Resposta resumida autom?tica
- Sem manuten??o de parsers
- Melhor performance

**Contras:**
- Requer API key
- Poss?vel custo
- Depend?ncia externa

**Implementa??o:**
```typescript
// Criar nova implementa??o usando Tavily
async function executeWebSearchToolTavily(
  query: string,
  apiKey: string,
  maxResults: number = 5
): Promise<string> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'advanced',
      max_results: maxResults,
      include_answer: true,
    }),
  });

  const data = await response.json();
  
  return JSON.stringify({
    query,
    answer: data.answer,
    totalResults: data.results.length,
    results: data.results.map(r => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    })),
  });
}
```

### Op??o 3: H?brido (Recomendado)

Manter scraping como fallback, mas usar Tavily quando dispon?vel:

```typescript
async function executeWebSearchTool(
  query: string,
  engine: 'google' | 'duckduckgo' | 'bing' | 'tavily' = 'duckduckgo',
  maxResults: number = 100
): Promise<string> {
  // Tentar Tavily primeiro se API key dispon?vel
  if (engine === 'tavily' || process.env.TAVILY_API_KEY) {
    try {
      return await executeWebSearchToolTavily(query, process.env.TAVILY_API_KEY!, maxResults);
    } catch (error) {
      console.warn('Tavily failed, falling back to scraping:', error);
      // Fallback para scraping
    }
  }
  
  // Usar scraping como antes
  return await executeWebSearchToolScraping(query, engine, maxResults);
}
```

## Informa??es sobre Tavily

- Website: https://tavily.com
- API Docs: https://docs.tavily.com
- Pricing: Verificar no site (pode ter tier gratuito)
- Features:
  - Resposta resumida autom?tica (`include_answer: true`)
  - Conte?do completo das p?ginas (`content` field)
  - Score de relev?ncia (`score`)
  - Data de publica??o (`published_date`)

## Pr?ximos Passos

1. ? **Conclu?do**: Corrigir parser DuckDuckGo
2. ?? **Em progresso**: Investigar Google e Bing
3. ?? **Sugerido**: Avaliar migra??o para Tavily ou implementar h?brido
4. ?? **Sugerido**: Documentar escolha de arquitetura

## Conclus?o

O Qwen Code usa uma abordagem mais robusta e confi?vel atrav?s da API Tavily. Se o projeto atual precisa de maior confiabilidade, considerar migra??o para Tavily ou implementar abordagem h?brida (Tavily primeiro, scraping como fallback).
