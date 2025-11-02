# ?? Relat?rio: Placeholders de Emoji (?? e ?)

Este documento lista todos os arquivos que cont?m "??" ou "?" onde provavelmente deveriam ser emojis.

---

## ?? Resumo

- **Total de arquivos com "??":** 163 arquivos
- **Total de arquivos com "?":** 210 arquivos  
- **Arquivos cr?ticos (c?digo):** ~30 arquivos TypeScript/TSX
- **Arquivos de documenta??o:** ~130 arquivos MD

---

## ?? Arquivos Cr?ticos (C?digo Fonte)

### 1. **youtube-cli/prompts/ui-messages.json** ?? CR?TICO
**Linhas com "??":** 4, 5, 12, 21, 54, 55, 70-82, 85-87, 89
```json
"icon": "??",
"template": "{{icon}} Starting automation: {{name}}\n?? {{description}}"
```

### 2. **youtube-cli/source/automation/step-handlers/log-handler.ts**
**Linhas:** 46, 47, 50, 52
```typescript
info: '?? ',
warn: '?? ',
debug: '??',
return emojis[level] || '?? ';
```

### 3. **youtube-cli/source/components/AutomationSelector.tsx**
**Linhas:** 50, 54
```tsx
?? Available Automations
{apiConnected ? '??' : '??'} API
```

### 4. **youtube-cli/source/context-manager.ts**
**Linha:** 208
```typescript
const icon = node.type === 'folder' ? '??' : '??';
```

### 5. **youtube-cli/source/tools/read-folder.ts**
**Linha:** 25
```typescript
return `${stats.isDirectory() ? '??' : '??'} ${item}`;
```

### 6. **youtube-cli/source/webhook-trigger-handler.ts**
**Linha:** 57
```typescript
let message = `?? **Webhook Created Successfully**\\n\\n`;
```

### 7. **youtube-cli/source/automation/utils/variable-resolver.ts**
**Linha:** 17
```typescript
console.warn(`??  Error resolving ${match}:`, error);
```

### 8. **youtube-cli/source/automation/step-handlers/variable-handler.ts**
**Linha:** 25
```typescript
console.log(`?? Variable set: ${step.variableName} = ${JSON.stringify(resolvedValue)}`);
```

### 9. **youtube-cli/source/automation/step-handlers/llm-handler.ts**
**Linha:** 28
```typescript
console.log(`?? LLM processing...`);
```

### 10. **youtube-cli/source/prompts/prompt-loader.ts**
**Linhas:** 116, 134, 145, 175
```typescript
return messages.tool_descriptions[key] || `?? Executing: ${key}`;
return description || `?? Executing: ${toolName}`;
return `?? ${toolName}`;
const authInfo = requireAuth ? `?? Auth: Bearer ${apiKey}` : `?? Auth: Not required`;
```

### 11. **youtube-cli/source/automation/dry-run-manager.ts**
**Linhas:** 309, 324, 340
```typescript
lines.push('??  WARNINGS:');
lines.push('?? STEPS:');
lines.push('?? VARIABLES:');
```

### 12. **youtube-cli/source/llm-automation-coordinator.ts**
**Linha:** 137
```typescript
onProgress(`??  Executing: ${toolName}`);
```

### 13. **youtube-cli/source/automation/automation-manager.ts**
**Linhas:** 55, 78, 79
```typescript
console.log('?? Reloading automations...');
console.log(`?? Executing: ${automation.metadata.name}`);
console.log(`?? ${automation.metadata.description}`);
```

### 14. **youtube-cli/source/app.tsx**
**Linhas:** 132, 198, 310
```tsx
content: `?? Executing automation: ${automation.metadata.name}...\n${automation.metadata.description}`
content: `?? Setting up webhook for: ${automation.metadata.name}`
```

### 15. **youtube-cli/source/automation/automation-loader.ts**
**Linha:** 91
```typescript
console.log(`?? Creating automations directory: ${this.automationsDir}`);
```

