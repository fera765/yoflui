# ?? AI YouTube Analyst - Sistema Completo

## ?? Vis?o Geral

Sistema de an?lise de coment?rios do YouTube usando IA com **function calling nativo**. Suporta dois modos de opera??o: interativo (CLI) e n?o-interativo (scripts).

## ? Funcionalidades

- ?? **Function Calling Nativo** - LLM decide quando buscar dados
- ?? **YouTube Scraping** - Sem API key necess?ria
- ?? **UI Elegante** - Design minimalista e moderno
- ?? **Configur?vel** - Via `config.json` ou comando `/llm`
- ?? **An?lise Inteligente** - Identifica pain points e insights
- ?? **Dois Modos** - Interativo e n?o-interativo
- ?? **Debug Completo** - Logs detalhados em ambos os modos

## ?? Quick Start

### Instala??o

```bash
# 1. Instalar depend?ncias
npm install

# 2. Build
npm run build

# 3. Configurar (opcional)
# Editar config.json com seu endpoint
```

### Uso R?pido

```bash
# Modo N?o-Interativo (recomendado para testes)
npm run start -- --prompt "Pesquise sobre emagrecimento e identifique as dores"

# Modo Interativo (CLI completa)
npm run start
```

## ?? Estrutura do Projeto

```
youtube-cli/
??? config.json                    # ? Configura??es padr?o
??? source/
?   ??? cli.tsx                    # Roteador de modos
?   ??? app.tsx                    # App interativo (React)
?   ??? non-interactive.ts         # ? Modo n?o-interativo
?   ??? llm-service.ts             # Integra??o LLM + Tools
?   ??? llm-config.ts              # Gerenciamento de config
?   ??? scraper.ts                 # YouTube scraping
?   ??? youtube-tool.ts            # Tool definition
?   ??? components/                # UI Components
?       ??? ElegantHeader.tsx      # ? Header minimalista
?       ??? ElegantTimeline.tsx    # ? Timeline limpa
?       ??? ElegantInput.tsx       # ? Input moderno
?       ??? ElegantConfigScreen.tsx # ? Config UI
??? test-e2e.ts                    # Testes end-to-end
??? docs/
    ??? NON_INTERACTIVE_MODE.md    # Documenta??o modo n?o-interativo
    ??? EXEMPLO_OUTPUT.md          # Exemplos de sa?da
    ??? FINAL_REPORT.md            # Relat?rio t?cnico
```

## ?? Configura??o (config.json)

```json
{
  "endpoint": "http://localhost:4000/v1",
  "apiKey": "",
  "model": "gemini",
  "maxVideos": 7,
  "maxCommentsPerVideo": 10
}
```

### Par?metros

| Campo | Descri??o | Padr?o | Range |
|-------|-----------|--------|-------|
| `endpoint` | URL da API OpenAI-compatible | `http://localhost:4000/v1` | - |
| `apiKey` | API Key (opcional) | `""` | - |
| `model` | Modelo com tool support | `gemini` | - |
| `maxVideos` | Quantidade de v?deos | `7` | 1-20 |
| `maxCommentsPerVideo` | Coment?rios por v?deo | `10` | 10-500 |

## ?? Modo N?o-Interativo

### Uso

```bash
npm run start -- --prompt "Sua pergunta aqui"
```

### Exemplos

```bash
# An?lise de nicho
npm run start -- --prompt "Pesquise sobre as dores de quem quer emagrecer"

# Tend?ncias
npm run start -- --prompt "O que as pessoas est?o dizendo sobre programa??o?"

# Insights de produto
npm run start -- --prompt "Quais problemas as pessoas t?m com cursos online?"
```

### Caracter?sticas

- ? Carrega `config.json` automaticamente
- ? Logs formatados com console.log
- ? Debug completo com `[DEBUG]` tags
- ? Exit code 0 (sucesso) ou 1 (erro)
- ? Ideal para scripts e automa??es

### Output

```
?????????????????????????????????????????????????????????
?        ?? AI YOUTUBE ANALYST - NON-INTERACTIVE       ?
?????????????????????????????????????????????????????????

?? Loaded configuration:
   Endpoint: http://localhost:4000/v1
   Model: gemini
   Max Videos: 7
   Max Comments/Video: 10

? User Prompt:
   "Pesquise sobre emagrecimento..."

? Processing...

?? Tool Called:
   Name: YouTube Search
   Query: "emagrecimento dores"

? Tool Completed:
   Videos: 7
   Comments: 70

?????????????????????????????????????????????????????????
?                    ?? RESULTS                         ?
?????????????????????????????????????????????????????????

?? Data Collection:
   ? 7 videos analyzed
   ? 70 comments extracted

?? AI Analysis:

[An?lise detalhada aqui...]

?????????????????????????????????????????????????????????
?                    ? COMPLETE                        ?
?????????????????????????????????????????????????????????
```

## ?? Modo Interativo (CLI)

### Uso

```bash
npm run start
```

### Interface

```
? AI YouTube Analyst                    gemini ? 3 msgs

                   ?

     Ask me anything about YouTube trends and insights


/llm config ? /exit quit ? esc clear

??????????????????????????????????????????
? ? Ask me anything about YouTube...    ?
??????????????????????????????????????????
```

### Comandos

- `/llm` - Abrir configura??es
- `/exit` - Sair da aplica??o
- `Esc` - Limpar input

### Caracter?sticas

- ? UI elegante com React + Ink
- ? Timeline limpa e moderna
- ? Configura??o via interface
- ? M?ltiplas queries em sequ?ncia
- ? Feedback visual em tempo real

