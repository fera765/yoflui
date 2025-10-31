# ? REFATORA??O COMPLETA - FUNCTION CALLING NATIVO

## ?? Mudan?as Implementadas

### 1. **LLM Service - Function Calling Nativo Restaurado**

**REMOVIDO**: Detec??o de inten??o manual (`detectYouTubeIntent`)

**IMPLEMENTADO**: Function calling padr?o OpenAI
```typescript
// Primeira chamada com tools
const response = await openai.chat.completions.create({
    model: config.model,
    messages,
    tools: [youtubeToolDefinition],
    tool_choice: 'auto',
});

// Se LLM chamar a tool
if (assistantMessage?.tool_calls) {
    // Executa YouTube scraper
    const toolResult = await executeYouTubeTool(query);
    
    // Segunda chamada com resultados
    messages.push({ role: 'tool', content: toolResult, ... });
    const finalResponse = await openai.chat.completions.create({
        model: config.model,
        messages,
    });
}
```

### 2. **Model Fetching - Compat?vel com Ambos Endpoints**

**Suporte para 2 formatos:**

#### Formato 1: llm7.io (Array simples)
```json
[
    {"id": "deepseek-v3.1", "object": "model", ...},
    {"id": "gemini-2.5-flash-lite", "object": "model", ...}
]
```

#### Formato 2: Endpoint Local (OpenAI-like com IDs complexos)
```json
{
    "object": "list",
    "data": [
        {"id": "flux", "object": "model", ...},
        {
            "id": {
                "name": "deepseek",
                "description": "DeepSeek V3.1",
                "tools": true,
                "aliases": [...]
            },
            ...
        }
    ]
}
```

**L?gica de parsing:**
```typescript
const modelsList = Array.isArray(data) ? data : (data.data || []);

return modelsList.map((model) => {
    // String ID ? retorna direto
    if (typeof model.id === 'string') {
        return model.id;
    }
    // Object ID ? extrai nome e verifica suporte a tools
    else if (typeof model.id === 'object' && model.id.name) {
        return model.id.tools ? model.id.name : null;
    }
    return null;
}).filter(id => id !== null);
```

## ?? Modelos com Suporte a Tools (Endpoint Local)

Filtrados automaticamente:
- ? deepseek (DeepSeek V3.1)
- ? gemini (Gemini 2.5 Flash Lite)
- ? gemini-search (Gemini + Google Search)
- ? mistral (Mistral Small 3.2 24B)
- ? openai (GPT-5 Nano)
- ? openai-audio (GPT-4o Mini Audio)
- ? openai-fast (GPT-4.1 Nano)
- ? openai-large (GPT-4.1)
- ? openai-reasoning (o4 Mini)
- ? qwen-coder (Qwen 2.5 Coder)
- ? roblox-rp (Llama 3.1 8B)
- ? bidara (NASA BIDARA)
- ? chickytutor
- ? evil
- ? midijourney
- ? rtist
- ? unity

**Modelos SEM tool support s?o automaticamente exclu?dos.**

## ?? Como Funciona Agora

### Fluxo com Endpoint Local (Tool Calling Nativo):

1. **Usu?rio**: "Pesquise sobre emagrecimento e suas dores"

2. **LLM detecta** a necessidade de buscar dados

3. **LLM chama** `search_youtube_comments` com:
   ```json
   {"query": "emagrecimento dores problemas"}
   ```

4. **Sistema executa** YouTube scraper

5. **Sistema retorna** top 50 coment?rios para LLM

6. **LLM analisa** e gera resposta completa

### Configura??o do Endpoint Local:

```bash
# Na CLI, digite:
/llm

# Configure:
Endpoint: http://localhost:8080/v1
API Key: (opcional)
Model: openai-large (ou outro com tool support)
```

## ? Melhorias

1. **Flexibilidade total**: Funciona com qualquer endpoint compat?vel com OpenAI
2. **Detec??o autom?tica**: Parser identifica formato de resposta
3. **Filtro inteligente**: S? mostra modelos com `tools: true`
4. **Function calling real**: LLM decide quando chamar a tool
5. **Fallback robusto**: Se falhar ao buscar modelos, usa lista padr?o

## ?? Testando

```bash
# Build
npm run build

# Iniciar CLI
npm run start

# Configurar endpoint local
/llm
> Endpoint: http://localhost:8080/v1
> Model: openai-large

# Testar tool calling
"What are the main pain points in weight loss?"
```

## ?? Arquivos Modificados

- `source/llm-config.ts` - Parser flex?vel de modelos
- `source/llm-service.ts` - Function calling nativo restaurado
- Build completo sem erros ?

## ?? Requisitos

Seu endpoint local DEVE:
1. Implementar OpenAI function calling (`tool_calls` no response)
2. Retornar modelos no formato correto
3. Suportar o campo `tools` no request

Se o endpoint N?O suportar function calling, a tool N?O ser? chamada (como acontecia com llm7.io).

---

**Status**: ? PRONTO PARA USO COM ENDPOINT LOCAL
**Data**: 31/10/2025
