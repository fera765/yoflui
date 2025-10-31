# ?? Qwen OAuth Device Flow - Implementa??o Oficial

## ?? Vis?o Geral

Implementei o **OAuth Device Flow** exatamente como o Qwen Code oficial, usando a estrat?gia de autentica??o sem precisar de Client ID/Secret manual.

## ? O Que Mudou

### ? Antes (Sistema Antigo)
```
1. Usu?rio precisa criar OAuth App no Alibaba Cloud
2. Copiar Client ID manualmente
3. Copiar Client Secret manualmente
4. Inserir credenciais na CLI
5. Autorizar no navegador
```

### ? Agora (Device Flow Oficial)
```
1. Digite /llm
2. Seleciona "OAuth Qwen"
3. Navegador abre automaticamente
4. Voc? faz login no qwen.ai
5. Autoriza
6. Pronto! ?
```

## ?? Como Funciona

### Device Flow (RFC 8628)

```
???????????????????????????????????????????
? 1. CLI solicita device code             ?
?    POST /api/v1/oauth2/device/code      ?
?                                         ?
? 2. Servidor retorna:                    ?
?    - device_code                        ?
?    - user_code                          ?
?    - verification_uri_complete          ?
?    - expires_in                         ?
???????????????????????????????????????????
              ?
              ?
???????????????????????????????????????????
? 3. CLI abre navegador automaticamente   ?
?    URL: chat.qwen.ai/auth?code=ABC123   ?
???????????????????????????????????????????
              ?
              ?
???????????????????????????????????????????
? 4. Usu?rio faz login no qwen.ai         ?
?    (Se j? estiver logado, skip)         ?
?                                         ?
? 5. Usu?rio clica em "Authorize"         ?
???????????????????????????????????????????
              ?
              ?
???????????????????????????????????????????
? 6. CLI faz polling a cada 2 segundos    ?
?    POST /api/v1/oauth2/token            ?
?                                         ?
?    Respostas poss?veis:                 ?
?    - authorization_pending (continua)   ?
?    - slow_down (aumenta intervalo)      ?
?    - success (obt?m tokens)             ?
???????????????????????????????????????????
              ?
              ?
???????????????????????????????????????????
? 7. Tokens salvos em:                    ?
?    ~/.qwen-youtube-analyst/             ?
?          oauth_creds.json               ?
?                                         ?
? 8. Nunca mais precisa logar!            ?
???????????????????????????????????????????
```

## ?? Uso Pr?tico

### Primeira Vez

```bash
$ npm run start

> /llm

? LLM Configuration

Select authentication mode:

> ?? OAuth Qwen (2000 requests/day - FREE)
  ?? Custom (Manual endpoint + API key)

[Seleciona OAuth Qwen]
```

```
? Qwen OAuth Authentication

? Authenticating with Qwen...

A browser window has been opened for authentication.
Please complete the authorization in your browser.

Waiting for authorization...
```

**No Navegador:**
```
??????????????????????????????????????????
?  Qwen.ai - Authorize Application       ?
??????????????????????????????????????????
?                                        ?
?  YouTube Analyst CLI wants to access   ?
?  your Qwen account                     ?
?                                        ?
?  This will allow the app to:           ?
?  ? Access Qwen models                  ?
?  ? Make API requests                   ?
?                                        ?
?          [ Authorize ]                 ?
?                                        ?
??????????????????????????????????????????
```

**Ap?s Autorizar:**
```
? Qwen OAuth Authentication

? Authentication Successful!

You are now authenticated with Qwen.
Quota: 2000 requests/day (free)

[Volta para chat automaticamente]
```

### Pr?ximas Vezes

```bash
$ npm run start

# Sistema carrega tokens automaticamente
# J? est? autenticado!
# Pronto para usar!
```

## ?? Quota e Limites

### Qwen OAuth (Gr?tis)
- **2000 requests/dia**
- **60 requests/minuto**
- Reset autom?tico a cada 24h
- Token v?lido por tempo estendido
- Refresh autom?tico quando expira

### C?lculo de Uso

Cada an?lise completa:
- 1? chamada LLM (detectar necessidade)
- 1 execu??o da tool (scraping)
- 2? chamada LLM (an?lise)
= **~3 requests por an?lise**

**2000 ? 3 = ~666 an?lises/dia**

Mais do que suficiente!

## ??? Estrutura de Arquivos

### Credentials Storage

```
~/.qwen-youtube-analyst/
??? oauth_creds.json
```

