# Como Usar o Flui Localmente

## ?? Instala??o e Execu??o

### 1. Clone o Reposit?rio

```bash
git clone https://github.com/fera765/yoflui.git
cd yoflui/youtube-cli
```

### 2. Instale as Depend?ncias

```bash
npm install
```

**Depend?ncias principais**:
- `ink` - React para terminal
- `openai` - Cliente OpenAI
- `chalk` - Cores no terminal
- `string-width` - Medi??o Unicode
- E outras...

### 3. Compile o TypeScript

```bash
npm run build
```

Ou use o modo desenvolvimento (recompila automaticamente):

```bash
npx tsc --watch
```

### 4. Execute o Flui

```bash
npm run dev
```

**Ou diretamente**:

```bash
npx tsx source/cli.tsx
```

---

## ?? Configura??o Inicial

### Primeira Execu??o

Quando executar `npm run dev` pela primeira vez:

1. **Tela de Autentica??o** aparecer?
2. Escolha uma op??o:
   - **Qwen OAuth** (recomendado) - autentica??o via browser
   - **Custom** - use sua pr?pria API key

### Autentica??o Qwen OAuth

```bash
npm run dev
# Selecione "Qwen OAuth"
# Browser abrir? automaticamente
# Fa?a login no portal.qwen.ai
# Volte para o terminal - autentica??o completa!
```

**Credenciais salvas em**: `qwen-credentials.json` (no diret?rio do projeto)

### Custom API Key

```bash
npm run dev
# Selecione "Custom"
# Digite o endpoint: https://api.openai.com/v1
# Digite sua API key
# Digite o modelo: gpt-4
```

**Configura??o salva em**: `~/.flui/config.json`

---

## ?? Comandos Dispon?veis

Digite `/` para ver todos os comandos:

```
/llm      - Configurar autentica??o LLM
/config   - Ajustar configura??es
/tools    - Ver ferramentas dispon?veis
/mcp      - Gerenciar MCPs (Model Context Protocol)
/exit     - Sair da aplica??o
```

### Exemplo de Uso

```bash
# Inicie o flui
npm run dev

# Digite uma mensagem
> Ol?, como voc? est??

# Use ferramentas
> Crie um arquivo hello.js com uma fun??o que diz ol?

# Gerencie MCPs
/mcp
# Instale @pinkpixel/mcpollinations
# Use: "gere uma imagem de um gato"

# Configure
/config
# Ajuste maxVideos, maxComments, etc.
```

---

## ??? Scripts NPM

```json
{
  "scripts": {
    "build": "npx tsc",           // Compila TypeScript
    "start": "node dist/cli.js",   // Executa vers?o compilada
    "dev": "npx tsx source/cli.tsx", // Modo desenvolvimento
    "test": "npx tsx test-autonomous.ts"
  }
}
```

### Comandos

```bash
# Desenvolvimento (recomendado)
npm run dev

# Compilar
npm run build

# Executar compilado
npm run start

# Testar
npm run test
```

---

## ?? Estrutura de Pastas

```
youtube-cli/
??? source/               # C?digo TypeScript
?   ??? app.tsx          # Aplica??o principal
?   ??? cli.tsx          # Entry point
?   ??? components/      # Componentes Ink
?   ??? tools/           # Ferramentas para LLM
?   ??? mcp/             # Sistema MCP
??? dist/                # C?digo compilado (ap?s build)
??? qwen-credentials.json # Credenciais OAuth (se usar Qwen)
??? package.json         # Depend?ncias
??? tsconfig.json        # Config TypeScript
```

---

## ?? Configura??es

### Config Global

**Localiza??o**: `~/.flui/config.json`

```json
{
  "endpoint": "https://chat.qwen.ai/api/v1",
  "apiKey": "your-api-key",
  "model": "qwen3-coder-plus",
  "maxVideos": 5,
  "maxCommentsPerVideo": 50
}
```

### Credenciais OAuth

