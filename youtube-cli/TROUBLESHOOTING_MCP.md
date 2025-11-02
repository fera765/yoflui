# Troubleshooting MCP

## Problema: Timeout ao instalar MCP

### Sintoma
```
? Error: Failed to initialize MCP: MCP request timeout: initialize
```

### Causa
O MCP pode demorar mais de 10 segundos para inicializar, especialmente na primeira execu??o quando o npx precisa baixar o pacote.

### Solu??o Aplicada
1. ? Timeout aumentado para **30 segundos** na inicializa??o
2. ? Aguardar **2 segundos** antes de enviar primeiro request
3. ? Timeout de 15s para outras opera??es (tools/list, tools/call)

## Problema: Warnings do NPM

### Sintoma
```
npm warn Unknown env config "version-commit-hooks"
npm warn Unknown env config "version-tag-prefix"
...
```

### Causa
Vari?veis de ambiente do npm sendo propagadas para o processo filho.

### Solu??o Aplicada
1. ? Filtrar warnings "npm warn" e "npm notice" do stderr
2. ? Limpar vari?veis `npm_config_*` do ambiente antes de spawn
3. ? Logs limpos apenas com erros reais

## Problema: Process closed with code null

### Sintoma
```
[MCP mcp-xxx] Process closed with code null
```

### Causa
Processo sendo killado ou terminando antes de responder.

### Solu??o Aplicada
1. ? Aguardar MCP estar pronto antes de enviar requests
2. ? Timeout maior para download e inicializa??o
3. ? Usar `notifications/initialized` (padr?o MCP) em vez de `initialized`

## Como Testar se MCP Funciona

### Teste Manual
```bash
# Terminal 1: Iniciar MCP manualmente
npx -y @pinkpixel/mcpollinations

# Terminal 2: Enviar request JSON-RPC
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test","version":"1.0.0"}}}' | npx -y @pinkpixel/mcpollinations
```

### Script de Teste
```bash
cd youtube-cli
node test-mcp-simple.mjs
```

Deve mostrar:
- ? Initialize response
- ? Lista de 9 tools
- ? Sem erros

## Tempos Esperados

| Opera??o | Primeira Vez | Pr?ximas Vezes |
|----------|--------------|----------------|
| Download via npx | 5-10s | 0s (cached) |
| Inicializa??o | 2-5s | 1-2s |
| Discovery tools | 1-2s | 1-2s |
| **Total** | **8-17s** | **2-4s** |

## Se Ainda N?o Funcionar

### 1. Verificar Conectividade npm
```bash
npm config get registry
# Deve retornar: https://registry.npmjs.org/
```

### 2. Testar Download Manual
```bash
npx -y @pinkpixel/mcpollinations --version
```

### 3. Limpar Cache npm
```bash
npm cache clean --force
```

### 4. Verificar Node/npm
```bash
node --version  # >= 18
npm --version   # >= 8
```

### 5. Ver Logs Detalhados
Editar `source/mcp/mcp-client.ts`:
```typescript
// Descomentar/adicionar logs:
console.log('[MCP] Sending request:', request);
console.log('[MCP] Received response:', message);
```

## MCPs Testados e Funcionando

| MCP | Tools | Status | Tempo Instala??o |
|-----|-------|--------|------------------|
| @pinkpixel/mcpollinations | 9 | ? OK | ~10s primeira vez |

## Pr?ximos MCPs para Testar

Sugest?es de MCPs para adicionar:
- `@modelcontextprotocol/server-filesystem`
- `@modelcontextprotocol/server-git`
- `@modelcontextprotocol/server-postgres`
- `@modelcontextprotocol/server-sqlite`

## Refer?ncias

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Available MCPs](https://github.com/modelcontextprotocol/servers)
