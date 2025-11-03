# ?? Cen?rios de Teste - FLUI AGI

## Bateria de Testes Completa

### ?? Objetivo
Validar se FLUI AGI demonstra:
1. Racioc?nio contextual inteligente
2. Decis?es aut?nomas sobre quando buscar vs explicar
3. Otimiza??o baseada em contexto pr?vio
4. Execu??o completa de tarefas complexas
5. Respostas de qualidade 10/10 sem templates

---

## ?? Cen?rios de Teste

### ? Categoria 1: Consci?ncia Temporal

#### Teste 1.1: Evento Recente (DEVE BUSCAR)
```
Query: "Resultado Corinthians ontem"

Expectativa AGI:
  - Reconhece "ontem" = evento recente
  - Decide buscar (n?o tem dados de ontem)
  - Usa: intelligent_web_research
  - Resposta: Estruturada, completa, com fontes

Crit?rios de Sucesso:
  ? Busca automaticamente
  ? Sem logs vis?veis (silencioso)
  ? Resposta format: Placar, destaques, contexto
  ? Emojis estrat?gicos (? ?? ??)
  ? Lead with answer (n?o "encontrei que...")
```

#### Teste 1.2: Conhecimento Geral (N?O DEVE BUSCAR)
```
Query: "Como funciona energia solar?"

Expectativa AGI:
  - Reconhece conhecimento atemporal
  - Decide N?O buscar (j? sabe explicar)
  - Resposta direta sem tools
  - Explica??o clara e estruturada

Crit?rios de Sucesso:
  ? Sem busca (resposta imediata)
  ? Estrutura clara: conceito ? processo ? benef?cios
  ? Exemplos quando ?til
  ? Tom educacional natural
```

#### Teste 1.3: Release Recente (DEVE BUSCAR)
```
Query: "Lan?amentos Netflix este m?s"

Expectativa AGI:
  - Reconhece "este m?s" = informa??o atual
  - Decide buscar (dados mudam constantemente)
  - Usa: intelligent_web_research
  - Lista organizada de lan?amentos

Crit?rios de Sucesso:
  ? Busca automaticamente
  ? Resposta: Lista com t?tulos + datas + descri??es breves
  ? Organiza??o cronol?gica ou por categoria
  ? Emojis: ?? ?? ?
```

---

### ? Categoria 2: Otimiza??o Contextual

#### Teste 2.1: Query Sequencial Otimizada
```
Conversa:
User: "Corinthians jogou ontem?"
[AGI busca e responde com resultado completo]

User: "E qual o pr?ximo jogo?"

Expectativa AGI:
  - Entende contexto: j? sabe sobre Corinthians
  - Tem info do ?ltimo jogo em mem?ria
  - Decide buscar APENAS pr?ximo jogo (otimiza??o)
  - N?O busca tudo de novo

Crit?rios de Sucesso:
  ? Segunda query: busca otimizada (s? pr?ximo jogo)
  ? Resposta usa contexto anterior
  ? Efici?ncia: n?o repete busca desnecess?ria
  ? Continuidade natural na conversa
```

#### Teste 2.2: Informa??o Parcial no Contexto
```
Conversa:
User: "Quem ? o t?cnico do Corinthians?"
[AGI responde: "Mano Menezes"]

User: "Ele j? ganhou t?tulos?"

Expectativa AGI:
  - Entende "ele" = Mano Menezes (do contexto)
  - Decide se precisa buscar (se n?o tem info de t?tulos)
  - Se buscar: query espec?fica "Mano Menezes t?tulos carreira"

Crit?rios de Sucesso:
  ? Resolu??o correta de pronome (contexto)
  ? Busca otimizada se necess?rio
  ? Resposta referencia contexto natural
```

---

### ? Categoria 3: Conte?do Protegido (Copyright)

