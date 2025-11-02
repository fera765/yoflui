# ?? GUIA COMPLETO - SISTEMA FLUI

**Sistema de IA com Contexto Inteligente e Agentes Aut?nomos**

---

## ?? ?ndice

1. [O que ? o Flui?](#o-que-?-o-flui)
2. [Caracter?sticas Principais](#caracter?sticas-principais)
3. [Instala??o](#instala??o)
4. [Uso B?sico](#uso-b?sico)
5. [Sistema de Contexto](#sistema-de-contexto)
6. [Sistema de Agentes](#sistema-de-agentes)
7. [Comandos Dispon?veis](#comandos-dispon?veis)
8. [Exemplos Pr?ticos](#exemplos-pr?ticos)
9. [Troubleshooting](#troubleshooting)

---

## O que ? o Flui?

Flui ? um assistente de IA aut?nomo com capacidade de:
- ?? **Entender contexto do projeto automaticamente**
- ?? **Delegar tarefas para agentes especializados**
- ?? **Manter hist?rico de conversa??o por projeto**
- ?? **Executar ferramentas do sistema**
- ?? **Gerenciar tarefas com Kanban**

---

## Caracter?sticas Principais

### ? Contexto Autom?tico e Silencioso

```
Ao executar o Flui em qualquer pasta, ele:
1. Escaneia a estrutura de pastas (nomes apenas)
2. Detecta o tipo de projeto (React, Python, Node.js, etc.)
3. Cria pasta .flui/ com contexto persistente
4. Carrega hist?rico de conversa??es anteriores
```

### ?? Sistema de Agentes Hier?rquico

```
MainAgent
??? FileWriterAgent
?   ??? ValidationAgent
??? CodeAnalyzerAgent
??? TestRunnerAgent
```

Cada agente pode:
- Usar ferramentas do sistema
- Delegar tarefas para outros agentes
- Retornar resultados estruturados

### ?? 12 Ferramentas Dispon?veis

1. **edit_file** - Editar arquivos
2. **read_file** - Ler conte?do de arquivos
3. **write_file** - Criar/sobrescrever arquivos
4. **execute_shell** - Executar comandos shell
5. **find_files** - Buscar arquivos por padr?o
6. **search_text** - Buscar texto em arquivos
7. **read_folder** - Listar conte?do de diret?rios
8. **update_kanban** - Atualizar quadro Kanban
9. **web_fetch** - Buscar URLs
10. **search_youtube_comments** - Buscar coment?rios do YouTube
11. **save_memory** - Salvar mem?rias/contexto
12. **delegate_to_agent** - Delegar para agente especializado

---

## Instala??o

### Pr?-requisitos

- Node.js 18+
- npm ou yarn

### Passo a Passo

```bash
# 1. Clonar reposit?rio
cd youtube-cli

# 2. Instalar depend?ncias
npm install

# 3. Compilar TypeScript
npx tsc

# 4. Verificar instala??o
./test-complete-system.sh
```

---

## Uso B?sico

### Iniciar o CLI

```bash
# Executar no diret?rio do seu projeto
cd /path/to/your/project
node /path/to/youtube-cli/dist/cli.js
```

### Primeira Execu??o

Ao executar pela primeira vez, voc? ver?:

```
[ READY ]

> _
```

Digite `/` para ver comandos dispon?veis:

```
?? /tools   - Lista todas as ferramentas
?? /config  - Configurar settings
?? /llm     - Configurar autentica??o LLM
?? /exit    - Sair da aplica??o
```

### Configurar LLM

```bash
# Pressione /llm no CLI
# Escolha entre:
# 1. Custom Endpoint
# 2. Qwen OAuth
```

---

## Sistema de Contexto

### Estrutura de Contexto

Ao executar o Flui, ele cria automaticamente:

```
seu-projeto/
??? .flui/
?   ??? context.json      # Contexto da sess?o
??? src/
??? package.json
??? ...
```

### Conte?do do context.json

```json
{
  "sessionId": "session-1761981722670",
  "timestamp": 1761981722670,
  "workingDirectory": "/path/to/project",
  "folderStructure": [
    {
      "name": "src",
      "type": "folder",
      "children": [...]
    }
  ],
  "projectType": "frontend-react",
  "conversationHistory": [
    {
      "timestamp": 1761981722670,
      "role": "user",
      "content": "Crie um componente Button"
    },
    {
      "timestamp": 1761981722671,
      "role": "assistant",
      "content": "Criei o componente em src/components/Button.js"
    }
  ]
}
```

### Detec??o Autom?tica de Tipo

| Tipo | Arquivos Detectados |
|------|---------------------|
| `frontend-react` | package.json + src/ ou components/ |
| `python` | requirements.txt, setup.py, pyproject.toml |
| `nodejs` | package.json |
| `golang` | go.mod |
| `rust` | Cargo.toml |
| `java-maven` | pom.xml |
| `generic` | Outros |

### Contexto na LLM

O contexto ? automaticamente injetado no prompt da LLM:

```
## PROJECT CONTEXT
Working Directory: /path/to/project
Project Type: frontend-react
Session ID: session-123

## FOLDER STRUCTURE (names only, no content):
?? src
  ?? components
    ?? Header.js
  ?? App.js
  ?? index.js
?? package.json

## RECENT CONVERSATION:
[10:30:00] user: Crie um bot?o
[10:30:05] assistant: Bot?o criado em src/components/Button.js

## CURRENT USER INPUT: Adicione estilo ao bot?o
```

---

## Sistema de Agentes

### O que s?o Agentes?

Agentes s?o assistentes especializados que podem:
- Executar tarefas espec?ficas
- Usar ferramentas do sistema
- Delegar subtarefas para outros agentes
- Trabalhar de forma aut?noma

### Como Usar Agentes

#### Delega??o Autom?tica pela LLM

```
Voc?: "Analise todos os arquivos .js e crie um relat?rio"

LLM decide:
1. Usar delegate_to_agent para criar "FileAnalyzer"
2. FileAnalyzer usa find_files para buscar .js
3. FileAnalyzer usa read_file para cada arquivo
4. FileAnalyzer cria relat?rio com write_file
5. Retorna resultado
```

#### Exemplo de Delega??o

```javascript
// LLM chama a tool:
{
  "tool": "delegate_to_agent",
  "args": {
    "task": "Analise todos os arquivos .js e crie relat?rio",
    "agent_role": "File Analyzer"
  }
}

// Sistema cria agente:
Agent {
  id: "agent-1",
  name: "Agent-1",
  role: "File Analyzer",
  status: "working"
}

// Agente pode:
// 1. Usar find_files
// 2. Usar read_file
// 3. Delegar para outros agentes
// 4. Retornar resultado
```

### Hierarquia de Agentes

```
TaskCoordinator (agent-0)
??? FileOperations (agent-1)
?   ??? FileReader (agent-2)
?   ??? FileWriter (agent-3)
??? CodeAnalysis (agent-4)
    ??? LintChecker (agent-5)
```

Cada agente:
- Tem ID ?nico
- Conhece seu parent
- Mant?m lista de children
- Rastreia tools usadas
- Mede tempo de execu??o

---

## Comandos Dispon?veis

### Comandos do Sistema

| Comando | Descri??o |
|---------|-----------|
| `/tools` | Lista todas as ferramentas dispon?veis |
| `/config` | Configurar maxVideos e maxComments |
| `/llm` | Configurar autentica??o do LLM |
| `/exit` | Sair da aplica??o |

### Atalhos de Teclado

| Atalho | A??o |
|--------|------|
| `Esc` | Limpar input |
| `Enter` | Enviar mensagem |
| `/` | Mostrar comandos |

---

## Exemplos Pr?ticos

### Exemplo 1: Criar Componente React

```
Voc?: "Crie um componente Button em src/components/"

Sistema:
1. ? Detecta que ? projeto React (do contexto)
2. ? Conhece estrutura de pastas
3. ? Usa write_file para criar Button.js
4. ? Responde com c?digo criado

Resultado:
? Arquivo criado: src/components/Button.js
? Contexto atualizado com nova mensagem
```

### Exemplo 2: An?lise Completa do Projeto

```
Voc?: "Analise o projeto e crie um relat?rio com:
       - Total de arquivos
       - Depend?ncias usadas
       - Poss?veis melhorias"

Sistema:
1. ? Delega para "ProjectAnalyzer Agent"
2. Agent usa:
   - read_folder (estrutura)
   - read_file (package.json)
   - find_files (todos .js)
   - write_file (relat?rio)
3. ? Retorna relat?rio completo

Resultado:
? Relat?rio salvo: project-analysis.md
```

### Exemplo 3: Implementar Feature Completa

```
Voc?: "Implemente autentica??o com JWT:
       - Criar middleware
       - Criar rota de login
       - Adicionar testes"

Sistema:
1. ? Cria Kanban com 3 tarefas
2. Para cada tarefa, delega para agente:
   - MiddlewareCreator Agent
   - RouteImplementer Agent
   - TestWriter Agent
3. ? Cada agente trabalha de forma aut?noma
4. ? Resultados agregados

Resultado:
? 3 arquivos criados
? Testes implementados
? Kanban atualizado
```

### Exemplo 4: Refatora??o com Valida??o

```
Voc?: "Refatore src/utils/helper.js para usar async/await"

Sistema:
1. MainAgent delega para RefactorAgent
2. RefactorAgent:
   - read_file (c?digo atual)
   - Analisa e refatora
   - write_file (novo c?digo)
   - Delega para ValidationAgent
3. ValidationAgent:
   - execute_shell (npm test)
   - Valida que testes passam
   - Retorna resultado

Resultado:
? C?digo refatorado
? Testes passando
? Valida??o completa
```

---

## Troubleshooting

### Problema: Context n?o est? sendo criado

**Solu??o:**
```bash
# Verificar permiss?es de escrita
chmod +w .

# Verificar se .flui est? no .gitignore
echo ".flui/" >> .gitignore
```

### Problema: LLM n?o est? usando o contexto

**Solu??o:**
```bash
# Verificar se context.json existe
ls .flui/context.json

# Ver conte?do do contexto
cat .flui/context.json | jq '.'

# Recriar contexto
rm -rf .flui/
# Execute CLI novamente
```

### Problema: Agente n?o est? executando tools

**Solu??o:**
```bash
# Verificar se todas as tools est?o registradas
node -e "
const { ALL_TOOL_DEFINITIONS } = require('./dist/tools/index.js');
console.log('Total tools:', ALL_TOOL_DEFINITIONS.length);
ALL_TOOL_DEFINITIONS.forEach(t => console.log('-', t.function.name));
"
```

### Problema: Build falhando

**Solu??o:**
```bash
# Limpar e rebuildar
rm -rf dist/
npm install
npx tsc

# Verificar erros
npx tsc --noEmit
```

---

## Testes

### Executar Todos os Testes

```bash
# Teste completo do sistema
./test-complete-system.sh

# Teste de uso real
./test-real-usage.sh
```

### Executar Testes Individuais

```bash
# Testar contexto
node -e "
const { loadOrCreateContext } = require('./dist/context-manager.js');
const ctx = loadOrCreateContext('test', process.cwd());
console.log(ctx);
"

# Testar agent
node -e "
const { AgentSystem } = require('./dist/agent-system.js');
const sys = new AgentSystem();
const agent = sys.createAgent('Test', 'Tester');
console.log(agent);
"
```

---

## Perguntas Frequentes

### Q: O contexto ? salvo entre execu??es?
**A:** Sim! O arquivo `.flui/context.json` persiste e ? carregado na pr?xima execu??o.

### Q: Posso ter m?ltiplos contextos?
**A:** Sim! Cada diret?rio tem seu pr?prio `.flui/` independente.

### Q: Agentes consomem mais tokens?
**A:** Depende. Agentes podem ser mais eficientes pois dividem tarefas complexas em subtarefas simples.

### Q: Como limpar o hist?rico?
**A:** Delete a pasta `.flui/` ou apenas o arquivo `context.json`.

### Q: O scan de pastas ? lento?
**A:** N?o! Ele escaneia apenas nomes (n?o conte?do) e limita profundidade a 4 n?veis.

---

## Contribuindo

Para contribuir com melhorias:

1. Fork o reposit?rio
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudan?as (`git commit -am 'Add nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Crie um Pull Request

---

## Licen?a

MIT License - veja LICENSE para mais detalhes.

---

## Suporte

Para issues e sugest?es:
- GitHub Issues: [link]
- Documenta??o: Este arquivo
- Testes: `test-complete-system.sh`

---

**Desenvolvido com ?? e muitos testes sem mocks!**
