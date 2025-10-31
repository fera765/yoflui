# ?? Guia Completo - OAuth Qwen

## ?? Vis?o Geral

Sistema OAuth completo integrado para autentica??o com **Qwen (Alibaba Cloud DashScope)**. Permite usar at? **2000 requests/dia** gratuitamente atrav?s de OAuth, eliminando necessidade de gerenciar API keys manualmente.

## ? Funcionalidades Implementadas

- ?? **OAuth Flow Completo** - Autoriza??o via browser
- ?? **Token Persistence** - Salva tokens localmente (n?o precisa logar toda vez)
- ?? **Auto Refresh** - Atualiza tokens automaticamente quando expiram
- ?? **Callback Server** - Servidor local para receber c?digo de autoriza??o
- ?? **Auto Browser** - Abre navegador automaticamente
- ?? **Modo Custom** - Mant?m suporte para endpoints customizados
- ?? **2000 Requests/Dia** - Usa quota gratuita do Qwen

## ?? Como Funciona

### Fluxo OAuth

```
1. Usu?rio seleciona "OAuth Qwen" no menu /llm
   ?
2. Insere Client ID e Client Secret
   ?
3. Sistema gera URL de autoriza??o Qwen
   ?
4. Abre navegador automaticamente
   ?
5. Usu?rio autoriza no site da Alibaba Cloud
   ?
6. Callback recebe c?digo de autoriza??o
   ?
7. Sistema troca c?digo por access token
   ?
8. Salva tokens em .oauth-tokens.json
   ?
9. Pronto! Pode usar 2000 requests/dia
```

## ?? Setup Inicial

### 1. Criar Conta Alibaba Cloud

```
1. Acesse: https://www.alibabacloud.com
2. Crie uma conta gratuita
3. Ative o servi?o DashScope
```

### 2. Obter Credenciais OAuth

```
1. Acesse: https://dashscope.console.aliyun.com
2. V? em "API Keys" ou "OAuth Applications"
3. Crie uma nova OAuth Application:
   - Name: "YouTube Analyst CLI"
   - Redirect URI: http://localhost:3456/callback
   - Scopes: dashscope:read, dashscope:write
4. Copie Client ID e Client Secret
```

### 3. Configurar na CLI

```bash
# Inicie a CLI
npm run start

# Digite o comando
/llm

# Selecione "?? OAuth Qwen"
# Insira Client ID
# Insira Client Secret
# Navegador abrir? automaticamente
# Autorize o acesso
# Pronto! Tokens salvos
```

## ?? Interface do Menu /llm

### Tela Inicial

```
? LLM Configuration

Select authentication mode:

> ?? Custom (Manual endpoint + API key)
  ?? OAuth Qwen
```

### OAuth Qwen Flow

```
? LLM Configuration

Qwen Client ID
? [Digite seu Client ID aqui]

Get your credentials at: https://dashscope.console.aliyun.com

Press Enter to confirm ? Esc to cancel
```

```
? LLM Configuration

Qwen Client Secret
? [********]

Press Enter to confirm ? Esc to cancel
```

```
? LLM Configuration

? Authenticating with Qwen...
Please complete authorization in your browser
A new browser window should have opened
Waiting for callback...
```

### Browser - Autoriza??o

```
?? Browser abre automaticamente em:

https://oauth.aliyun.com/v2/oauth/authorize?
  client_id=YOUR_CLIENT_ID
  &redirect_uri=http://localhost:3456/callback
  &response_type=code
  &scope=dashscope:read+dashscope:write
  &state=abc123

Voc? clica em "Authorize" no site da Alibaba
```

### Callback Success

```
Browser mostra:

? Authorization Successful!
You can close this window and return to the terminal.
```

### Confirma??o Final

```
? LLM Configuration

? Configuration Ready

Mode: 
?? OAuth Qwen

Endpoint: 
https://dashscope.aliyuncs.com/compatible-mode/v1

Model: 
qwen-max

? Authenticated with Qwen OAuth

> ? Save Configuration
  ?? Logout from Qwen
  ? Cancel
```

## ?? Persist?ncia de Tokens

### Arquivo .oauth-tokens.json

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here...",
  "expiresAt": 1730403600000,
  "provider": "qwen"
}
```

**Localiza??o**: Raiz do projeto (`/workspace/youtube-cli/.oauth-tokens.json`)

**Seguran?a**: 
- ?? **N?O COMMITE** este arquivo no git
- J? est? no `.gitignore`
- Cont?m credenciais sens?veis

### Auto-Refresh

O sistema verifica automaticamente:

```typescript
// Ao carregar tokens
if (tokens.expiresAt && Date.now() > tokens.expiresAt) {
  // Token expirado, tenta refresh
  if (tokens.refreshToken) {
    const newTokens = await refreshAccessToken(
      tokens.refreshToken,
      clientId,
      clientSecret
    );
    // Salva novos tokens automaticamente
  }
}
```

## ?? Fluxo de Uso Di?rio

### Primeira Vez (Configura??o)

```bash
npm run start
/llm
# Seleciona OAuth Qwen
# Insere credenciais
# Autoriza no browser
# ? Pronto
```

### Pr?ximas Vezes (Autom?tico)

```bash
npm run start
# Sistema carrega tokens automaticamente
# Se token expirou, renova automaticamente
# Pronto para usar!
```

### Se Token Expirar

```
O sistema automaticamente:
1. Detecta expira??o
2. Usa refresh token
3. Obt?m novo access token
4. Salva novos tokens
5. Continua funcionando
```

### Se Refresh Token Expirar

```
CLI mostra:
"?? Token expired and refresh failed"
"Please re-authenticate:"