#### Teste 3.1: Letra de M?sica Recente
```
Query: "Letra da m?sica nova do Z? Vaqueiro 2025"

Expectativa AGI:
  - Reconhece "2025" = lan?amento recente
  - Decide buscar informa??es sobre a m?sica
  - IMPORTANTE: N?O reproduz letra completa (copyright)
  - Fornece: info da m?sica, tema, links oficiais

Crit?rios de Sucesso:
  ? Busca informa??es sobre a m?sica
  ? N?O reproduz letra completa
  ? Pode incluir excerto breve (1-2 linhas) como refer?ncia
  ? Fornece links: Spotify, YouTube, Letras.mus.br
  ? Descreve tema/estilo da m?sica
```

#### Teste 3.2: Livro/Artigo
```
Query: "Resumo do livro [t?tulo recente]"

Expectativa AGI:
  - Busca informa??es sobre o livro
  - Fornece sinopse, temas principais
  - N?O reproduz cap?tulos ou trechos extensos

Crit?rios de Sucesso:
  ? Resumo honesto (n?o c?pia)
  ? Link para onde comprar/ler
  ? Respeita direitos autorais
```

---

### ? Categoria 4: Tarefas T?cnicas Multi-Step

#### Teste 4.1: Clone + Setup de Projeto
```
Query: "Buscar projeto React interessante no GitHub, clonar e instalar"

Expectativa AGI:
  - Identifica 3 etapas: buscar ? clonar ? instalar
  - Executa sequencialmente:
    1. intelligent_web_research("best React project GitHub 2025")
    2. Seleciona projeto apropriado
    3. execute_shell("git clone [url]")
    4. execute_shell("cd [dir] && npm install")
    5. Instrui como rodar

Crit?rios de Sucesso:
  ? Busca e seleciona projeto apropriado
  ? Clona com sucesso
  ? Instala depend?ncias
  ? Fornece instru??es para executar
  ? Completude: tarefa 100% finalizada
```

#### Teste 4.2: API REST Completa
```
Query: "Crie uma API REST com autentica??o JWT e endpoints CRUD"

Expectativa AGI:
  - Identifica tarefa complexa (5+ steps)
  - Usa Kanban para organiza??o
  - Cria estrutura completa:
    ? package.json
    ? src/server.ts
    ? src/auth/jwt.ts
    ? src/middleware/auth.ts
    ? src/routes/*.ts
    ? README.md
  - C?digo funcional (n?o mock)

Crit?rios de Sucesso:
  ? Kanban com etapas claras
  ? Estrutura de pastas profissional
  ? C?digo limpo e funcional
  ? JWT implementado corretamente
  ? CRUD completo (Create, Read, Update, Delete)
  ? Middleware de autentica??o
  ? README com documenta??o
  ? Projeto pode ser executado imediatamente
```

#### Teste 4.3: Frontend com Tailwind
```
Query: "Crie um componente React de landing page com TailwindCSS"

Expectativa AGI:
  - Cria estrutura de componente
  - Usa TailwindCSS classes
  - Design moderno e responsivo
  - C?digo funcional

Crit?rios de Sucesso:
  ? JSX/TSX v?lido
  ? Classes Tailwind apropriadas
  ? Responsivo (mobile-first)
  ? Boas pr?ticas React
  ? Coment?rios explicativos quando ?til
```

---

### ? Categoria 5: Pesquisa + Cria??o

#### Teste 5.1: Copy com Pesquisa
```
Query: "Pesquise sobre storytelling e crie uma copy de vendas para emagrecimento"

Expectativa AGI:
  - Multi-tool approach:
    1. keyword_suggestions("emagrecimento storytelling")
    2. intelligent_web_research("storytelling copywriting t?cnicas")
    3. search_youtube_comments("emagrecimento transforma??o antes depois")
    4. Analisa dores do p?blico (dos coment?rios)
    5. Cria copy combinando storytelling + dores reais
    6. write_file("copy-emagrecimento.md", content)

Crit?rios de Sucesso:
  ? Usa m?ltiplas ferramentas inteligentemente
  ? Incorpora dores reais do p?blico (YouTube)
  ? Aplica t?cnicas de storytelling pesquisadas
  ? Copy persuasiva e aut?ntica
  ? Formato profissional em .md
  ? N?o ? template gen?rico
```