### 16. **youtube-cli/source/errors/error-types.ts**
**Linhas:** 212, 228, 232, 236, 240
```typescript
return `?? Operation timed out...`;
return `?? Authentication failed...`;
return `?? Service temporarily unavailable...`;
return `?? Request too large...`;
return `?? Network error...`;
```

### 17. **youtube-cli/source/automation/automation-executor.ts**
**Linha:** 157
```typescript
console.log(`?? Step ${step.id} failed, retrying... (${attempt + 1}/${maxRetries})`);
```

### 18. **youtube-cli/source/components/KanbanBox.tsx**
**Linha:** 17
```tsx
<Text bold color="#A78BFA">?? KANBAN BOARD</Text>
```

### 19. **youtube-cli/source/components/CommandSuggestions.tsx**
**Linha:** 44
```tsx
<Text color="gray" dimColor>Use setas ?? e Enter para selecionar | ESC para cancelar</Text>
```

### 20. **youtube-cli/source/components/ConfigScreen.tsx**
**Linha:** 43
```tsx
<Text bold color="#A78BFA">??  SCRAPING CONFIGURATION</Text>
```

### 21. **youtube-cli/source/components/NewAuthScreen.tsx**
**Linhas:** 60, 152, 157, 158
```tsx
<Text bold color="#A78BFA">?? CUSTOM ENDPOINT</Text>
<Text bold color="#A78BFA">?? LLM AUTHENTICATION</Text>
{ label: '?? Qwen OAuth (2000 req/day FREE)', value: 'qwen' },
{ label: '?? Custom Endpoint', value: 'custom' },
```

### 22. **youtube-cli/source/components/MCPScreen.tsx**
**Linha:** 178
```tsx
Use ?? to navigate | Enter to select | ESC to close
```

### 23. **youtube-cli/source/components/QwenOAuthScreen.tsx**
**Linha:** 40
```typescript
console.log('?? Starting fresh OAuth login...');
```

### 24. **youtube-cli/source/components/ToolsScreen.tsx**
**Linha:** 33
```tsx
<Text color={MONOKAI.blue} bold>???  AVAILABLE TOOLS ({ALL_TOOL_DEFINITIONS.length})</Text>
```

---

## ?? Arquivos de Documenta??o (Markdown)

### Arquivos Principais com Muitas Ocorr?ncias:

1. **SISTEMA_FLUI_COMPLETO.md** - ~50 ocorr?ncias
2. **README_WEBHOOK_SYSTEM.md** - ~30 ocorr?ncias  
3. **PLANO_IMPLEMENTACAO_AUTOMACAO.md** - ~40 ocorr?ncias
4. **RESUMO_EXECUTIVO_AUTOMACAO.md** - ~25 ocorr?ncias
5. **README_LEVANTAMENTO.md** - ~30 ocorr?ncias
6. **QUICK_START.md** - ~20 ocorr?ncias
7. **LEVANTAMENTO_SISTEMA_AUTOMACAO_GATILHOS.md** - ~30 ocorr?ncias

### Padr?es Comuns em Documenta??o:

- T?tulos: `## ?? In?cio R?pido`
- Mensagens: `?? Webhook Created Successfully`
- Status: `Status: ?? PRODU??O`
- ?cones em boxes: `? ?? Available Automations`
- Se??es: `### ?? Contexto Preservado`

---

## ?? Arquivos de Teste

### Arquivos com "??" em testes:

1. **youtube-cli/tests/test-4-ui-feedback.mjs**
   - Linha 29: `const expectedIcons = ['??', '??', '?', '??', '??', '??', '??', '??'];`
   - Linhas 46, 64: Verifica??es de emojis

2. **youtube-cli/tests/test-5-stress-multiple-tools.mjs**
   - Linhas 47, 55, 63, 71: Verifica??es de emojis em sa?das

3. **youtube-cli/tests/test-2-tool-execution-retry.mjs**
   - Linha 44: Verifica??o de emoji de retry

4. **youtube-cli/tests/test-3-conversation-context.mjs**
   - Linha 70: Verifica??o de emoji

