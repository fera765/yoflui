# ?? Guia R?pido: Novo Sistema de Input

## ? TL;DR

Implementamos um sistema de input profissional baseado no **qwen-code**, mantendo o uso do **Ink**, mas com funcionalidades muito mais avan?adas.

## ?? O Que Mudou

### Antes (ink-text-input):
```tsx
import TextInput from 'ink-text-input';

<TextInput value={value} onChange={onChange} onSubmit={onSubmit} />
```
? Sem multiline  
? Sem undo/redo  
? Sem navega??o avan?ada  
? Bugs com Unicode  

### Agora (Sistema Novo):
```tsx
import { ChatInput, KeypressProvider } from './input/index.js';

<KeypressProvider>
  <ChatInput 
    value={value} 
    onChange={onChange} 
    onSubmit={onSubmit}
    disabled={busy}
    preventSubmit={() => selectorsOpen}
  />
</KeypressProvider>
```
? Multiline completo  
? Undo/redo  
? Navega??o palavra por palavra  
? Unicode correto  
? Previne submit indesejado  

## ?? Comandos de Teclado

### Navega??o B?sica
- `?/?` - Caractere por caractere
- `?/?` - Linha por linha (multiline)
- `Home` ou `Ctrl+A` - In?cio da linha
- `End` ou `Ctrl+E` - Fim da linha

### Navega??o Avan?ada
- `Ctrl+?` - Palavra anterior
- `Ctrl+?` - Pr?xima palavra

### Edi??o
- `Backspace` - Apagar anterior
- `Delete` - Apagar seguinte
- `Ctrl+W` - Apagar palavra anterior
- `Ctrl+K` - Apagar at? fim da linha
- `Ctrl+U` - Apagar at? in?cio da linha
- `Ctrl+C` - Limpar todo input

### Multiline
- `Enter` - Submeter
- `Shift+Enter` - Nova linha
- `\` + `Enter` - Nova linha

### Hist?rico
- `Ctrl+Z` - Desfazer (undo)
- `Ctrl+Shift+Z` - Refazer (redo)

## ?? Bugs Corrigidos

### 1. Enter com Seletores Abertos ?
**Antes:** Enter submetia "@" ou "/" sozinho quando seletores estavam abertos.

**Agora:** `preventSubmit` callback verifica se deve permitir submit.

### 2. Unicode/Emoji ?
**Antes:** Cursor ficava em posi??o errada com emojis.

**Agora:** Code-point aware, funciona perfeitamente com qualquer caractere.

### 3. Ctrl+C ?
**Antes:** Sempre matava o app.

**Agora:** Limpa o input (s? mata se input vazio).

## ?? Exemplos de Uso

### Uso B?sico:
```tsx
import { ChatInput } from './input/index.js';

function MyComponent() {
  const [input, setInput] = useState('');
  
  return (
    <ChatInput
      value={input}
      onChange={setInput}
      onSubmit={() => console.log('Submit:', input)}
      disabled={false}
    />
  );
}
```

### Com Prevent Submit:
```tsx
<ChatInput
  value={input}
  onChange={setInput}
  onSubmit={handleSubmit}
  disabled={busy}
  preventSubmit={() => {
    // N?o submeter se:
    return showAutomations || 
           showCommands || 
           input === '@' || 
           input === '/';
  }}
/>
```

### Envolvido em KeypressProvider:
```tsx
import { KeypressProvider, ChatInput } from './input/index.js';

export default function App() {
  return (
    <KeypressProvider>
      <Box flexDirection="column">
        {/* Seu conte?do */}
        <ChatInput {...props} />
      </Box>
    </KeypressProvider>
  );
}
```

## ?? Estrutura de Arquivos

```
source/input/
??? context/KeypressContext.tsx   # Captura de eventos
??? hooks/useKeypress.ts           # Hook para eventos
??? components/
?   ??? TextInput.tsx              # Input avan?ado
?   ??? ChatInput.tsx              # Wrapper chat
??? state/text-buffer.ts           # State management
??? config/keyMatchers.ts          # Key bindings
??? utils/textUtils.ts             # Utilit?rios Unicode
??? index.ts                       # Exports
```

## ?? Como Testar

1. **Build:**
   ```bash
   cd /workspace/youtube-cli
   npm run build
   ```

2. **Run:**
   ```bash
   npm start
   ```

3. **Teste comandos:**
   - Digite texto normal ?
   - Pressione `Ctrl+Z` para undo ?
   - Pressione `Ctrl+K` para kill line ?
   - Digite emoji ?? e mova cursor ?
   - Abra selector (@) e pressione Enter (n?o deve submeter) ?

## ?? Customiza??o

### Mudar Key Bindings:
```tsx
import { createKeyMatchers, Command } from './input/index.js';

const customBindings = {
  [Command.SUBMIT]: [
    { key: 'return', meta: true } // Cmd+Enter
  ],
  [Command.CLEAR_INPUT]: [
    { key: 'escape' } // ESC para limpar
  ],
};

const myMatchers = createKeyMatchers(customBindings);
```

### Adicionar Novo Comando:
```tsx
// 1. Definir em keyMatchers.ts
export enum Command {
  MY_COMMAND = 'MY_COMMAND',
}

// 2. Adicionar binding
[Command.MY_COMMAND]: [
  { key: 'x', ctrl: true, shift: true }
],

// 3. Handle em TextInput.tsx
if (keyMatchers[Command.MY_COMMAND](key)) {
  // Sua l?gica aqui
  return;
}
```

## ?? Documenta??o Completa

- **An?lise do qwen-code:** `/workspace/QWEN_CODE_INPUT_ANALYSIS.md`
- **Sistema novo completo:** `/workspace/NEW_INPUT_SYSTEM_COMPLETE.md`
- **Resumo implementa??o:** `/workspace/RESUMO_IMPLEMENTACAO_INPUT_QWEN.md`
- **Este guia:** `/workspace/GUIA_RAPIDO_NOVO_INPUT.md`

## ? FAQ

**Q: Preciso mudar c?digo existente?**
A: N?o! A API ? compat?vel. S? envolva com `<KeypressProvider>`.

**Q: Posso desabilitar multiline?**
A: Sim, `<TextInput multiline={false} />`. ChatInput j? ? single-line por padr?o.

**Q: Como debug?**
A: Adicione `console.log` em `KeypressContext` ou `text-buffer`.

**Q: Posso usar sem Ink?**
A: N?o, o sistema ? feito para Ink. Mas voc? pode adaptar.

**Q: Funciona com Windows?**
A: Sim! Testado em Linux. Windows deve funcionar (usa Node.js readline).

## ?? Status

? **Implementado**  
? **Testado**  
? **Documentado**  
? **Pronto para Produ??o**

## ?? Quick Start

```bash
# 1. Build
cd /workspace/youtube-cli
npm run build

# 2. Test
./test-new-input.sh

# 3. Run
npm start

# 4. Enjoy! ??
```

---

**Vers?o:** 1.0.0  
**Data:** 2025-11-03  
**Status:** ? COMPLETO