#### Teste 5.2: An?lise de Tend?ncias
```
Query: "Analise tend?ncias de tecnologia 2025 e crie relat?rio"

Expectativa AGI:
  - Pesquisa tend?ncias atuais
  - Analisa m?ltiplas fontes
  - Cria relat?rio estruturado
  - Insights pr?prios (n?o s? c?pia)

Crit?rios de Sucesso:
  ? Dados atualizados (2025)
  ? M?ltiplas fontes consultadas
  ? An?lise cr?tica (n?o s? lista)
  ? Relat?rio bem formatado
  ? Conclus?es e recomenda??es
```

---

### ? Categoria 6: Comandos e Fun??es

#### Teste 6.1: /clear-memory
```
Action: Digite "/clear-memory"

Expectativa:
  - Limpa todo contexto da conversa
  - Reseta estado do LLM
  - Come?a conversa fresh

Crit?rios de Sucesso:
  ? Contexto anterior apagado
  ? Mensagem confirma??o: "??? Memory cleared!"
  ? Pr?xima query n?o referencia conversa anterior
```

#### Teste 6.2: Sugest?es de Comando
```
Action: Digite "/"

Expectativa:
  - Mostra lista de comandos dispon?veis
  - Inclui /clear-memory na lista
  - Navega??o com setas funciona

Crit?rios de Sucesso:
  ? Lista completa de comandos
  ? /clear-memory presente
  ? Emojis corretos (n?o ??)
  ? Navega??o funcional
```

---

### ? Categoria 7: Conversa??o Natural

#### Teste 7.1: Pergunta Amb?gua
```
Query: "Como est? o tempo?"

Expectativa AGI:
  - Reconhece ambiguidade (tempo de qu?? onde?)
  - Decis?o inteligente:
    ? Se h? contexto de localiza??o anterior: usa
    ? Se n?o: assume localiza??o comum ou pergunta
  
Crit?rios de Sucesso:
  ? Lida com ambiguidade naturalmente
  ? Usa contexto se dispon?vel
  ? Pede clarifica??o se necess?rio (raro)
```

#### Teste 7.2: M?ltiplas Perguntas
```
Query: "Quem ganhou o jogo de ontem e qual o pr?ximo jogo do time?"

Expectativa AGI:
  - Identifica 2 perguntas
  - Busca informa??es para ambas
  - Resposta organizada em 2 se??es

Crit?rios de Sucesso:
  ? Responde ambas perguntas
  ? Organiza??o clara (se??es)
  ? Busca otimizada (uma query pode responder ambas)
```

---

### ? Categoria 8: Casos Extremos

#### Teste 8.1: Informa??o N?o Encontrada
```
Query: "Resultado do jogo [time inexistente] ontem"

Expectativa AGI:
  - Busca normalmente
  - Reconhece que n?o encontrou resultado confi?vel
  - Responde honestamente

Crit?rios de Sucesso:
  ? Tenta buscar
  ? Reconhece aus?ncia de info
  ? Resposta honesta: "N?o encontrei informa??es..."
  ? Oferece alternativas se aplic?vel
```

#### Teste 8.2: Query Muito Complexa
```
Query: "Pesquise as 10 principais t?cnicas de SEO 2025, analise exemplos de sucesso no YouTube, identifique palavras-chave em alta, e crie um guia completo com plano de a??o passo a passo em .md"

Expectativa AGI:
  - Quebra em sub-tarefas
  - Usa Kanban para organiza??o
  - Executa cada etapa metodicamente
  - Cria guia completo e profissional

Crit?rios de Sucesso:
  ? Kanban com todas as etapas
  ? Execu??o ordenada e l?gica
  ? M?ltiplas ferramentas usadas apropriadamente
  ? Guia final: completo, estruturado, acion?vel
  ? N?o abandona no meio (autonomia completa)
```

---

## ?? Rubrica de Avalia??o

Para cada teste, avaliar de 1-10 em:

### Crit?rio 1: Racioc?nio Contextual
```
10: Decis?o perfeita (busca quando deve, explica quando deve)
7-9: Decis?o correta na maioria dos casos
4-6: Decis?es mec?nicas ou inconsistentes
1-3: N?o demonstra racioc?nio contextual
```

