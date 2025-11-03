# An?lise Completa do Sistema de Input do Qwen-Code

## ?? Objetivo
Documentar e replicar a arquitetura de input do qwen-code no nosso projeto, mantendo o uso do Ink mas melhorando significativamente o funcionamento do input.

## ?? Arquitetura do Qwen-Code

### 1. **KeypressContext** (`KeypressContext.tsx`)
**Responsabilidade:** Captura e broadcast de eventos de teclado em baixo n?vel

**Caracter?sticas:**
- **Padr?o Observer:** M?ltiplos subscribers podem se inscrever
- **Raw Mode:** Usa `stdin` em modo raw para capturar todos os eventos
- **Kitty Protocol:** Suporte para protocolo Kitty (CSI-u sequences)
- **Paste Detection:** Detecta cola de texto (bracketed paste mode)
- **Drag & Drop:** Detecta quando arquivo ? arrastado para o terminal
- **Backslash+Enter:** Detecta Shift+Enter via backslash seguido de enter
- **Buffer de Sequ?ncias:** Gerencia sequ?ncias Kitty incompletas

**Interface Key:**
```typescript
interface Key {
  name: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  paste: boolean;
  sequence: string;
  kittyProtocol?: boolean;
}
```

**Fluxo:**
1. `stdin.on('data')` ? captura dados brutos
2. `readline.emitKeypressEvents()` ? converte para eventos de tecla
3. `handleKeypress()` ? processa e transforma
4. `broadcast()` ? notifica todos os subscribers

### 2. **useKeypress Hook** (`useKeypress.ts`)
**Responsabilidade:** Hook simplificado para consumir eventos de teclado

```typescript
export function useKeypress(
  onKeypress: KeypressHandler,
  { isActive }: { isActive: boolean }
)
```

**Caracter?sticas:**
- Subscribe/unsubscribe autom?tico via useEffect
- Controle de ativo/inativo
- Cleanup autom?tico

### 3. **text-buffer** (`text-buffer.ts`)
**Responsabilidade:** Gerenciamento completo do estado do buffer de texto

**Pattern:** Reducer com estado imut?vel

**Estado:**
```typescript
interface TextBufferState {
  lines: string[];           // Linhas l?gicas
  cursorRow: number;         // Posi??o do cursor (linha)
  cursorCol: number;         // Posi??o do cursor (coluna)
  preferredCol: number | null; // Coluna preferida (navega??o vertical)
  undoStack: UndoHistoryEntry[];
  redoStack: UndoHistoryEntry[];
  clipboard: string | null;
  selectionAnchor: [number, number] | null;
  viewportWidth: number;
  viewportHeight: number;
  visualLayout: VisualLayout;  // Mapeamento l?gico ? visual
}
```

**Actions:** 40+ a??es diferentes
- `set_text`, `insert`, `backspace`, `delete`
- `move` (left/right/up/down/wordLeft/wordRight/home/end)
- `undo`, `redo`
- `kill_line_right`, `kill_line_left`
- `delete_word_left`, `delete_word_right`
- `replace_range`, `move_to_offset`
- Vim commands (20+ comandos)

**Visual Layout:**
- **Problema:** Linhas l?gicas longas precisam quebrar visualmente
- **Solu??o:** Sistema de mapeamento l?gico ? visual
- **Wrapping:** Word-wrap inteligente respeitando espa?os

```typescript
interface VisualLayout {
  visualLines: string[];
  logicalToVisualMap: Array<Array<[number, number]>>;
  visualToLogicalMap: Array<[number, number]>;
}
```

**Features:**
- ? Multiline support
- ? Word wrapping
- ? Undo/Redo stack (limite 100)
- ? Preferred column (navega??o vertical)
- ? Code point aware (Unicode correto)
- ? Vim mode completo
- ? External editor integration
- ? Drag & drop path insertion

### 4. **keyMatchers** (`keyMatchers.ts`)
**Responsabilidade:** Define comandos e seus bindings