---

## ?? Lista Completa de Arquivos por Categoria

### C?digo Fonte (TypeScript/TSX) - 24 arquivos
```
youtube-cli/prompts/ui-messages.json
youtube-cli/source/automation/step-handlers/log-handler.ts
youtube-cli/source/components/AutomationSelector.tsx
youtube-cli/source/context-manager.ts
youtube-cli/source/tools/read-folder.ts
youtube-cli/source/webhook-trigger-handler.ts
youtube-cli/source/automation/utils/variable-resolver.ts
youtube-cli/source/automation/step-handlers/variable-handler.ts
youtube-cli/source/automation/step-handlers/llm-handler.ts
youtube-cli/source/prompts/prompt-loader.ts
youtube-cli/source/automation/dry-run-manager.ts
youtube-cli/source/llm-automation-coordinator.ts
youtube-cli/source/automation/automation-manager.ts
youtube-cli/source/app.tsx
youtube-cli/source/automation/automation-loader.ts
youtube-cli/source/errors/error-types.ts
youtube-cli/source/automation/automation-executor.ts
youtube-cli/source/components/KanbanBox.tsx
youtube-cli/source/components/CommandSuggestions.tsx
youtube-cli/source/components/ConfigScreen.tsx
youtube-cli/source/components/NewAuthScreen.tsx
youtube-cli/source/components/MCPScreen.tsx
youtube-cli/source/components/QwenOAuthScreen.tsx
youtube-cli/source/components/ToolsScreen.tsx
```

### Testes - 4 arquivos
```
youtube-cli/tests/test-2-tool-execution-retry.mjs
youtube-cli/tests/test-3-conversation-context.mjs
youtube-cli/tests/test-4-ui-feedback.mjs
youtube-cli/tests/test-5-stress-multiple-tools.mjs
```

### Documenta??o - ~130 arquivos MD
(Lista completa dispon?vel na busca, principais listados acima)

### Scripts Shell - 3 arquivos
```
youtube-cli/test-webhook-flow.sh
youtube-cli/test-webhook-system.sh
youtube-cli/test-complete-system.sh
```

---

## ?? Emojis Prov?veis por Contexto

### Automa??es e Processamento:
- `??` ? ?? (starting/processing)
- `??` ? ? (success/complete)
- `??` ? ?? (warning)
- `??` ? ? (error)
- `??` ? ?? (searching/analyzing)

### UI e Navega??o:
- `??` ? ???? (setas de navega??o)
- `??` ? ?? (folder)
- `??` ? ?? (file)
- `??` ? ?? (API connection)
- `??` ? ? (API connected)
- `??` ? ? (API disconnected)

### Ferramentas:
- `??` ? ?? (writing/editing)
- `??` ? ?? (reading)
- `??` ? ?? (tools)
- `??` ? ?? (saving)

### Status e Mensagens:
- `??` ? ?? (starting)
- `??` ? ?? (configuring)
- `??` ? ?? (auth)
- `??` ? ?? (network)

---

## ?? Notas Importantes

1. **Arquivos de teste** podem precisar de aten??o especial - alguns "??" podem ser intencionais para verificar placeholder
2. **Documenta??o** pode ter muitos "??" que s?o placeholders de exemplo
3. **ui-messages.json** ? cr?tico - cont?m templates de mensagens usados em toda a aplica??o
4. Alguns "?" podem ser interroga??es reais em perguntas, n?o placeholders

---

## ? Pr?ximos Passos

1. Aguardar aprova??o do usu?rio
2. Para cada arquivo aprovado, fazer replace apropriado
3. Validar que emojis aparecem corretamente ap?s substitui??o
4. Atualizar testes se necess?rio

---

**Total de arquivos para revis?o:** ~160 arquivos
**Prioridade ALTA:** 24 arquivos de c?digo fonte
**Prioridade M?DIA:** ~130 arquivos de documenta??o
**Prioridade BAIXA:** 4 arquivos de teste (verificar se s?o intencionais)
