# ?? Quick Start - Sistema de Automa??o com Webhook

## Em 3 Passos Simples

### 1?? Instalar e Compilar

```bash
cd /workspace/youtube-cli
npm install
npm run build
```

### 2?? Iniciar o Flui

```bash
npm run dev
```

? A API de webhook inicia automaticamente na porta 8080!

### 3?? Explorar Automa??es

Digite `@` no chat e voc? ver?:

```
??????????????????????????????????????????????????????
? ?? Available Automations           ?? API          ?
?                                                    ?
? WEBHOOK-TRIGGERS                                   ?
?   ? YouTube Webhook Analysis - Analyzes YouTube...?
?                                                    ?
? GENERAL                                            ?
?     Hello World - A simple greeting                ?
?     Analyze Project - Analyzes project structure   ?
?                                                    ?
? ?? Click on an automation to execute it            ?
??????????????????????????????????????????????????????
```

---

## ?? Experimentar Webhook

### Op??o A: Via Interface

1. Digite `@`
2. Selecione "YouTube Webhook Analysis"
3. Sistema mostra URL do webhook
4. Copie o comando cURL fornecido
5. Execute em outro terminal

### Op??o B: Criar Nova Automa??o

Crie `automations/teste.json`:

```json
{
  "id": "teste",
  "version": "1.0.0",
  "metadata": {
    "name": "Teste Webhook",
    "description": "Automa??o de teste",
    "category": "test"
  },
  "triggers": [
    {
      "type": "exact",
      "pattern": "@teste"
    }
  ],
  "webhookConfig": {
    "enabled": true,
    "requireAuth": false,
    "method": "POST",
    "expectedPayload": {
      "mensagem": "string"
    }
  },
  "variables": {
    "mensagem": {
      "type": "string",
      "defaultValue": "Ol?"
    }
  },
  "steps": [
    {
      "id": "step_1",
      "type": "log",
      "message": "?? Recebido: ${variables.mensagem}"
    },
    {
      "id": "step_2",
      "type": "llm_process",
      "prompt": "Responda de forma criativa ? seguinte mensagem: ${variables.mensagem}",
      "saveResultAs": "resposta"
    },
    {
      "id": "step_3",
      "type": "log",
      "message": "?? ${variables.resposta}"
    }
  ],
  "errorHandling": {
    "onStepError": "skip"
  }
}
```

Reinicie o Flui e a automa??o aparecer?!

---

## ?? Exemplo Completo de Uso

### 1. Iniciar Flui

```bash
cd /workspace/youtube-cli && npm run dev
```

### 2. Selecionar Automa??o

```
Voc?: @

[Interface mostra automa??es]

Voc?: [Clica em "Teste Webhook"]
```

### 3. Sistema Responde

```
Assistente:
?? Webhook Created Successfully

URL: http://127.0.0.1:8080/webhook/teste/abc123
Method: POST

Example cURL:
curl -X POST http://127.0.0.1:8080/webhook/teste/abc123 \
  -H "Content-Type: application/json" \
  -d '{"mensagem": "Ol?, Flui!"}'

?? O webhook est? ativo. Continue conversando normalmente!
```

### 4. Conversar Normalmente

```
Voc?: Como est? o tempo hoje?
Assistente: [Responde normalmente sobre o tempo]
```

### 5. Acionar Webhook (Outro Terminal)

```bash
curl -X POST http://127.0.0.1:8080/webhook/teste/abc123 \
  -H "Content-Type: application/json" \
  -d '{"mensagem": "Ol?, Flui!"}'
```

### 6. Ver Execu??o no Flui

```
Assistente:
?? Webhook acionado para: Teste Webhook

?? Executando automa??o: Teste Webhook...

?? Recebido: Ol?, Flui!

?? Processando com LLM...

?? Ol?! ? um prazer receber sua mensagem! 
   Como posso ajud?-lo hoje? ??

? Automa??o completa!
```

### 7. Perguntar Sobre a Automa??o

```
Voc?: O que voc? acabou de processar?

Assistente: Acabei de executar a automa??o "Teste Webhook" que foi 
acionada por um webhook externo. Recebi a mensagem "Ol?, Flui!" 
via POST request e processei com minha LLM para criar uma resposta 
personalizada. Todo o contexto dessa execu??o est? dispon?vel para 
nossas pr?ximas conversas!
```

---

## ?? Pr?ximos Passos

1. **Ler documenta??o completa**
   ```bash
   cat /workspace/WEBHOOK_SYSTEM_COMPLETE.md
   ```

2. **Ver guia de automa??es**
   ```bash
   cat /workspace/youtube-cli/WEBHOOK_AUTOMATION_GUIDE.md
   ```

3. **Criar suas pr?prias automa??es**
   - Adicione JSON em `automations/`
   - Reinicie o Flui
   - Use `@` para executar!

4. **Integrar com sistemas externos**
   - Use os webhooks para acionar automa??es
   - GitHub Actions, Zapier, Make, etc.
   - APIs externas podem disparar fluxos

---

## ?? Recursos Avan?ados

### M?ltiplos Triggers

Uma automa??o pode ter m?ltiplos triggers:

```json
"triggers": [
  {
    "type": "exact",
    "pattern": "@analise"
  },
  {
    "type": "contains",
    "pattern": "analisar"
  },
  {
    "type": "regex",
    "pattern": "^an?lise.*"
  }
]
```

### Condicionais

Use l?gica condicional:

```json
{
  "id": "step_check",
  "type": "conditional",
  "condition": "variables.valor > 100",
  "thenSteps": ["step_high"],
  "elseSteps": ["step_low"]
}
```

### Ferramentas Dispon?veis

- `write_file` - Escrever arquivos
- `read_file` - Ler arquivos
- `execute_shell` - Executar comandos
- `search_web` - Buscar na web
- `scrape_website` - Extrair dados de sites
- `search_youtube_comments` - Buscar no YouTube
- `analyze_folder` - Analisar estrutura de pastas
- E mais...

### Processamento LLM

A LLM tem acesso a todas as ferramentas e pode:
- Decidir qual ferramenta usar
- Adaptar par?metros dinamicamente
- Tratar erros de forma inteligente
- Combinar m?ltiplas ferramentas
- Manter contexto entre passos

---

## ?? Dicas

1. **Use nomes descritivos** para steps e vari?veis
2. **Teste localmente** antes de expor webhooks
3. **Use autentica??o** em produ??o (`requireAuth: true`)
4. **Mantenha automa??es simples** - combine v?rias pequenas
5. **Documente** suas automa??es no campo `description`

---

## ? Problemas?

### API n?o inicia

```bash
# Verificar se porta 8080 est? ocupada
lsof -i :8080

# Matar processo na porta
kill -9 [PID]
```

### Automa??o n?o aparece

```bash
# Verificar sintaxe JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('automations/minha.json')))"

# Reiniciar Flui
# Ctrl+C e npm run dev novamente
```

### Webhook n?o dispara

```bash
# Testar health check
curl http://127.0.0.1:8080/health

# Verificar logs do Flui
# Webhook triggers aparecem no chat
```

---

## ?? Pronto!

Voc? agora tem um sistema completo de automa??es coordenadas por LLM com suporte a webhooks!

**Divirta-se criando automa??es incr?veis! ??**
