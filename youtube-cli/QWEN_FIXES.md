# ?? Corre??es Qwen OAuth - 401 e Sele??o de Modelo

## ?? Problemas Corrigidos

### 1. Erro 401 - Token Expirado

**Erro Original:**
```
AuthenticationError: 401 "Your session has expired, or the token is no longer valid. Please sign in again to proceed."
```

**Causa:**
- Token expirado n?o estava sendo detectado corretamente
- Credenciais inv?lidas n?o eram limpas automaticamente
- Sistema n?o solicitava re-autentica??o

**Corre??o Implementada:**

#### A) Detec??o de 401 em `llm-service.ts`
```typescript
catch (error: any) {
  // Handle 401 authentication errors
  if (error?.status === 401) {
    // Clear credentials
    const { clearQwenCredentials } = await import('./qwen-oauth.js');
    clearQwenCredentials();
    
    throw new Error('Authentication expired. Please run /llm to re-authenticate with Qwen.');
  }
  throw error;
}
```

#### B) Limpeza Autom?tica de Tokens Expirados
```typescript
// Em getValidAccessToken()
if (expired && hasRefreshToken) {
  try {
    // Tenta refresh
    const newToken = await refreshAccessToken();
    // ...
  } catch (error) {
    // Se refresh falhar, limpa credenciais
    clearQwenCredentials();
    return null;
  }
}

// Se token expirado sem refresh token
clearQwenCredentials();
return null;
```

### 2. Sele??o de Modelo Ausente

**Problema:**
- Ap?s login, sistema usava modelo hardcoded (`qwen-max`)
- Usu?rio n?o podia escolher modelo preferido
- N?o listava modelos dispon?veis

**Corre??o Implementada:**

#### A) Busca de Modelos Dispon?veis
```typescript
// Novo m?todo em qwen-oauth.ts
export async function fetchQwenModels(accessToken: string): Promise<string[]> {
  const response = await fetch(`${QWEN_API_ENDPOINT}/models`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });
  
  const data = await response.json();
  
  // Parse models
  if (data.data && Array.isArray(data.data)) {
    return data.data.map(m => m.id || m.name).filter(Boolean);
  }
  
  // Fallback
  return ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long'];
}
```

#### B) Componente de Sele??o de Modelo
Novo arquivo: `source/components/QwenModelSelector.tsx`

```typescript
export const QwenModelSelector: React.FC<Props> = ({
  accessToken,
  onSelect,
  onBack,
}) => {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    const availableModels = await fetchQwenModels(accessToken);
    setModels(availableModels);
    setLoading(false);
  };

  return (
    <SelectInput
      items={models.map(model => ({
        label: model,
        value: model,
      }))}
      onSelect={item => onSelect(item.value)}
    />
  );
};
```

#### C) Fluxo Atualizado no OAuth Screen
```typescript
// Ap?s autentica??o bem-sucedida
setStep('success');

setTimeout(() => {
  setStep('select-model'); // Nova etapa
}, 1500);

// Renderiza??o condicional
if (step === 'select-model') {
  return (
    <QwenModelSelector
      accessToken={accessToken}
      onSelect={handleModelSelect}
      onBack={onBack}
    />
  );
}
```

## ?? Novo Fluxo Completo

### Primeira Autentica??o

```
1. /llm ? OAuth Qwen
   ?
2. Browser abre ? Login ? Autoriza
   ?
3. ? Authentication Successful!
   ?
4. ?? Loading available models...
   ?
5. Select Qwen Model:
   > qwen-max
     qwen-plus
     qwen-turbo
     qwen-long
   ?
6. ? Pronto para usar!
```

### Re-autentica??o (ap?s 401)

```
1. Request retorna 401
   ?
2. Sistema limpa credenciais automaticamente
   ?
3. Mensagem: "Authentication expired. Please run /llm"
   ?
4. Usu?rio: /llm
   ?
5. Refaz OAuth flow
   ?
6. Seleciona modelo novamente
   ?
7. ? Funcionando!
```

## ?? Nova UI de Sele??o de Modelo

### Loading State
```
? Select Qwen Model

? Loading available models...

Please wait...

Press Esc to cancel
```

