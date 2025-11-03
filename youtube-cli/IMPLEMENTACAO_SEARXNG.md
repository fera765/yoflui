# Implementa??o SearXNG - Web Search

## ? Implementa??o Completa

O sistema de web search foi implementado usando **SearXNG** como motor principal com fallback para **DuckDuckGo API**.

## Arquitetura

### 1. Motor Principal: SearXNG
- Tenta m?ltiplas inst?ncias p?blicas do SearXNG
- Rota??o autom?tica entre inst?ncias
- Rastreamento de falhas para evitar inst?ncias problem?ticas
- Suporte para inst?ncia personalizada via vari?vel de ambiente `SEARXNG_INSTANCE`

### 2. Fallback: DuckDuckGo
- Usa DuckDuckGo Instant Answer API primeiro
- Fallback para scraping HTML se a API n?o retornar resultados
- Garante que sempre h? uma alternativa dispon?vel

## Inst?ncias SearXNG Configuradas

```typescript
const SEARXNG_INSTANCES = [
	'https://searx.tiekoetter.com',
	'https://searx.sp-codes.de',
	'https://search.sapti.me',
	'https://searx.prvcy.eu',
	'https://searx.xyz',
	'https://searx.be',
	'https://searx.org',
	'https://searx.neocities.org',
];
```

## Funcionalidades

### ? M?ltiplas Inst?ncias com Rota??o
- Sistema de rota??o autom?tica entre inst?ncias
- Rastreamento de falhas (m?ximo 5 falhas antes de marcar como indispon?vel)
- Reset autom?tico quando todas as inst?ncias falham

### ? Anti-Rate-Limiting
- Delays aleat?rios entre requisi??es
- Tratamento espec?fico para HTTP 429 (Too Many Requests)
- Tratamento para HTTP 403 (Forbidden)

### ? Fallback Robusto
- DuckDuckGo API Instant Answer
- Fallback para HTML scraping se necess?rio
- Garante disponibilidade mesmo quando SearXNG est? indispon?vel

### ? Parsing Inteligente
- Parsing de JSON do SearXNG
- Parsing de JSON do DuckDuckGo API
- Parsing de HTML do DuckDuckGo como ?ltimo recurso
- Remo??o de duplicatas

## Formato de Resposta

```json
{
	"query": "python programming",
	"engine": "duckduckgo",
	"totalResults": 5,
	"results": [
		{
			"title": "Python (programming language)",
			"description": "...",
			"url": "https://..."
		}
	]
}
```

## Configura??o

### Vari?vel de Ambiente (Opcional)
```bash
export SEARXNG_INSTANCE="https://sua-instancia-searxng.com"
```

## Teste

Execute o script de teste:
```bash
npx tsx test-searxng-search.ts
```

## Status Atual

? **Implementa??o Funcional**
- SearXNG integrado com m?ltiplas inst?ncias
- Fallback DuckDuckGo funcionando
- Testes confirmam que retorna resultados

?? **Limita??es Conhecidas**
- Inst?ncias p?blicas do SearXNG podem ter rate limiting
- Algumas inst?ncias podem bloquear requisi??es automatizadas
- DuckDuckGo API pode n?o retornar resultados para todas as queries

## Pr?ximos Passos Recomendados

1. **Hostear Inst?ncia Pr?pria**: Para melhor confiabilidade, considere hostear sua pr?pria inst?ncia SearXNG
2. **Cache de Resultados**: Implementar cache para reduzir requisi??es
3. **M?tricas**: Adicionar m?tricas de sucesso/falha por inst?ncia
4. **Health Check**: Implementar verifica??o peri?dica de sa?de das inst?ncias

## Arquivos Modificados

- `youtube-cli/source/tools/web-search.ts` - Implementa??o principal
- `youtube-cli/test-searxng-search.ts` - Script de teste