Voc?:
/llm ? OAuth Qwen ? Refaz autoriza??o
```

## ?? Limites do Qwen

### Quota Gratuita

- **2000 requests/dia** com OAuth
- Reseta a cada 24 horas
- Suficiente para uso intenso

### Configura??o Recomendada

```json
// config.json
{
  "endpoint": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "model": "qwen-max",
  "maxVideos": 7,
  "maxCommentsPerVideo": 10
}
```

**C?lculo**: 
- 1 an?lise = ~3 requests (1? chamada + tool + 2? chamada)
- 2000 ? 3 = ~666 an?lises/dia
- Mais do que suficiente!

## ??? Troubleshooting

### Problema 1: Browser n?o abre

**Sintoma**: Comando `/llm` n?o abre navegador

**Solu??o**:
```bash
# O terminal mostra o link:
?? Authorization URL:
   https://oauth.aliyun.com/v2/oauth/authorize?...

# Copie e cole manualmente no navegador
```

### Problema 2: "OAuth flow timeout"

**Sintoma**: Erro ap?s 5 minutos

**Causa**: N?o completou autoriza??o a tempo

**Solu??o**: Reinicie `/llm` e complete mais r?pido

### Problema 3: "Failed to exchange code"

**Sintoma**: Erro ao trocar c?digo por token

**Causa**: 
- Client ID/Secret incorretos
- Redirect URI diferente
- C?digo j? usado

**Solu??o**:
- Verifique credenciais
- Confirme redirect URI: `http://localhost:3456/callback`
- Gere novo c?digo (refa?a autoriza??o)

### Problema 4: Token n?o persiste

**Sintoma**: Precisa logar toda vez

**Causa**: Erro ao salvar `.oauth-tokens.json`

**Solu??o**:
```bash
# Verifique permiss?es
ls -la .oauth-tokens.json

# Deve existir ap?s autentica??o
# Se n?o existe, verifique logs de erro
```

### Problema 5: "Quota exceeded"

**Sintoma**: `429 Too Many Requests`

**Causa**: Ultrapassou 2000 requests/dia

**Solu??o**:
- Aguarde reset (24h)
- Ou upgrade para plano pago
- Ou use modo Custom com outro endpoint

## ?? Seguran?a

### Boas Pr?ticas

? **FA?A**:
- Adicione `.oauth-tokens.json` ao `.gitignore`
- Use OAuth em ambiente confi?vel
- Revogue acesso se comprometido
- Guarde Client Secret em seguran?a

? **N?O FA?A**:
- Commite tokens no git
- Compartilhe Client Secret
- Use em servidor p?blico sem prote??o
- Deixe tokens expostos

### Revogar Acesso

```
1. Acesse: https://dashscope.console.aliyun.com
2. V? em "OAuth Applications"
3. Encontre "YouTube Analyst CLI"
4. Clique em "Revoke"
5. Na CLI: /llm ? OAuth Qwen ? Logout
```

## ?? Compara??o: OAuth vs Custom

| Caracter?stica | OAuth Qwen | Custom |
|----------------|------------|--------|
| **Setup** | Uma vez | Manual |
| **API Key** | Autom?tico | Manual |
| **Quota** | 2000/dia gr?tis | Depende do provider |
| **Persist?ncia** | Sim (.oauth-tokens.json) | Via config.json |
| **Auto-Refresh** | ? Sim | ? N?o |
| **Seguran?a** | ? Tokens tempor?rios | ?? API key permanente |
| **Ease of Use** | ?? F?cil ap?s setup | ?? Precisa gerenciar key |

## ?? Arquivos Criados

```
youtube-cli/
??? .oauth-tokens.json          # ? Tokens OAuth (n?o commitar!)
??? source/
?   ??? oauth-manager.ts        # ? L?gica OAuth completa
?   ??? components/
?       ??? OAuthConfigScreen.tsx  # ? UI OAuth no /llm
??? docs/
    ??? QWEN_OAUTH_GUIDE.md     # Este arquivo
```

## ?? Exemplos de Uso

### Primeira Autentica??o

```bash
$ npm run start

> /llm

Select authentication mode:
> ?? OAuth Qwen

Qwen Client ID
> ????????????????

Qwen Client Secret
> ????????????????

[Browser abre automaticamente]
[Voc? clica em "Authorize"]

? Authorization Successful!

? Configuration Ready
Mode: ?? OAuth Qwen
Endpoint: https://dashscope.aliyuncs.com/compatible-mode/v1
Model: qwen-max

> ? Save Configuration

[Volta para chat]

> Pesquise sobre emagrecimento

[Funciona perfeitamente!]
[Usando OAuth Qwen com 2000 requests/dia]
```

### Logout

```bash
> /llm

? Configuration Ready
[...]
? Authenticated with Qwen OAuth

> ?? Logout from Qwen

[Tokens removidos]
[Pr?xima vez precisa autenticar novamente]
```

## ?? Roadmap

Futuras melhorias:

- [ ] Suporte a mais providers OAuth (OpenAI, Anthropic)
- [ ] Dashboard de uso de quota
- [ ] M?ltiplas contas OAuth
- [ ] Refresh autom?tico em background
- [ ] Notifica??o quando quota acabar

## ?? Refer?ncias

- [Alibaba Cloud DashScope](https://dashscope.console.aliyun.com)
- [OAuth 2.0 Spec](https://oauth.net/2/)
- [Qwen Models](https://help.aliyun.com/zh/dashscope/developer-reference/model-square)

---

**Status**: ? IMPLEMENTADO E FUNCIONAL  
**Quota**: 2000 requests/dia gr?tis  
**Persist?ncia**: Tokens salvos automaticamente  
**Auto-Refresh**: Ativado  
**Browser**: Abre automaticamente

**Sistema pronto para uso em produ??o!** ??