**Pattern:** Data-driven matching

```typescript
enum Command {
  SUBMIT = 'SUBMIT',
  NEWLINE = 'NEWLINE',
  NAVIGATION_UP = 'NAVIGATION_UP',
  NAVIGATION_DOWN = 'NAVIGATION_DOWN',
  HOME = 'HOME',
  END = 'END',
  CLEAR_INPUT = 'CLEAR_INPUT',
  KILL_LINE_RIGHT = 'KILL_LINE_RIGHT',
  KILL_LINE_LEFT = 'KILL_LINE_LEFT',
  DELETE_WORD_BACKWARD = 'DELETE_WORD_BACKWARD',
  OPEN_EXTERNAL_EDITOR = 'OPEN_EXTERNAL_EDITOR',
  // ... 30+ comandos
}
```

**Configura??o:**
```typescript
interface KeyBinding {
  key?: string;
  sequence?: string;
  ctrl?: boolean;
  shift?: boolean;
  command?: boolean;
  paste?: boolean;
}

const defaultKeyBindings: KeyBindingConfig = {
  [Command.SUBMIT]: [{ key: 'return' }],
  [Command.NEWLINE]: [
    { key: 'return', shift: true },
    { key: 'return', meta: true }
  ],
  // ...
}
```

### 5. **TextInput Component** (`TextInput.tsx`)
**Responsabilidade:** Componente simples de input sem features extras

**Props:**
```typescript
interface TextInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  height?: number;           // >1 enables multiline
  isActive?: boolean;
  validationErrors?: string[];
  inputWidth?: number;
}
```

**Features:**
- Enter ? submit (ou \\+Enter para newline em multiline)
- Shift+Enter ? newline (em multiline)
- Ctrl+A/E ? Home/End
- Ctrl+K/U ? Kill line right/left
- Ctrl+W/Meta+Backspace ? Delete word left
- Ctrl+O ? Open external editor
- Visual cursor com chalk.inverse()
- Placeholder support
- Validation errors display

### 6. **InputPrompt Component** (`InputPrompt.tsx`)
**Responsabilidade:** Input avan?ado com completions, history, etc.

**Features Adicionais:**
- ? Command completion (slash commands, @paths)
- ? History navigation (Ctrl+P/N, Up/Down)
- ? Reverse search (Ctrl+R)
- ? Shell mode (! prefix)
- ? Ghost text (inline completions)
- ? Suggestions dropdown
- ? Clipboard image paste (Ctrl+V)
- ? Escape handling (double ESC to clear)
- ? Auto-submit prevention (paste protection)
- ? Syntax highlighting

**Integra??o:**
- `useTextBuffer()` ? gerencia o buffer
- `useKeypress()` ? captura teclas
- `useInputHistory()` ? navega??o de hist?rico
- `useCommandCompletion()` ? completions de comandos
- `useReverseSearchCompletion()` ? busca reversa

## ?? Compara??o com Nossa Implementa??o Atual

### ? Problema Atual (ink-text-input)
```tsx
// Muito simples, sem controle
<TextInput 
  value={value} 
  onChange={onChange} 
  onSubmit={onSubmit} 
/>
```

**Limita??es:**
- ? Sem multiline
- ? Sem hist?rico
- ? Sem completions
- ? Sem undo/redo
- ? Sem controle fino de teclado
- ? Sem suporte a paste
- ? Sem word wrapping
- ? Bug: Enter/Esc com seletores abertos

### ? Solu??o Qwen-Code

**Arquitetura em Camadas:**
```
???????????????????????????????
?   InputPrompt (features)    ?
???????????????????????????????
?    TextInput (b?sico)       ?
???????????????????????????????
?   useTextBuffer (state)     ?
???????????????????????????????
?  useKeypress (hook)         ?
???????????????????????????????
? KeypressContext (captura)   ?
???????????????????????????????
?    stdin (Node.js)          ?
???????????????????????????????
```

