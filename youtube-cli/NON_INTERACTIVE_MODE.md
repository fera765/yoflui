# ?? Modo N?o-Interativo - Documenta??o

## ?? Vis?o Geral

O sistema agora suporta **dois modos de opera??o**:

1. **Modo Interativo** (padr?o) - CLI com React + Ink
2. **Modo N?o-Interativo** - Execu??o direta via comando com `--prompt`

## ?? Arquivo config.json

Criado automaticamente com as configura??es:

```json
{
  "endpoint": "http://localhost:4000/v1",
  "apiKey": "",
  "model": "gemini",
  "maxVideos": 7,
  "maxCommentsPerVideo": 10
}
```

### Como Funciona:
- **Modo N?o-Interativo**: Sempre carrega `config.json`
- **Modo Interativo**: Carrega `config.json` como padr?o (se existir)
- Se `config.json` n?o existir, usa valores padr?o

## ?? Modo N?o-Interativo

### Uso B?sico

```bash
# Formato
npm run start -- --prompt "Sua pergunta aqui"

# Exemplos
npm run start -- --prompt "Pesquise sobre emagrecimento"
npm run start -- --prompt "Quais s?o as dores de quem quer aprender programa??o?"
npm run start -- --prompt "O que as pessoas dizem sobre medita??o?"
```

### Fluxo de Execu??o

```
1. Carrega config.json
   ?? Exibe configura??es no console

2. Processa o prompt do usu?rio
   ?? [DEBUG] logs da LLM

3. Executa tool (se necess?rio)
   ?? ?? Tool Called: YouTube Search
   ?? Query: "..."
   ?? ? Tool Completed: X videos, Y comments

4. Retorna an?lise da AI
   ?? Exibe resultado formatado

5. Exit code 0 (sucesso) ou 1 (erro)
```

### Output Esperado

```
?????????????????????????????????????????????????????????
?        ?? AI YOUTUBE ANALYST - NON-INTERACTIVE       ?
?????????????????????????????????????????????????????????

?? Loaded configuration:
   Endpoint: http://localhost:4000/v1
   Model: gemini
   Max Videos: 7
   Max Comments/Video: 10

? User Prompt:
   "Pesquise sobre emagrecimento"

? Processing...

[DEBUG] LLM Response: {...}

?? Tool Called:
   Name: YouTube Search
   Query: "emagrecimento"

[DEBUG] Sending tool results to LLM...

? Tool Completed:
   Videos: 7
   Comments: 70

[DEBUG] Final response received: {...}

?????????????????????????????????????????????????????????
?                    ?? RESULTS                         ?
?????????????????????????????????????????????????????????

?? Data Collection:
   ? 7 videos analyzed
   ? 70 comments extracted

?? AI Analysis:

Baseado nos coment?rios analisados sobre emagrecimento:

**Principais Dores Identificadas:**

1. Falta de motiva??o e disciplina
   - Muitos comentam sobre desistir facilmente
   - Dificuldade em manter rotina de exerc?cios

2. Efeito sanfona
   - Perda de peso seguida de ganho r?pido
   - Frustra??o com resultados n?o-duradouros

3. Dietas restritivas
   - Dificuldade em seguir dietas muito r?gidas
   - Sentimento de priva??o e ansiedade

...

?????????????????????????????????????????????????????????
?                    ? COMPLETE                        ?
?????????????????????????????????????????????????????????
```

## ?? Debug Logs

O modo n?o-interativo mant?m os mesmos logs de debug:

```
[DEBUG] LLM Response: {
  hasToolCalls: true,
  toolCallsLength: 1,
  content: "..."
}

[DEBUG] Sending tool results to LLM...

[DEBUG] Final response received: {
  length: 2456
}
```

Isso permite identificar problemas mesmo em modo n?o-interativo.

## ?? Configura??o

### Modificar config.json