**Conte?do:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "dGhpcyBp...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "expiry_date": 1730403600000,
  "resource_url": "https://chat.qwen.ai/api/v1"
}
```

### Seguran?a

- ? Arquivo salvo em diret?rio do usu?rio
- ? N?o ? commitado no git (diferente de `.oauth-tokens.json`)
- ? Tokens expiram e s?o renovados automaticamente
- ? Sem credenciais hardcoded no c?digo

## ?? Arquivos Criados/Modificados

### Novos Arquivos

1. **`source/qwen-oauth.ts`** (390 linhas)
   - Device Flow completo
   - PKCE implementation
   - Token management
   - Auto-refresh

2. **`source/components/QwenOAuthScreen.tsx`** (130 linhas)
   - UI para OAuth flow
   - Estados de loading/success/error
   - Feedback visual

3. **`source/components/SimpleOAuthConfigScreen.tsx`** (150 linhas)
   - Sele??o entre Qwen OAuth e Custom
   - Roteamento simplificado

### Configura??es

**Endpoint Qwen:**
```typescript
const QWEN_OAUTH_BASE_URL = 'https://chat.qwen.ai';
const QWEN_API_ENDPOINT = 'https://chat.qwen.ai/api/v1';
const QWEN_OAUTH_CLIENT_ID = 'f0304373b74a44d2b584a3fb70ca9e56';
```

**Model Padr?o:**
```typescript
model: 'qwen-max'
```

## ?? Nova UI do Menu /llm

### Tela Inicial

```
? LLM Configuration

Select authentication mode:

> ?? OAuth Qwen (2000 requests/day - FREE)
  ?? Custom (Manual endpoint + API key)

Press Enter to confirm ? Esc to cancel
```

### Durante Autentica??o

```
? Qwen OAuth Authentication

? Authenticating with Qwen...

A browser window has been opened for authentication.
Please complete the authorization in your browser.

Waiting for authorization...

Press Esc to cancel
```

### Sucesso

```
? Qwen OAuth Authentication

? Authentication Successful!

You are now authenticated with Qwen.
Quota: 2000 requests/day (free)

[Redireciona automaticamente]
```

### Erro

```
? Qwen OAuth Authentication

? Authentication Failed

OAuth timeout: Authorization not completed in time

Press R to retry ? Esc to go back
```

## ?? Auto-Refresh de Tokens

O sistema detecta automaticamente quando tokens expiram:

```typescript
// Ao iniciar CLI ou fazer request
const token = await getValidAccessToken();

// Se token expirou
if (expired && hasRefreshToken) {
  // Refresh autom?tico
  const newToken = await refreshAccessToken();
  // Salva novos tokens
  saveQwenCredentials(newToken);
  // Continua normalmente
}
```

**Usu?rio nem percebe!**

## ?? Compara??o com Implementa??o Anterior

| Aspecto | Anterior (Manual) | Atual (Device Flow) |
|---------|-------------------|---------------------|
| **Setup** | Criar OAuth App | Nenhum |
| **Client ID** | Manual | Hardcoded |
| **Client Secret** | Manual | N?o precisa |
| **Browser** | Manual ou auto | Auto |
| **Polling** | Callback server | Polling nativo |
| **Storage** | `.oauth-tokens.json` | `~/.qwen-youtube-analyst/` |
| **Seguran?a** | M?dia | Alta |
| **UX** | 5 passos | 2 passos |

## ? Vantagens do Device Flow

1. **Mais Simples** - N?o precisa criar OAuth App
2. **Mais Seguro** - Sem Client Secret exposto
3. **Padr?o Oficial** - Usa mesma estrat?gia do Qwen Code
4. **UX Melhor** - Menos passos para o usu?rio
5. **Manuten??o** - N?o depende de credenciais externas

## ?? Seguran?a Implementada

### PKCE (Proof Key for Code Exchange)

```typescript
// Gera code_verifier aleat?rio
const codeVerifier = randomBytes(32).toString('base64url');

// Gera code_challenge (SHA-256)
const codeChallenge = createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

// Envia challenge na requisi??o
// Envia verifier ao trocar c?digo por token
```

**Protege contra:** Intercepta??o do c?digo de autoriza??o

### Token Expiration

```typescript
expiry_date: Date.now() + (expires_in * 1000)

// Antes de cada request
if (Date.now() > expiry_date) {
  await refreshAccessToken();
}
```

### Secure Storage

```typescript
// Diret?rio privado do usu?rio
const QWEN_DIR = '~/.qwen-youtube-analyst';

// Permiss?es Unix corretas automaticamente
```

## ?? Status Final

- ? **Device Flow** implementado
- ? **PKCE** implementado
- ? **Auto-refresh** funcional
- ? **Browser auto-open** ativo
- ? **Polling** com rate limiting
- ? **Storage** seguro
- ? **UI** elegante
- ? **Error handling** completo
- ? **Compat?vel** com Qwen oficial

**Sistema pronto para produ??o!** ??

---

**Baseado em:** [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code)  
**OAuth Spec:** [RFC 8628 - Device Authorization Grant](https://tools.ietf.org/html/rfc8628)  
**PKCE Spec:** [RFC 7636 - Proof Key for Code Exchange](https://tools.ietf.org/html/rfc7636)
