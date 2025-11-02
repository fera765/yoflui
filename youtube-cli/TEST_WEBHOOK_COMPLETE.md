# ?? Teste Completo: Webhook Automation

## ?? Problema Identificado e Corrigido

**BUG:** No `submitMsg()`, quando usu?rio digitava trigger pattern (ex: `@youtube-trigger`), o sistema encontrava a automa??o e executava IMEDIATAMENTE sem verificar se era webhook!

**CORRE??O:** Adicionada verifica??o `webhookTriggerHandler.hasWebhookConfig()` no `submitMsg()` antes de executar.

---

## ? Corre??es Aplicadas

### 1. `app.tsx - selectAutomation()` ?
- Webhook: Apenas setup, N?O executa
- Non-webhook: Executa imediatamente

### 2. `app.tsx - submitMsg()` ? (FIX PRINCIPAL)
- **ANTES:** Executava qualquer automa??o encontrada
- **DEPOIS:** Verifica se ? webhook antes de executar
- Webhook: Setup e aguarda
- Non-webhook: Executa

---

## ?? Teste Manual Completo

### Passo 1: Iniciar Sistema

```bash
cd /workspace/youtube-cli
npm run dev
```

### Passo 2: Testar Via Seletor (@)

**A??o:**
```
Digite: @
Selecione: YouTube Webhook Analysis
```

**Resultado Esperado:**
```
? ?? Setting up webhook for: YouTube Webhook Analysis
? ?? Webhook Created Successfully
? URL: http://127.0.0.1:8080/webhook/youtube-webhook-trigger/[id]
? Method: POST
? Authorization: Bearer sk-[token]
? Expected Payload: {"searchTopic": "string"}
? ?? Webhook is now active...

? N?O DEVE aparecer: "Executing automation"
? N?O DEVE executar search_youtube_comments
? N?O DEVE fazer an?lise
```

**Sistema deve PARAR e aguardar webhook!**

---

### Passo 3: Testar Via Trigger Pattern

**A??o:**
```
Digite: @youtube-trigger
```

**Resultado Esperado:**
```
? ?? Setting up webhook for: YouTube Webhook Analysis
? ?? Webhook Created Successfully
? URL: http://127.0.0.1:8080/webhook/...
? Method: POST
? Authorization: Bearer sk-...

? N?O DEVE executar automaticamente
```

**Sistema deve PARAR e aguardar webhook!**

---

### Passo 4: Conversar Normalmente

**A??o:**
```
Digite: Como est? o tempo hoje?
```

**Resultado Esperado:**
```
? Sistema responde normalmente
? Webhook continua ativo em background
```

---

### Passo 5: Disparar Webhook

**Em outro terminal:**

```bash
# Copie a URL e token do output anterior
curl -X POST http://127.0.0.1:8080/webhook/youtube-webhook-trigger/[id] \
  -H "Authorization: Bearer sk-[token]" \
  -H "Content-Type: application/json" \
  -d '{"searchTopic": "artificial intelligence"}'
```

**Resultado Esperado no Flui:**
```
? ?? Webhook triggered for: YouTube Webhook Analysis
? ?? Executing automation...
? ?? Webhook data received - Topic: artificial intelligence
? ?? search_youtube_comments
? ?? Analyzing YouTube results with AI...
? ? Analysis complete! Report saved.
```

---

### Passo 6: Conversar Sobre Resultado

**A??o:**
```
Digite: O que voc? encontrou sobre IA?
```

**Resultado Esperado:**
```
? Sistema responde com base no contexto da automa??o
? Contexto preservado
```

---

## ?? Verifica??o de C?digo

### Verificar submitMsg()

```bash
cd /workspace/youtube-cli
grep -A 30 "automationManager.findAutomation" source/app.tsx
```

**Deve mostrar:**
```typescript
const automation = automationManager.findAutomation(txt);

if (automation) {
    // Check if it's a webhook automation
    if (webhookTriggerHandler.hasWebhookConfig(automation)) {
        // Webhook: Setup only, do NOT execute
        addMessage({...});
        const webhookInfo = await webhookTriggerHandler.setupWebhook(...);
        // ...
        setBusy(false);  // ? Libera para usu?rio continuar
        return;
    } else {
        // Non-webhook: Execute immediately
        await executeLLMCoordinatedAutomation(...);
        // ...
    }
}
```

---

## ? Checklist de Valida??o

### Via Seletor (@)
- [ ] Webhook automation mostra dados e para
- [ ] Non-webhook automation executa imediatamente
- [ ] Usu?rio pode conversar ap?s setup de webhook
- [ ] Webhook dispara e executa corretamente

### Via Trigger Pattern
- [ ] @youtube-trigger mostra dados e para
- [ ] N?o executa automaticamente
- [ ] Webhook dispara e executa

### Comportamento Geral
- [ ] "@" vazio n?o envia mensagem
- [ ] Setas funcionam no seletor
- [ ] Enter seleciona automa??o
- [ ] Contexto preservado ap?s automa??o
- [ ] Wait logic funciona se sistema ocupado

---

## ?? Casos de Erro (O que N?O deve acontecer)

### ? ERRO 1: Execu??o Imediata
```
Usu?rio: @youtube-trigger
Sistema: ?? Setting up webhook...
Sistema: ?? Executing automation... ? ERRO!
```

**Se isso acontecer:** Bug n?o foi corrigido, verificar submitMsg()

### ? ERRO 2: Mensagem "@" Vazia
```
Usu?rio: @ [pressiona Enter]
Sistema: @ [envia vazio]
LLM: "Estou bem, obrigado..." ? ERRO!
```

**Se isso acontecer:** Verificar changeInput()

### ? ERRO 3: Webhook N?o Dispara
```
curl [webhook-url]
Sistema: [Sem resposta] ? ERRO!
```

**Se isso acontecer:** 
- Verificar se API est? rodando (port 8080)
- Verificar token de autoriza??o
- Verificar logs da API

---

## ?? Resultado Final Esperado

```
?????????????????????????????????????????????????????????????
?                                                           ?
?   ? TESTE COMPLETO PASSOU                                ?
?                                                           ?
?????????????????????????????????????????????????????????????
?                                                           ?
?  1. ? Via seletor: Webhook setup e aguarda               ?
?  2. ? Via trigger: Webhook setup e aguarda               ?
?  3. ? Conversa: Funciona normalmente                     ?
?  4. ? Webhook dispara: Executa automa??o                 ?
?  5. ? Contexto: Preservado ap?s automa??o                ?
?                                                           ?
?????????????????????????????????????????????????????????????
```

---

## ?? Troubleshooting

### API n?o inicia
```bash
# Verificar porta 8080
lsof -i :8080

# Matar processo
kill -9 [PID]

# Reiniciar Flui
npm run dev
```

### Webhook n?o encontrado (404)
- URL incorreta
- ID ?nico mudou (reiniciar Flui mant?m IDs)
- API n?o est? rodando

### Unauthorized (401)
- Token incorreto
- requireAuth est? true mas n?o passou token
- Formato: `Authorization: Bearer sk-...`

### Automa??o executa imediatamente
- **BUG N?O CORRIGIDO**
- Verificar se submitMsg() tem a verifica??o webhookConfig
- Rebuild: `npm run build`