### Model List
```
? Select Qwen Model

Available models (4 found):

> qwen-max
  qwen-plus
  qwen-turbo
  qwen-long

Press Enter to select ? Esc to go back
```

### Error State
```
? Select Qwen Model

Failed to load models: Network error

Using default model: qwen-max

Press any key to continue with default model
```

## ?? Modelos Dispon?veis

### Modelos Qwen Comuns

| Modelo | Capacidade | Uso Recomendado |
|--------|-----------|-----------------|
| **qwen-max** | Mais poderoso | An?lises complexas |
| **qwen-plus** | Balanceado | Uso geral |
| **qwen-turbo** | R?pido | Tarefas simples |
| **qwen-long** | Contexto longo | Textos extensos |

### Fallback
Se a API n?o retornar modelos ou falhar:
```typescript
return ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long'];
```

## ?? Melhorias de Seguran?a

### 1. Limpeza Autom?tica de Credenciais Inv?lidas
```typescript
// Antes: Token expirado permanecia no disco
// Depois: Limpa automaticamente

if (tokenExpired || refreshFailed) {
  clearQwenCredentials(); // Remove arquivo
}
```

### 2. Detec??o de 401 em Todas as Chamadas
```typescript
// Catch block em llm-service.ts
if (error?.status === 401) {
  clearQwenCredentials();
  throw new Error('Please re-authenticate');
}
```

### 3. Refresh Token Fail-Safe
```typescript
try {
  await refreshAccessToken(refreshToken);
} catch (error) {
  // Se refresh falhar, limpa tudo
  clearQwenCredentials();
  return null;
}
```

## ?? Arquivos Modificados/Criados

### Novos Arquivos
1. **`source/components/QwenModelSelector.tsx`** (120 linhas)
   - UI para sele??o de modelo
   - Loading/Error states
   - Fetch de modelos dispon?veis

### Arquivos Modificados
1. **`source/qwen-oauth.ts`**
   - Adicionado `fetchQwenModels()`
   - Melhorado `getValidAccessToken()` com limpeza autom?tica
   - Refresh fail-safe

2. **`source/llm-service.ts`**
   - Adicionado catch para erro 401
   - Limpeza autom?tica de credenciais
   - Mensagem clara para re-autentica??o

3. **`source/components/QwenOAuthScreen.tsx`**
   - Adicionado step `select-model`
   - Integra??o com `QwenModelSelector`
   - Fluxo atualizado ap?s autentica??o

## ? Checklist de Testes

- [x] 401 detectado e credenciais limpas
- [x] Mensagem clara para re-autentica??o
- [x] Modelos carregados ap?s login
- [x] Sele??o de modelo funcional
- [x] Fallback se API de modelos falhar
- [x] Refresh token com fail-safe
- [x] UI responsiva durante loading
- [x] Esc para cancelar em qualquer etapa

## ?? Como Testar

### Teste 1: Re-autentica??o ap?s 401
```bash
$ npm run start

# Usar at? aparecer erro 401
> Pesquise sobre X

Error: Authentication expired. Please run /llm

# Re-autenticar
> /llm
# Seleciona OAuth Qwen
# Autoriza
# Seleciona modelo
# ? Funcionando!
```

### Teste 2: Sele??o de Modelo
```bash
$ npm run start
> /llm
# OAuth Qwen
# [Ap?s login bem-sucedido]

? Select Qwen Model
Available models (X found):
> [Seleciona modelo desejado]
? Configurado!
```

### Teste 3: Token Expirado
```bash
# Editar ~/.qwen-youtube-analyst/oauth_creds.json
# Mudar expiry_date para data passada

$ npm run start
# Sistema detecta expirado
# Tenta refresh
# Se falhar, limpa e pede re-auth
```

## ?? Status Final

? **401 Error**: Detectado e tratado  
? **Credential Cleanup**: Autom?tico  
? **Model Selection**: Implementado  
? **Model Fetching**: Funcional  
? **Fallback Models**: Dispon?vel  
? **UI**: Elegante e responsiva  
? **Error Handling**: Completo  
? **Security**: Melhorado  

**Sistema 100% funcional com Qwen OAuth!** ??

---

**Data**: 31/10/2025  
**Vers?o**: 2.1.0  
**Build**: ? Success
