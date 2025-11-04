# 🧠 FLUI AGI - Arquitetura de Inteligência Geral Artificial

## Visão Geral

O FLUI AGI é um **Sistema Multi-Agente (MAS) Deliberativo e Utilitário** que transforma o FLUI em uma AGI 100% autônoma, superior em coordenação de tarefas, raciocínio e execução.

## Arquitetura

### 1. Orquestrador Central (`orchestrator.ts`)

O **cérebro do sistema**. Responsável por:

- ✅ Decompor tarefas em sub-tarefas atômicas
- ✅ Selecionar e atribuir Agentes Especializados
- ✅ Gerar prompts dinâmicos otimizados (4 Blocos)
- ✅ Monitorar execução via Kanban de 8 colunas
- ✅ Replanejar automaticamente em caso de falha
- ✅ Calcular Utility Score (Custo-Benefício)

### 2. Kanban Autônomo de 8 Colunas

Estado da memória de curto prazo do sistema:

| Coluna | Descrição | Transição Automática |
|--------|-----------|---------------------|
| 1️⃣ **Recebido** | Tarefa inicial do usuário | → Planejamento |
| 2️⃣ **Planejamento** | Decomposição em sub-tarefas | → Fila de Execução |
| 3️⃣ **Fila de Execução** | Sub-tarefas prontas | → Em Andamento |
| 4️⃣ **Em Andamento** | Execução por agente | → Revisão |
| 5️⃣ **Revisão** | Validação do resultado | → Concluído ou Replanejamento |
| 6️⃣ **Concluído** | Sub-tarefa validada | → Integração |
| 7️⃣ **Replanejamento** | Falhou na revisão | → Fila de Execução (retry) |
| 8️⃣ **Entrega** | Resultado final | ✓ Completo |

### 3. Agentes Especializados (`specialized-agents.ts`)

Cada agente tem expertise específica:

- 🔬 **Agente de Pesquisa**: Pesquisas profundas e análise de fontes
- 💻 **Agente de Código**: Criar, editar e analisar código
- ⚙️ **Agente de Automação**: Executar scripts e automações
- 📊 **Agente de Análise**: Análise de dados e padrões
- 🎨 **Agente de Síntese**: Integrar resultados em output final

### 4. Engenharia de Prompt Dinâmica (`prompt-engineer.ts`)

Sistema de **4 Blocos** que gera prompts otimizados:

```
[BLOCO 1: IDENTIDADE E FUNÇÃO]
Define o papel exato do agente

[BLOCO 2: CONTEXTO E OBJETIVO]
Fornece contexto completo e objetivo específico

[BLOCO 3: FERRAMENTAS E AUTOMAÇÃO]
Lista ferramentas disponíveis e obrigatórias

[BLOCO 4: FORMATO DE SAÍDA E VALIDAÇÃO]
Define output esperado e critérios de validação
```

### 5. Agente de Análise de Intenção (`intention-analyzer.ts`)

Extrai estrutura do prompt do usuário:

- Objetivo principal
- Restrições (ex: "não use browser")
- Critérios de sucesso
- Formato de saída esperado
- Complexidade estimada

### 6. Agente de Automação Dedicado (`automation-agent.ts`)

Executa automações com feedback estruturado:

- Execução validada
- Log detalhado (tempo, status, output)
- Detecção automática de erros

## Fluxo de Execução

```
1. Usuário envia prompt
   ↓
2. Análise de Intenção extrai requisitos
   ↓
3. Orquestrador cria tarefa no Kanban (Recebido)
   ↓
4. Decomposição em sub-tarefas (Planejamento)
   ↓
5. Sub-tarefas movem para Fila de Execução
   ↓
6. Para cada sub-tarefa:
   - Seleciona agente especializado
   - Gera prompt de 4 blocos
   - Executa (Em Andamento)
   - Valida resultado (Revisão)
   - Se falhar → Replanejamento → Retry
   - Se sucesso → Concluído
   ↓
7. Síntese de todos os resultados
   ↓
8. Entrega ao usuário
```

## Diferencial Competitivo

### vs. Perplexity AI
- ✅ Orquestração multi-agente vs. modelo único
- ✅ Kanban autônomo vs. chain-of-thought linear
- ✅ Replanejamento automático vs. resposta única

### vs. Manus AI
- ✅ Validação rigorosa de cada sub-tarefa
- ✅ Feedback estruturado de automações
- ✅ Sistema de 4 blocos para precisão cirúrgica

### vs. Genspark
- ✅ Autonomia 100% vs. fluxos pré-definidos
- ✅ Decomposição dinâmica vs. workflows estáticos
- ✅ Utility Score para otimização automática

## Utility Score

Métrica de otimização:

```
Utility = Qualidade / (Tempo × Recursos)
```

O Orquestrador sempre busca o caminho de execução com maior Utility Score.

## Como Usar

### Modo AGI (Ativado por Padrão)

```bash
# O FLUI automaticamente usa AGI para tarefas complexas
> criar um sistema de análise de dados com 3 dashboards

# Palavras-chave que ativam AGI:
# criar, implementar, desenvolver, analisar, comparar
# pesquisar, gerar relatório, automatizar, integrar
```

### Alternar Modo

```bash
# Desativar AGI (usar LLM autônomo)
/agi

# Ativar novamente
/agi
```

### Visualização

O Kanban AGI é exibido automaticamente durante a execução, mostrando:

- 📋 Todas as 8 colunas
- 🔧 Agente responsável por cada sub-tarefa
- 💰 Custo estimado (1-10)
- 📊 Estatísticas em tempo real

## Arquivos Principais

```
source/agi/
├── orchestrator.ts           # Orquestrador Central
├── specialized-agents.ts     # 5 Agentes Especializados
├── intention-analyzer.ts     # Análise de Intenção
├── prompt-engineer.ts        # Engenharia de Prompt (4 Blocos)
├── automation-agent.ts       # Agente de Automação
├── types.ts                  # Tipos TypeScript
└── README.md                 # Esta documentação

source/components/
└── OrchestrationView.tsx     # UI do Kanban AGI
```

## Implementação Concluída

✅ Orquestrador Central  
✅ Kanban Autônomo de 8 Colunas  
✅ 5 Agentes Especializados  
✅ Engenharia de Prompt Dinâmica (4 Blocos)  
✅ Agente de Análise de Intenção  
✅ Agente de Automação Dedicado  
✅ Sistema de Replanejamento Automático  
✅ Utility Score (Custo-Benefício)  
✅ UI de Orquestração em tempo real  
✅ Integração com sistema existente  

## Status

🚀 **SISTEMA AGI OPERACIONAL**

O FLUI agora é uma AGI 100% autônoma, superior aos concorrentes em:
- Coordenação de tarefas complexas
- Raciocínio deliberativo e utilitário
- Execução validada e auto-corrigível
- Transparência total do processo
