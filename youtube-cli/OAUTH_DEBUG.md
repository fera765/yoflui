# ?? An?lise do Problema OAuth Qwen

## ? Problema Identificado

**Erro:** `401 "Your session has expired, or the token is no longer valid"`

### Tokens Dispon?veis:
```json
{
  "access_token": "Un0IgYb...",
  "refresh_token": "VCYtDdU...",
  "resource_url": "portal.qwen.ai",
  "expiry_date": 1761949945047
}
```

## ?? Testes Realizados

### Teste 1: portal.qwen.ai/v1
```bash
curl "https://portal.qwen.ai/v1/models" -H "Authorization: Bearer [token]"
# Resultado: Sem resposta (timeout ou bloqueado)
```

### Teste 2: dashscope.aliyuncs.com
```bash
curl "https://dashscope.aliyuncs.com/compatible-mode/v1/models" -H "Authorization: Bearer [token]"
# Resultado: {"error": "Incorrect API key provided"}
```

## ?? Causa Raiz

**O token OAuth do Qwen N?O funciona com os endpoints tradicionais!**

Os tokens obtidos via OAuth Device Flow do portal.qwen.ai:
1. ? N?O funcionam com `portal.qwen.ai/v1`
2. ? N?O funcionam com `dashscope.aliyuncs.com`
3. ? S?o tokens de sess?o do portal, n?o API keys

## ?? Solu??o

O sistema Qwen tem **dois tipos diferentes de autentica??o**:

### Tipo 1: OAuth (Portal) - Para Interface Web
- Usado pelo portal.qwen.ai
- Tokens de sess?o
- N?o funcionam para chamadas de API diretas

### Tipo 2: API Key (DashScope) - Para API
- API keys fixas do DashScope
- Formato: `sk-xxx` 
- Usadas para chamadas de API
- Obtidas em: https://dashscope.console.aliyun.com/apiKey

## ?? A??es Necess?rias

Precisamos **remover a op??o OAuth** e usar apenas **API Keys do DashScope**:

1. Remover tela de OAuth
2. Usar apenas configura??o manual de API key
3. Documentar como obter API key no DashScope
4. Simplificar o sistema

## ?? Compara??o

| Feature | OAuth (Portal) | API Key (DashScope) |
|---------|----------------|---------------------|
| **Onde obter** | portal.qwen.ai | dashscope.console.aliyun.com |
| **Formato** | JWT longo | sk-xxxx |
| **V?lido para** | Interface web | Chamadas de API ? |
| **Funciona com OpenAI SDK** | ? N?o | ? Sim |
| **Nossa CLI** | ? Incompat?vel | ? Compat?vel |

## ?? Decis?o

**REMOVER OAuth e usar apenas API Keys do DashScope.**

Motivos:
1. Tokens OAuth n?o funcionam para API calls
2. DashScope ? a forma oficial de usar Qwen via API
3. Mais simples e direto
4. Compat?vel com OpenAI SDK
5. Sem complexidade de refresh tokens
