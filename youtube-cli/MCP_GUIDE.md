# MCP (Model Context Protocol) - Guia Completo

## O que ? MCP?

MCP (Model Context Protocol) ? um protocolo criado pela Anthropic para conectar LLMs a ferramentas externas de forma padronizada. Este projeto implementa um cliente MCP completo que permite:

- Instalar MCPs de qualquer pacote npm
- Descobrir tools automaticamente via JSON-RPC
- Registrar tools MCP para a LLM usar
- Gerenciar MCPs instalados

## Como Usar

### 1. Acessar o Gerenciador de MCPs

No flui, digite:
```
/mcp
```

### 2. Instalar um MCP

Na tela de MCPs:
1. Navegue at? `[+ Install New MCP]` com as setas ??
2. Pressione Enter
3. Digite o nome do pacote:
   - Com npx: `npx @pinkpixel/mcpollinations`
   - Sem npx: `@pinkpixel/mcpollinations`
4. Pressione Enter para instalar

O sistema vai:
- Baixar e iniciar o MCP via npx
- Descobrir todas as tools dispon?veis
- Registrar as tools para a LLM usar
- Salvar o MCP para iniciar automaticamente

### 3. Ver MCPs Instalados

A tela `/mcp` mostra:
- Nome do pacote
- Status (ACTIVE/STOPPED)
- Quantidade de tools
- Informa??es do servidor (nome e vers?o)

### 4. Desinstalar um MCP

1. Selecione o MCP com as setas ??
2. Pressione Enter
3. O MCP ser? removido

### 5. Usar Tools de MCPs

Ap?s instalar um MCP, suas tools ficam dispon?veis automaticamente para a LLM. Basta fazer uma solicita??o natural:

**Exemplo com @pinkpixel/mcpollinations:**

```
Usu?rio: Gere uma imagem de um gato em estilo cartoon

LLM vai usar a tool:
- mcp_pinkpixel_mcpollinations_generateImage
- prompt: "cartoon cat"
- Retorna a imagem gerada
```

## MCPs Recomendados

### @pinkpixel/mcpollinations
**Tools: 9**
- Gera??o de imagens (text-to-image)
- Edi??o de imagens
- Gera??o de ?udio (text-to-speech)
- Chat de texto

**Instala??o:**
```
@pinkpixel/mcpollinations
```

### Outros MCPs Dispon?veis
Voc? pode instalar qualquer MCP compat?vel com o protocolo MCP 2024-11-05.

## Arquitetura T?cnica

### Comunica??o JSON-RPC

O sistema usa JSON-RPC 2.0 para comunicar com servidores MCP:

1. **Initialize**: Estabelece conex?o e troca capabilities
2. **tools/list**: Descobre tools dispon?veis
3. **tools/call**: Executa uma tool espec?fica

### Fluxo de Instala??o

```
1. Usu?rio instala MCP
   ?
2. mcpManager.installMCP(packageName)
   ?
3. mcpClient.startMCPServer(packageName)
   ?
4. Spawn: npx -y <package>
   ?
5. JSON-RPC: initialize + tools/list
   ?
6. Converter tools MCP ? OpenAI format
   ?
7. Registrar em getAllToolDefinitions()
   ?
8. LLM pode usar as tools
```

### Persist?ncia

MCPs instalados s?o salvos em:
```
~/.flui/mcp-config.json
```

Ao iniciar o flui, todos os MCPs salvos s?o carregados automaticamente.

### Registro de Tools

As tools MCP s?o convertidas para o formato OpenAI Function Calling:

```typescript
// MCP Tool
{
  name: "generateImage",
  description: "Generate an image from text",
  inputSchema: {
    type: "object",
    properties: {
      prompt: { type: "string" }
    }
  }
}

// Convertida para:
{
  type: "function",
  function: {
    name: "mcp_pinkpixel_mcpollinations_generateImage",
    description: "[MCP: @pinkpixel/mcpollinations] Generate an image from text",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string" }
      }
    }
  }
}
```

## Desenvolvimento

### Criar um Novo MCP

Para criar seu pr?prio MCP:

1. Instale o SDK:
```bash
npm install @modelcontextprotocol/sdk
```

2. Implemente o servidor:
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server({
  name: 'meu-mcp',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

server.setRequestHandler('tools/list', async () => {
  return {
    tools: [{
      name: 'minha_tool',
      description: 'Faz algo incr?vel',
      inputSchema: {
        type: 'object',
        properties: {
          input: { type: 'string' }
        }
      }
    }]
  };
});

server.setRequestHandler('tools/call', async (request) => {
  // Execute a tool
  return {
    content: [{
      type: 'text',
      text: 'Resultado'
    }]
  };
});

server.connect(new StdioServerTransport());
```

3. Publique no npm
4. Instale no flui com `/mcp`

### Debug

Para debugar a comunica??o MCP:
```bash
node test-mcp-simple.mjs
```

## Limita??es

- MCPs devem usar stdio para comunica??o
- Protocolo: MCP 2024-11-05
- Tools com resultados muito grandes (>5000 chars) s?o truncadas

## Troubleshooting

### MCP n?o inicia
- Verifique se o pacote existe no npm
- Teste manualmente: `npx -y <package>`

### Tools n?o aparecem
- Verifique se o MCP est? ACTIVE em `/mcp`
- Reinicie o flui

### Erro ao chamar tool
- Verifique os par?metros necess?rios
- Consulte a descri??o da tool em `/tools`

## Links ?teis

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCPs Dispon?veis](https://github.com/modelcontextprotocol/servers)