## ?? Function Calling

### Como Funciona

1. **Usu?rio faz pergunta**: "Pesquise sobre X"
2. **LLM detecta necessidade**: Tool calling autom?tico
3. **Sistema executa tool**: Coleta dados do YouTube
4. **LLM recebe resultados**: Top N coment?rios
5. **LLM analisa e responde**: Insights + pain points

### Tool Definition

```typescript
{
  name: 'search_youtube_comments',
  description: 'Search YouTube videos and extract comments...',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query for YouTube videos'
      }
    },
    required: ['query']
  }
}
```

### Requisitos do Endpoint

? Implementar OpenAI function calling  
? Retornar `tool_calls` no response  
? Aceitar `tool` role nas mensagens  
? Processar `tool_call_id` corretamente  

## ?? Debug e Troubleshooting

### Logs de Debug

Ambos os modos incluem logs detalhados:

```
[DEBUG] LLM Response: {
  hasToolCalls: true,
  toolCallsLength: 1,
  content: null
}

[DEBUG] Sending tool results to LLM...

[DEBUG] Final response received: {
  length: 2847
}
```

### Problemas Comuns

#### 1. Tool n?o ? chamada

**Sintoma**: `hasToolCalls: false`

**Causa**: LLM n?o detectou necessidade  
**Solu??o**: Seja mais expl?cito no prompt

#### 2. Processing infinito

**Sintoma**: Trava ap?s "Sending tool results"

**Causa**: Segunda chamada falhando  
**Solu??o**: 
- Verificar logs de erro
- Reduzir `maxCommentsPerVideo`
- Validar formato do endpoint

#### 3. Erro 400/500

**Sintoma**: `BadRequestError: 400 status code`

**Causa**: Token limit ou formato inv?lido  
**Solu??o**: Reduzir quantidade de coment?rios

## ?? Performance

### Configura??es Recomendadas

| Uso | Videos | Comments | Tempo |
|-----|--------|----------|-------|
| **Desenvolvimento** | 3 | 20 | ~15s |
| **Produ??o R?pida** | 5 | 30 | ~25s |
| **Padr?o** | 7 | 10 | ~35s |
| **An?lise Profunda** | 10 | 50 | ~60s |

### Otimiza??o

```json
// config.json para produ??o
{
  "maxVideos": 5,
  "maxCommentsPerVideo": 30
}
```

**Total**: 5 ? 30 = 150 coment?rios (suficiente para an?lise de qualidade)

## ?? Testes

### Testes E2E

```bash
npm run test:e2e
```

Valida:
- ? YouTube scraping
- ? Comment extraction
- ? Tool execution
- ? LLM basic response
- ? LLM tool calling
- ? Complete E2E flow

### Teste Manual N?o-Interativo

```bash
bash test-non-interactive.sh
```

### Teste Manual Interativo

```bash
npm run start
# Digite: "Pesquise sobre programa??o"
```

## ?? Documenta??o Adicional

- ?? [NON_INTERACTIVE_MODE.md](NON_INTERACTIVE_MODE.md) - Guia completo do modo n?o-interativo
- ?? [EXEMPLO_OUTPUT.md](EXEMPLO_OUTPUT.md) - Exemplos de sa?das
- ?? [FINAL_REPORT.md](FINAL_REPORT.md) - Relat?rio t?cnico completo
- ? [TESTE_VALIDADO.md](TESTE_VALIDADO.md) - Valida??o de testes

## ?? Casos de Uso

### 1. Pesquisa de Mercado
```bash
npm run start -- --prompt "Quais s?o as principais dores no nicho de fitness?"
```

### 2. An?lise de Sentimento
```bash
npm run start -- --prompt "O que as pessoas est?o dizendo sobre curso X?"
```

### 3. Identifica??o de Problemas
```bash
npm run start -- --prompt "Quais problemas as pessoas t?m com produto Y?"
```

### 4. Tend?ncias
```bash
npm run start -- --prompt "O que est? em alta sobre tecnologia?"
```

## ?? Seguran?a

- ?? YouTube scraping pode violar ToS
- ?? Use com responsabilidade
- ?? Rate limiting implementado (3 req/sec)
- ?? Retry logic com exponential backoff

## ??? Stack Tecnol?gica

- **Runtime**: Node.js 16+
- **Language**: TypeScript
- **UI Framework**: React + Ink
- **Scraping**: scrape-youtube + youtubei.js
- **LLM Client**: OpenAI SDK
- **Validation**: Zod
- **Concurrency**: p-queue
- **Testing**: Vitest

## ?? Scripts

```bash
npm run build          # Compilar TypeScript
npm run start          # Modo interativo
npm run start -- --prompt "..." # Modo n?o-interativo
npm run test          # Testes unit?rios
npm run test:e2e      # Testes E2E
npm run dev           # Watch mode
```

## ?? Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudan?as (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## ?? Licen?a

MIT License - Veja LICENSE para detalhes

## ?? Status

? **Build**: Success  
? **Tests**: 6/6 Passing  
? **UI**: Elegant & Modern  
? **Function Calling**: Native  
? **Debug**: Complete  
? **Modes**: Interactive + Non-Interactive  
? **Config**: JSON File  
? **Documentation**: Complete  

**Sistema pronto para produ??o!** ??

---

**Vers?o**: 2.0.0  
**Data**: 31/10/2025  
**Autor**: Desenvolvido com Claude Sonnet 4.5
