# Guia de Configura??o e Teste - Tavily API

## ? Implementa??o Completa

A implementa??o est? pronta e segue exatamente a mesma abordagem do Qwen Code.

## ?? Como Obter API Key do Tavily

O Qwen Code n?o fornece uma API key p?blica (por quest?es de seguran?a). Voc? precisa obter sua pr?pria:

### Op??o 1: Obter API Key Gratuita
1. Visite: https://tavily.com
2. Crie uma conta gratuita
3. Acesse seu dashboard
4. Copie sua API key (formato: `tvly-...`)

### Op??o 2: Verificar se j? tem API key configurada
Se voc? j? usa o Qwen Code e tem uma API key configurada, pode usar a mesma:

```bash
# Verificar se j? est? configurada
echo $TAVILY_API_KEY
```

## ?? Configura??o da API Key

### Configurar vari?vel de ambiente:

```bash
# Linux/Mac
export TAVILY_API_KEY=your_api_key_here

# Windows (PowerShell)
$env:TAVILY_API_KEY="your_api_key_here"

# Ou criar arquivo .env na raiz do projeto
echo "TAVILY_API_KEY=your_api_key_here" >> .env
```

## ?? Teste da Implementa??o

Execute o teste para validar:

```bash
# Se TAVILY_API_KEY estiver configurada
npx tsx test-web-search-tavily.ts

# Ou configurar inline
TAVILY_API_KEY=your_key npx tsx test-web-search-tavily.ts
```

## ? Valida??o da Implementa??o

### Teste 1: Sem API Key (deve retornar erro informativo)
```bash
unset TAVILY_API_KEY  # Remover se existir
npx tsx test-web-search-tavily.ts
# Esperado: Mensagem informando que TAVILY_API_KEY n?o est? configurada
```

### Teste 2: Com API Key v?lida (deve retornar resultados)
```bash
export TAVILY_API_KEY=your_valid_key
npx tsx test-web-search-tavily.ts
# Esperado: Resultados de busca com answer, results e sources
```

### Teste 3: API Key inv?lida (deve retornar erro da API)
```bash
export TAVILY_API_KEY=invalid_key
npx tsx test-web-search-tavily.ts
# Esperado: Erro "Unauthorized: missing or invalid API key"
```

## ?? Estrutura de Resposta Esperada

Quando funcionando corretamente, a API retorna:

```json
{
  "query": "javascript tutorial",
  "answer": "JavaScript is a programming language...",
  "totalResults": 5,
  "results": [
    {
      "title": "JavaScript Tutorial",
      "url": "https://example.com",
      "description": "Conte?do completo...",
      "content": "Conte?do completo...",
      "score": 0.95,
      "published_date": "2024-01-01"
    }
  ],
  "sources": [
    {
      "title": "JavaScript Tutorial",
      "url": "https://example.com"
    }
  ]
}
```

## ?? Compara??o com Qwen Code

A implementa??o segue exatamente a mesma estrutura:

? Mesma URL da API: `https://api.tavily.com/search`  
? Mesmos par?metros: `api_key`, `query`, `search_depth: 'advanced'`, `max_results`, `include_answer: true`  
? Mesma estrutura de resposta  
? Mesmo tratamento de erros  

## ?? Nota Importante

O Qwen Code n?o fornece uma API key p?blica compartilhada. Cada usu?rio precisa obter sua pr?pria API key do Tavily. A implementa??o est? correta e pronta - apenas precisa de uma API key v?lida para funcionar.
