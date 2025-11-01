# ?? TESTE MANUAL - Identifica??o de Duplica??o

## Como Executar

### 1. Build com Logs
```bash
cd /workspace/youtube-cli
npx tsc
```

### 2. Executar CLI com Debug
```bash
DEBUG_MESSAGES=true node dist/cli.js 2> debug.log
```

### 3. Enviar uma Mensagem
- Digite: `Ol? teste`
- Pressione Enter

### 4. Observar
- **Na tela**: Quantas vezes "Ol? teste" aparece?
- **No log**: Verificar `debug.log` para ver quantas vezes setMessages foi chamado

### 5. Analisar debug.log
```bash
cat debug.log | grep "handleSubmit: Adding user message"
cat debug.log | grep "setMessages (user)"
cat debug.log | grep "Messages array changed"
```

## O que procurar

### Indicadores de Duplica??o

1. **setMessages chamado 2+ vezes para a mesma mensagem**
   ```
   [DEBUG] handleSubmit: Adding user message with ID: user-123
   [DEBUG] handleSubmit: Adding user message with ID: user-456  ? PROBLEMA!
   ```

2. **Array de messages tem a mesma mensagem 2+ vezes**
   ```
   [DEBUG] Messages array changed. Length: 2
   [DEBUG]   [0] user: Ol? teste | ID: user-123
   [DEBUG]   [1] user: Ol? teste | ID: user-456  ? DUPLICA??O!
   ```

3. **Na tela visual**: Mensagem aparece 2+ vezes

## Teste Simplificado

Se quiser teste mais simples:
```bash
cd /workspace/youtube-cli
node dist/cli.js
```

Digite `Ol?` e veja se aparece 1 ou mais vezes.
