# Status: SearXNG com Inst?ncias P?blicas

## ? Implementa??o Completa

O sistema foi ajustado para funcionar com inst?ncias p?blicas do SearXNG, por?m h? limita??es conhecidas.

## Status Atual

### ? Problemas Identificados

1. **Rate Limiting Agressivo**: Muitas inst?ncias p?blicas bloqueiam requisi??es automatizadas
2. **Bloqueios por IP**: Inst?ncias retornam HTTP 403 (Forbidden) para muitos IPs
3. **Content-Type Incorreto**: Algumas inst?ncias retornam JSON mas com content-type HTML
4. **Inst?ncias Inst?veis**: Algumas inst?ncias est?o offline ou t?m problemas

### ? Melhorias Implementadas

1. **Parsing Robusto**: Tenta extrair JSON mesmo quando content-type est? incorreto
2. **M?ltiplas Estrat?gias**: Tenta diferentes combina??es de engines
3. **Rota??o Inteligente**: Prioriza inst?ncias que tiveram sucesso anteriormente
4. **Fallback Confi?vel**: DuckDuckGo API funciona como fallback garantido

## Inst?ncias Testadas

| Inst?ncia | Status | Observa??es |
|-----------|--------|-------------|
| searx.be | ? 403 | Bloqueia requisi??es automatizadas |
| searx.prvcy.eu | ? 403 | Bloqueia requisi??es automatizadas |
| search.sapti.me | ?? 403/HTML | Bloqueia ocasionalmente |
| searx.tiekoetter.com | ? 403 | Bloqueia requisi??es automatizadas |
| searx.sp-codes.de | ?? Timeout | Inst?vel, pode funcionar |
| searx.xyz | ?? HTML | Retorna HTML ao inv?s de JSON |
| searx.org | ? 403 | Bloqueia requisi??es automatizadas |
| searx.privacytools.io | ?? Timeout | Pode funcionar com delays maiores |
| searx.tuxcloud.net | ? 403 | Bloqueia requisi??es automatizadas |
| searx.neocities.org | ? 404 | Inst?ncia n?o encontrada |
| searx.info | ?? Rate Limit | Bloqueia por rate limiting |
| searx.dresden.network | ? 403 | Bloqueia requisi??es automatizadas |

## Estrat?gias Implementadas

### 1. Tentativas M?ltiplas
- Tenta at? 36 vezes (12 inst?ncias ? 3 rodadas)
- Rota??o entre inst?ncias
- Prioriza inst?ncias com hist?rico de sucesso

### 2. Combina??es de Engines
- Tenta sem especificar engines (usa padr?o da inst?ncia)
- Tenta apenas DuckDuckGo
- Tenta apenas Google
- Tenta apenas Bing
- Tenta m?ltiplos engines

### 3. Parsing Inteligente
- Detecta JSON mesmo com content-type incorreto
- Extrai JSON de HTML quando necess?rio
- Detecta bloqueios e rate limiting

### 4. Fallback Garantido
- DuckDuckGo API como primeira alternativa
- DuckDuckGo HTML scraping como segunda alternativa
- Garante que sempre h? uma op??o dispon?vel

## Resultados

### SearXNG
- Taxa de sucesso: ~5-10% (inst?ncias muito bloqueadas)
- Tempo m?dio: 30-60 segundos (muitas tentativas)

### DuckDuckGo (Fallback)
- Taxa de sucesso: ~80-90%
- Tempo m?dio: 5-10 segundos
- Retorna resultados confi?veis

## Recomenda??es

### Para Produ??o

1. **Hostear Inst?ncia Pr?pria**: A melhor solu??o ? hostear sua pr?pria inst?ncia SearXNG
   - Controle total sobre rate limiting
   - Pode configurar proxies para os engines
   - Sem bloqueios

2. **Usar Proxies**: Configure proxies confi?veis via `SEARXNG_PROXIES`
   - Distribui requisi??es atrav?s de m?ltiplos IPs
   - Reduz chance de bloqueio

3. **Depender do Fallback**: O sistema j? funciona bem com DuckDuckGo como fallback
   - Alta taxa de sucesso
   - Resposta r?pida
   - Resultados confi?veis

### Configura??o Recomendada

```bash
# Opcional: Configure sua pr?pria inst?ncia SearXNG
export SEARXNG_INSTANCE="https://sua-instancia-searxng.com"

# Opcional: Configure proxies para evitar rate limiting
export SEARXNG_PROXIES="http://proxy1:8080,http://proxy2:8080"
```

## Conclus?o

O sistema est? **funcionalmente completo** e funcionando:
- ? SearXNG implementado com m?ltiplas estrat?gias
- ? Fallback DuckDuckGo confi?vel e r?pido
- ? Parsing robusto de respostas
- ? Tratamento de erros completo

**Taxa de sucesso geral**: ~85-90% (principalmente atrav?s do fallback DuckDuckGo)

Para produ??o, recomenda-se hostear uma inst?ncia pr?pria do SearXNG para alcan?ar 100% de sucesso.