```json
{
  "endpoint": "http://localhost:4000/v1",  // Seu endpoint local
  "apiKey": "",                              // Deixar vazio se n?o precisar
  "model": "gemini",                         // Modelo com tool support
  "maxVideos": 5,                            // 1-20
  "maxCommentsPerVideo": 50                  // 10-500
}
```

### Reduzir Tempo de Execu??o

```json
{
  "maxVideos": 3,           // Apenas 3 v?deos
  "maxCommentsPerVideo": 20  // 20 coment?rios cada
}
```

**Total**: 3 ? 20 = 60 coment?rios (muito mais r?pido!)

## ?? Modo Interativo (CLI)

Continua funcionando normalmente:

```bash
# Modo interativo padr?o
npm run start

# Dentro da CLI:
# - Digite mensagens normalmente
# - /llm para configurar
# - /exit para sair
```

## ?? Como o Sistema Decide o Modo

```typescript
// cli.tsx (simplificado)
const args = process.argv.slice(2);
const promptIndex = args.indexOf('--prompt');

if (promptIndex !== -1 && args[promptIndex + 1]) {
  // MODO N?O-INTERATIVO
  const prompt = args[promptIndex + 1];
  runNonInteractive(prompt);
} else {
  // MODO INTERATIVO
  render(<App />);
}
```

## ?? Compara??o de Modos

| Caracter?stica | Interativo | N?o-Interativo |
|---------------|------------|----------------|
| **UI** | React + Ink | Console.log |
| **Config** | `/llm` command | `config.json` |
| **Uso** | `npm run start` | `npm run start -- --prompt "..."` |
| **Debug** | Logs no terminal | Logs no terminal |
| **Exit** | `/exit` ou Ctrl+C | Autom?tico ap?s resposta |
| **M?ltiplas Queries** | ? Sim | ? Uma por execu??o |

## ??? Scripts Dispon?veis

```bash
# Interativo
npm run start

# N?o-interativo
npm run start -- --prompt "Sua pergunta"

# Teste E2E
npm run test:e2e

# Build
npm run build
```

## ?? Casos de Uso

### Modo N?o-Interativo Ideal Para:
- Scripts automatizados
- Integra??o com outras ferramentas
- Execu??o em CI/CD
- An?lises program?ticas
- Batch processing

### Modo Interativo Ideal Para:
- Explora??o manual
- M?ltiplas perguntas em sequ?ncia
- Ajuste de configura??es em tempo real
- Desenvolvimento e testes

## ?? Troubleshooting

### Problema: "config.json not found"
**Solu??o**: O sistema usa valores padr?o. Crie o arquivo ou ignore o aviso.

### Problema: Tool n?o ? chamada
**Solu??o**: Verifique os logs `[DEBUG]` para identificar se a LLM detectou a necessidade da tool.

### Problema: Timeout / Processing infinito
**Solu??o**: Reduza `maxVideos` e `maxCommentsPerVideo` no `config.json`.

### Problema: Erro 400/500 da API
**Solu??o**: Verifique se o endpoint est? correto e se o modelo suporta tool calling.

## ? Exemplo Completo

```bash
# 1. Criar/editar config.json
echo '{
  "endpoint": "http://localhost:4000/v1",
  "apiKey": "",
  "model": "gemini",
  "maxVideos": 5,
  "maxCommentsPerVideo": 30
}' > config.json

# 2. Executar an?lise
npm run start -- --prompt "Pesquise sobre as dores de quem quer emagrecer"

# 3. Aguardar resultado
# ? 5 videos, 150 comments
# ?? An?lise detalhada com pain points
```

## ?? Pr?ximos Passos

1. Teste o modo n?o-interativo com seu endpoint local
2. Observe os logs de debug
3. Ajuste `config.json` conforme necess?rio
4. Integre em seus scripts/automa??es

---

**Status**: ? PRONTO PARA USO  
**Modos**: 2 (Interativo + N?o-Interativo)  
**Config**: `config.json` autom?tico  
**Debug**: Logs completos em ambos os modos