## ?? Checklist de Implementa??o

### Fase 1: Funda??o ?
- [x] KeypressContext + Provider
- [x] useKeypress hook
- [x] keyMatchers + Command enum

### Fase 2: Buffer Core ?
- [ ] TextBufferState + reducer
- [ ] Visual layout system
- [ ] Basic actions (insert, delete, move)
- [ ] Undo/redo

### Fase 3: TextInput Component ?
- [ ] Componente b?sico
- [ ] Multiline support
- [ ] Cursor rendering
- [ ] Placeholder

### Fase 4: Features Avan?adas ?
- [ ] Input history
- [ ] Command completions
- [ ] Paste protection
- [ ] External editor

### Fase 5: Integra??o ?
- [ ] Substituir ink-text-input
- [ ] Integrar com app.tsx
- [ ] Manter compatibilidade com seletores
- [ ] Testes

## ?? Decis?es de Design

### O que Manter do Qwen-Code:
1. ? Arquitetura em camadas
2. ? KeypressContext (captura robusta)
3. ? text-buffer reducer pattern
4. ? Visual layout system
5. ? keyMatchers data-driven
6. ? Paste detection
7. ? Unicode/code-point aware

### O que Adaptar:
1. ?? Remover Vim mode (n?o necess?rio)
2. ?? Simplificar external editor (opcional)
3. ?? Remover shell mode (n?o necess?rio)
4. ?? Adaptar completions para nossos comandos

### O que Adicionar:
1. ? Integra??o com AutomationSelector
2. ? Integra??o com CommandSuggestions
3. ? Prevenir submit quando seletores abertos
4. ? Visual feedback para @ e /

## ?? Pr?ximos Passos

1. **Criar estrutura de pastas:**
   ```
   source/input/
   ??? context/
   ?   ??? KeypressContext.tsx
   ??? hooks/
   ?   ??? useKeypress.ts
   ?   ??? useTextBuffer.ts
   ?   ??? useInputHistory.ts
   ??? components/
   ?   ??? TextInput.tsx
   ?   ??? ChatInput.tsx
   ??? state/
   ?   ??? text-buffer.ts
   ?   ??? text-buffer-reducer.ts
   ??? config/
       ??? keyMatchers.ts
   ```

2. **Implementar KeypressContext**
3. **Implementar text-buffer**
4. **Criar TextInput component**
5. **Integrar com ChatInput**
6. **Testes**

## ?? Notas T?cnicas

### Code Points vs Characters
Qwen-code usa code points para suportar Unicode corretamente:
```typescript
const toCodePoints = (str: string): string[] => [...str];
const cpLen = (str: string): number => [...str].length;
const cpSlice = (str: string, start: number, end?: number) => 
  [...str].slice(start, end).join('');
```

### Bracketed Paste Mode
Terminais modernos envolvem paste com:
```
ESC[200~ ... texto colado ... ESC[201~
```

### Kitty Protocol
Protocolo avan?ado para eventos de teclado:
```
ESC[<code>;mods>u
```

### Visual Wrapping
Sistema complexo que mapeia:
- Linhas l?gicas ? m?ltiplas linhas visuais
- Cursor l?gico ? cursor visual
- Word-wrap inteligente

## ?? Exemplo de Uso Final

```tsx
// app.tsx
<KeypressProvider kittyProtocolEnabled={true}>
  <ChatInput 
    value={input}
    onChange={setInput}
    onSubmit={submitMsg}
    disabled={busy}
    multiline={true}
    height={3}
    placeholder="Type your message..."
    preventSubmitWhen={() => showAutomations || cmds}
  />
</KeypressProvider>
```

## ?? M?tricas de Sucesso

- ? Multiline funcional
- ? Hist?rico de comandos
- ? Paste protection
- ? No mais bugs com seletores
- ? Undo/redo
- ? Word wrapping
- ? Unicode correto
