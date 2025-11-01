# ?? Guia R?pido de Testes

## ? Corre??es Aplicadas

1. ? Modelo corrigido: `qwen3-coder-plus`
2. ? Kanban inteligente implementado
3. ? System prompt otimizado

---

## ?? Como Testar

### Prepara??o

```bash
cd /workspace/youtube-cli
npm run build  # Build j? feito ?
```

### Teste 1: Verificar Modelo

```bash
cat config.json
```

**Deve mostrar:**
```json
{
  "endpoint": "https://portal.qwen.ai/v1",
  "apiKey": "Un0Ig...",
  "model": "qwen3-coder-plus",  // ? Modelo correto
  "maxVideos": 10,
  "maxCommentsPerVideo": 100
}
```

---

### Teste 2: Tarefa Simples (SEM Kanban)

```bash
npm run start -- --prompt "Read the package.json file"
```

**Resultado esperado:**
```
[*] AUTONOMOUS AI AGENT - NON-INTERACTIVE
===========================================

[+] Loaded configuration:
    Model: qwen3-coder-plus  ?

[>] User Task:
    "Read the package.json file"

[*] Processing...

[>] TOOL: READ_FILE
    Args: {"file_path":"package.json"}...
    [+] Success

===========================================
[+] FINAL RESULTS
===========================================

[AI RESPONSE]
The package.json file contains...

===========================================
[+] TASK COMPLETE
===========================================
```

**? Validar:**
- N?O deve criar Kanban
- Apenas 1 tool call (READ_FILE)
- Resposta r?pida e direta

---

### Teste 3: Tarefa Complexa (COM Kanban)

```bash
npm run start -- --prompt "Create hello.js with a function, test.js with tests, and readme.md with documentation"
```

**Resultado esperado:**
```
[*] AUTONOMOUS AI AGENT - NON-INTERACTIVE
===========================================

[+] Loaded configuration:
    Model: qwen3-coder-plus  ?

[>] User Task:
    "Create hello.js with a function, test.js..."

[*] Processing...

[TASK BOARD UPDATE]
    o Pending: 3 | o In Progress: 0 | + Done: 0

[>] TOOL: UPDATE_KANBAN
    [+] Success

[>] TOOL: WRITE_FILE
    Args: {"file_path":"hello.js"}...
    [+] Success

[TASK BOARD UPDATE]
    o Pending: 2 | o In Progress: 0 | + Done: 1

[>] TOOL: WRITE_FILE
    Args: {"file_path":"test.js"}...
    [+] Success

[TASK BOARD UPDATE]
    o Pending: 1 | o In Progress: 0 | + Done: 2

[>] TOOL: WRITE_FILE
    Args: {"file_path":"readme.md"}...
    [+] Success

[TASK BOARD UPDATE]
    o Pending: 0 | o In Progress: 0 | + Done: 3

===========================================
[+] FINAL RESULTS
===========================================

[TASK SUMMARY]
    [+] Completed: 3/3 tasks

[AI RESPONSE]
I've created all three files:
1. hello.js with...
2. test.js with...
3. readme.md with...

[*] Work Directory: /workspace/work/task-1234567890

===========================================
[+] TASK COMPLETE
===========================================
```

**? Validar:**
- Kanban DEVE ser criado (tarefa com 3+ passos)
- 3 arquivos criados
- Progresso trackado
- Task summary mostra 3/3 completed

---

### Teste 4: Modo Interativo

```bash
npm run dev
```

**Comandos para testar:**

#### 4.1: Listar Tools
```
/tools
```

**Deve mostrar 10 tools incluindo:**
- search_youtube_comments ?

#### 4.2: Tarefa Simples
```
read the package.json
```

**Deve:**
- ? Executar read_file diretamente
- ? N?O criar Kanban

#### 4.3: Tarefa Complexa
```
create a web app with index.html, style.css, and script.js
```

**Deve:**
- ? Criar Kanban com 3 tasks
- ? Mostrar progresso na timeline
- ? Bolinhas coloridas (? branco ? ? laranja ? ? verde)

---

### Teste 5: Tool do YouTube

```bash
npm run start -- --prompt "What are the top 3 comments about TypeScript on YouTube?"
```

**Resultado esperado:**
```
[>] TOOL: SEARCH_YOUTUBE_COMMENTS
    Args: {"query":"TypeScript"}...
    [+] Success

[AI RESPONSE]
Based on 250 comments from 5 videos:

Top 3 most liked comments:
1. "TypeScript is amazing! (142 likes)
2. "Best tutorial ever" (98 likes)
3. "Changed my life" (87 likes)
```

**? Validar:**
- Tool YOUTUBE ? chamada
- Coment?rios s?o extra?dos
- Resposta analisa os dados

---

## ?? Checklist de Valida??o

### Modelo
- ? config.json usa `qwen3-coder-plus`
- ? OAuth usa `qwen3-coder-plus`
- ? Build compila sem erros

### Kanban Inteligente
- ? Tarefa simples: SEM Kanban
- ? Tarefa complexa: COM Kanban
- ? Classifica??o funciona corretamente

### Tools
- ? Todas as 10 tools registradas
- ? YouTube tool funcional
- ? Comando /tools mostra todas

### UI
- ? Tema Monokai mantido
- ? Bolinhas coloridas no Kanban
- ? Logs limpos (sem emojis quebrados)

---

## ?? Troubleshooting

### Erro: "model not supported"

**Causa:** Token OAuth pode estar expirado

**Solu??o:**
```bash
# Remover credenciais antigas
rm qwen-credentials.json

# Ou atualizar o token no arquivo
```

### Kanban ainda sendo criado para tarefas simples

**Causa:** LLM pode estar interpretando mal

**Solu??o:** Seja mais espec?fico:
```bash
# Ao inv?s de:
"read file.txt"

# Use:
"just read file.txt and show me the content"
```

### Tool do YouTube n?o encontra v?deos

**Causa:** API key ou query pode estar incorreta

**Solu??o:**
- Verifique se `maxVideos` n?o ? 0
- Use query mais espec?fica
- Teste com: "programming tutorials"

---

## ?? Performance Esperada

### Tarefa Simples
- **Tool calls:** 1
- **Tempo:** < 3 segundos
- **Tokens:** ~100-200

### Tarefa Complexa (3 passos)
- **Tool calls:** 4-7 (Kanban + execu??o + updates)
- **Tempo:** ~10-15 segundos
- **Tokens:** ~500-1000

---

## ? Tudo Funcionando?

Se todos os testes passaram:
- ? Modelo correto configurado
- ? Kanban inteligente funcionando
- ? Tools todas operacionais
- ? UI limpa e profissional

**Sistema pronto para uso! ??**

---

## ?? Logs de Exemplo

### Sucesso com qwen3-coder-plus:
```
[+] Loaded configuration:
    Endpoint: https://portal.qwen.ai/v1
    Model: qwen3-coder-plus  ?
    
[>] TOOL: READ_FILE
    [+] Success
```

### Erro (modelo inv?lido):
```
[!] Error:
BadRequestError: 400 model `qwen-max` is not supported.
```

Se voc? v? o erro acima, o modelo ainda n?o foi atualizado corretamente!

---

## ?? Pronto!

Todos os problemas foram corrigidos:
1. ? Modelo Qwen correto
2. ? Kanban inteligente
3. ? Performance otimizada
4. ? 10 tools funcionais

**Happy coding!** ??