**Localiza??o**: `./qwen-credentials.json` (diret?rio do projeto)

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "expires_in": 21600,
  "expiry_date": 1762063521272,
  "resource_url": "portal.qwen.ai"
}
```

### Contexto por Pasta

**Localiza??o**: `./.flui/context.json` (em cada pasta de trabalho)

```json
{
  "folderStructure": ["src/", "dist/"],
  "conversationHistory": [],
  "userInput": ""
}
```

---

## ?? Features Principais

### 1. **Chat com IA**

```bash
npm run dev
> Explique o que ? React
# IA responde naturalmente
```

### 2. **Ferramentas (Tools)**

A IA tem acesso a:
- `read_file` - Ler arquivos
- `write_file` - Criar/editar arquivos
- `edit_file` - Modificar arquivos com diff
- `search_text` - Buscar em arquivos
- `find_files` - Procurar arquivos
- `read_folder` - Listar diret?rios
- `execute_shell` - Executar comandos
- `update_kanban` - Gerenciar tarefas
- `web_fetch` - Buscar conte?do web
- `memory_*` - Sistema de mem?ria

### 3. **Sistema Kanban**

A IA cria e gerencia tarefas automaticamente:

```bash
> Crie uma API REST com Express
# IA cria Kanban com tasks:
# [ ] Setup inicial
# [>] Instalar depend?ncias
# [V] Criar server.js
```

### 4. **MCP (Model Context Protocol)**

Instale ferramentas externas:

```bash
/mcp
# Digite: @pinkpixel/mcpollinations
# Instala servidor MCP
# Ferramentas ficam dispon?veis para IA
```

### 5. **Contexto Autom?tico**

Cada pasta tem seu pr?prio contexto (`.flui/`):
- Estrutura de pastas registrada
- Hist?rico de conversas
- Persist?ncia autom?tica

---

## ?? Troubleshooting

### Erro: "Cannot find module"

```bash
# Reinstale depend?ncias
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Erro: "Token expired"

```bash
# Re-autentique
npm run dev
/llm
# Fa?a login novamente
```

### Input com bugs

**VERS?O ATUAL (fb0bceb)**:
? Usa `ink-text-input` padr?o
? Funciona corretamente
? Sem bugs de multiplica??o

### MCP n?o funciona

```bash
# Verifique instala??o
/mcp
# Lista deve mostrar MCPs instalados

# Reinstale se necess?rio
# Desinstale e instale novamente
```

---

## ?? Exemplos de Uso

### Exemplo 1: Criar Projeto

```bash
npm run dev
> Crie um projeto Node.js com Express e uma rota /hello
# IA cria estrutura, instala deps, testa
```

### Exemplo 2: Analisar C?digo

```bash
npm run dev
> Leia o arquivo app.tsx e explique o que faz
# IA l? e explica
```

### Exemplo 3: Refatorar

```bash
npm run dev
> Refatore o c?digo em utils.ts para usar async/await
# IA edita arquivo com diff visual
```

### Exemplo 4: Gerar Imagem (MCP)

```bash
npm run dev
/mcp
# Instale: @pinkpixel/mcpollinations
> Gere uma imagem de um cachorro
# MCP gera e retorna: [Image generated: X KB]
```

---

## ?? Requisitos do Sistema

### M?nimos

- **Node.js**: >= 20.0.0
- **npm**: >= 8.0.0
- **Terminal**: Qualquer (funciona melhor em terminals modernos)
- **SO**: Linux, macOS, Windows

### Recomendados

- **Terminal**: iTerm2, Alacritty, Windows Terminal
- **Fonte**: Com suporte a Unicode
- **Largura**: >= 80 colunas
- **Altura**: >= 24 linhas

---

## ?? Atualiza??o

```bash
cd yoflui/youtube-cli
git pull origin cursor/simple-greeting-task-abbe
npm install
npm run build
npm run dev
```

---

## ?? Documenta??o Adicional

- `COMPLETE_GEMINI_IMPLEMENTATION.md` - Implementa??es Gemini CLI
- `LARGE_OUTPUT_FIX.md` - Fix para outputs grandes
- `MCP_GUIDE.md` - Guia completo de MCPs
- `TROUBLESHOOTING_MCP.md` - Troubleshooting MCPs
- `README.md` - Overview geral

---

## ? Verifica??o de Instala??o

Teste se est? tudo funcionando:

```bash
# 1. Compilar
npm run build
# Deve compilar sem erros

# 2. Executar
npm run dev
# Deve abrir interface

# 3. Testar input
# Digite "oi" + Enter
# Deve enviar mensagem

# 4. Testar comandos
# Digite "/" 
# Deve mostrar lista de comandos

# 5. Testar MCP
/mcp
# Deve abrir tela de MCPs
```

Se todos passarem: ? **Instala??o completa!**

---

## ?? Suporte

### Issues

https://github.com/fera765/yoflui/issues

### Logs

Logs ficam em:
- Terminal (sa?da padr?o)
- `.flui/context.json` (hist?rico de conversas)

---

## ?? Pronto para Usar!

```bash
cd yoflui/youtube-cli
npm run dev
```

**Divirta-se!** ??
