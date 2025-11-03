# Suporte a Proxy no SearXNG - Redu??o de Rate Limiting

## ? Implementa??o Completa

Foi implementado suporte a proxy nas requisi??es HTTP para o SearXNG, o que ajuda a minimizar o rate limiting ao distribuir requisi??es atrav?s de diferentes IPs.

## Como Funciona

### 1. Proxy no Cliente (Nossa Implementa??o)
- **N?s** podemos usar proxies nas requisi??es HTTP que fazemos **PARA** o SearXNG
- Isso distribui requisi??es atrav?s de diferentes IPs
- Ajuda a evitar rate limiting baseado em IP
- Fallback autom?tico para conex?o direta se proxy falhar

### 2. Proxy no Servidor SearXNG (Configura??o do Servidor)
- O SearXNG **servidor** pode usar proxies para fazer requisi??es aos engines de busca (Google, Bing, etc.)
- Isso ? configura??o do servidor SearXNG, n?o podemos controlar em inst?ncias p?blicas
- Inst?ncias p?blicas podem ou n?o estar configuradas com proxies

## Configura??o

### Vari?vel de Ambiente

Configure proxies via vari?vel de ambiente `SEARXNG_PROXIES`:

```bash
# HTTP/HTTPS proxies
export SEARXNG_PROXIES="http://proxy1:8080,http://proxy2:8080,https://proxy3:8080"

# SOCKS proxies tamb?m s?o suportados
export SEARXNG_PROXIES="socks5://proxy1:1080,socks4://proxy2:1080"

# M?ltiplos tipos misturados
export SEARXNG_PROXIES="http://proxy1:8080,socks5://proxy2:1080,http://proxy3:8080"
```

### Suporte a Tipos de Proxy

? **HTTP Proxy**: `http://host:port`
? **HTTPS Proxy**: `https://host:port`
? **SOCKS4**: `socks4://host:port`
? **SOCKS5**: `socks5://host:port`

## Funcionalidades Implementadas

### ? Rota??o Autom?tica de Proxies
- Sistema de rota??o entre proxies dispon?veis
- Rastreamento de falhas por proxy
- Remo??o autom?tica de proxies com muitas falhas

### ? Fallback Inteligente
- Se proxy falhar, usa conex?o direta automaticamente
- Marca proxy como falhado ap?s 3 tentativas
- Reset autom?tico quando todos os proxies falham

### ? Estrat?gia de Uso
- Usa proxy para tentativas alternadas (a cada 2 tentativas)
- Reduz overhead quando proxies n?o est?o dispon?veis
- Mant?m performance mesmo sem proxies configurados

## Benef?cios

### ?? Distribui??o de Carga
- Requisi??es distribu?das atrav?s de m?ltiplos IPs
- Reduz chance de rate limiting por IP ?nico
- Melhora taxa de sucesso em inst?ncias p?blicas

### ??? Anonimato Parcial
- IPs de origem diferentes para cada requisi??o
- Dificulta rastreamento e bloqueio por IP
- Melhora privacidade das requisi??es

### ? Performance
- Fallback autom?tico para conex?o direta
- N?o impacta performance quando proxies n?o est?o dispon?veis
- Rota??o inteligente evita proxies lentos

## Exemplo de Uso

```typescript
// Com proxies configurados
process.env.SEARXNG_PROXIES = "http://proxy1:8080,http://proxy2:8080";

// Busca autom?tica usa proxies quando dispon?vel
const results = await executeWebSearchTool("python tutorial", 10);
```

## Limita??es

?? **Proxies P?blicos**: Proxies p?blicos gratuitos podem ser:
- Lentos ou inst?veis
- Bloqueados por algumas inst?ncias
- N?o confi?veis para produ??o

?? **Recomenda??o**: Para produ??o, use proxies privados ou configure sua pr?pria inst?ncia SearXNG com proxies.

## Monitoramento

O sistema registra:
- Quando proxy ? usado: `Using proxy http://proxy1:8080`
- Quando proxy falha: `Proxy http://proxy1:8080 failed, using direct connection`
- Status de rate limiting por inst?ncia

## Arquivos Modificados

- `youtube-cli/source/tools/web-search.ts` - Adicionado suporte a proxy
  - Fun??o `getNextProxy()` - Rota??o de proxies
  - Fun??o `createFetchWithProxy()` - Fetch com suporte a proxy
  - Integra??o com `searchWithSearXNG()`

## Depend?ncias

? J? inclu?das no projeto:
- `http-proxy-agent` - Para proxies HTTP
- `https-proxy-agent` - Para proxies HTTPS  
- `socks-proxy-agent` - Para proxies SOCKS

## Pr?ximos Passos

1. **Configurar Proxies**: Adicione proxies confi?veis via vari?vel de ambiente
2. **Monitorar**: Acompanhe logs para ver quais proxies est?o funcionando
3. **Otimizar**: Remova proxies que falham frequentemente
4. **Hostear Inst?ncia**: Para melhor controle, hoste sua pr?pria inst?ncia SearXNG com proxies configurados