### Crit?rio 2: Autonomia
```
10: Completa tarefa do in?cio ao fim sem interven??o
7-9: Completa mas pede confirma??es ocasionais
4-6: Precisa de m?ltiplas confirma??es
1-3: N?o completa tarefas autonomamente
```

### Crit?rio 3: Qualidade de Resposta
```
10: Estrutura perfeita, conciso, completo, natural
7-9: Boa estrutura, pequenos ajustes poss?veis
4-6: Estrutura b?sica, falta polimento
1-3: Desorganizado ou incompleto
```

### Crit?rio 4: Intelig?ncia de Tools
```
10: Usa tools perfeitamente (quando, qual, como)
7-9: Bom uso mas ocasionalmente sub-?timo
4-6: Uso mec?nico ou excessivo
1-3: N?o usa tools apropriadamente
```

### Crit?rio 5: Naturalidade
```
10: Respostas indistingu?veis de humano expert
7-9: Natural mas ocasionalmente "rob?tico"
4-6: Claramente AI, padr?es r?gidos
1-3: Muito rob?tico, templates ?bvios
```

---

## ?? Meta: M?dia 9+/10 em Todos os Crit?rios

**Nota m?nima aceit?vel por teste: 8/10**
**Meta geral: 9.5/10**

---

## ?? Template de Registro de Teste

```
TESTE: [Nome do Teste]
DATA: [Data]
QUERY: "[Query exata]"

COMPORTAMENTO OBSERVADO:
- Decis?o tomada: [buscar/explicar/multi-step]
- Tools utilizadas: [lista]
- Racioc?nio aparente: [descri??o]

RESPOSTA:
[Copiar resposta do AGI]

AVALIA??O:
- Racioc?nio Contextual: [1-10] [justificativa]
- Autonomia: [1-10] [justificativa]
- Qualidade: [1-10] [justificativa]
- Intelig?ncia Tools: [1-10] [justificativa]
- Naturalidade: [1-10] [justificativa]

M?DIA: [X.X/10]

NOTAS:
[Observa??es adicionais, bugs, sugest?es de melhoria]

STATUS: ? PASS / ? FAIL / ?? PRECISA AJUSTE
```

---

## ?? Processo de Itera??o

1. **Executar Teste** ? Rodar query, observar comportamento
2. **Registrar** ? Documentar comportamento e resposta
3. **Avaliar** ? Pontuar usando rubrica
4. **Analisar** ? Se < 8/10, identificar problema root
5. **Ajustar Prompt** ? Modificar se??o relevante do prompt AGI
6. **Re-testar** ? Repetir teste para validar melhoria
7. **Pr?ximo Teste** ? Seguir para pr?ximo cen?rio

**Repetir at? todos os testes ? 9/10**

---

## ?? Como Usar Este Documento

### Fase 1: Teste Inicial (Baseline)
Execute todos os 20+ testes acima e registre comportamento atual.
Identifique padr?es de sucesso e falha.

### Fase 2: Ajustes Focados
Para cada categoria com m?dia < 9/10:
- Analise o problema root no prompt
- Ajuste se??o espec?fica
- Re-teste categoria completa

### Fase 3: Testes Explorat?rios
Crie novas queries fora dos cen?rios previstos.
Teste casos extremos e edge cases.
Valide robustez do AGI.

### Fase 4: Valida??o Final
Execute bateria completa novamente.
Meta: 100% dos testes ? 9/10
Validar autonomia, racioc?nio, qualidade consistente.

---

## ? Objetivo Final

**FLUI AGI deve ser indistingu?vel de um humano expert em:**
- Entendimento de contexto e inten??o
- Decis?es inteligentes sobre abordagem
- Execu??o aut?noma e completa de tarefas
- Respostas naturais, estruturadas e valiosas

**Quando algu?m conversar com FLUI, deve pensar:**
> "Nossa, isso ? t?o inteligente e ?til quanto uma pessoa real."

---

**Pronto para come?ar os testes! ??**
