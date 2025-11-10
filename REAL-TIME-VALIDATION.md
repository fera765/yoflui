# Sistema de Validação em Tempo Real - Flui AGI

## 🎯 Visão Geral

O Flui agora possui um sistema avançado de validação em tempo real que **lê, analisa e corrige** conteúdo durante a execução, garantindo qualidade, coesão e atendimento aos requisitos quantitativos.

## ✨ Funcionalidades Implementadas

### 1. **ContentQualityValidator** (`source/agi/content-quality-validator.ts`)

Sistema completo de validação de qualidade de conteúdo com:

#### Análise Automática
- ✅ **Contagem de palavras por capítulo/seção**
- ✅ **Detecção de capítulos** (reconhece `## Capítulo N`)
- ✅ **Score de qualidade** (0-100)
- ✅ **Validação de requisitos quantitativos** (700 palavras/página, etc.)

#### Detecção de Problemas
- 🔍 **Repetições** (sentenças e parágrafos duplicados)
- 🔍 **Inconsistências** (tom, estilo, qualidade)
- 🔍 **Coesão** (fluxo narrativo, transições)
- 🔍 **Placeholders** (TODO, FIXME, [...])
- 🔍 **Parágrafos muito curtos** (< 50 palavras)

#### Estratégias de Expansão
- 📈 **Modo Incremental**: Expande capítulo por capítulo
- 📈 **Modo Batch**: Expande todos de uma vez
- 📈 **Sugestões específicas**: Foco em áreas que precisam melhorias

### 2. **Validação Integrada no Orquestrador** (`orchestrator-v2.ts`)

O orquestrador agora:

#### Durante Execução
```typescript
// Após criar arquivo, valida em tempo real
const qualityResult = await contentQualityValidator.validateContent(
    filePath,
    {
        minWordsPerChapter: 700,
        totalChapters: 30,
        contentType: 'ebook'
    }
);

// Se não passar, cria subtask de expansão automaticamente
if (!qualityResult.valid) {
    // Cria subtask inteligente com contexto completo
}
```

#### Subtasks de Expansão Inteligentes
Quando detecta déficit, cria automaticamente subtasks com:
- ✅ Arquivo específico a ser expandido
- ✅ Capítulo/seção que precisa atenção
- ✅ Instruções detalhadas de qualidade
- ✅ Requisitos quantitativos exatos

### 3. **Prompts Inteligentes de Expansão** (`prompt-engineer.ts`)

Prompts gerados incluem:

```
🔄 TAREFA DE EXPANSÃO INTELIGENTE DE CONTEÚDO

1. LER o arquivo existente
2. ANALISAR o conteúdo atual para entender contexto, tom e estilo
3. IDENTIFICAR seções que precisam expansão
4. EXPANDIR mantendo:
   - Coesão com conteúdo existente
   - Mesmo tom e estilo
   - Qualidade narrativa
   - SEM repetir informações já presentes
5. VALIDAR que adicionou conteúdo suficiente e de qualidade

⚠️ REGRAS DE QUALIDADE:
- Manter coesão e fluxo narrativo
- NÃO repetir informações já presentes
- Manter o mesmo tom e estilo de escrita
- Adicionar valor real, não apenas palavras de enchimento
```

## 📊 Relatório de Qualidade

O validador gera relatórios detalhados:

```
📊 RELATÓRIO DE QUALIDADE DE CONTEÚDO
════════════════════════════════════════════════════════════

✅ VÁLIDO / ❌ REQUER ATENÇÃO
📝 Total de palavras: 4819
⭐ Score de qualidade: 75/100

📚 ANÁLISE POR CAPÍTULO:
────────────────────────────────────────────────────────────
✅ Cap 1: Introdução à IA
   Palavras: 850/700 (121%)

⚠️  Cap 2: História da IA
   Palavras: 450/700 (64%)
   ⚠️  Faltam: 250 palavras

🔍 PROBLEMAS DETECTADOS:
────────────────────────────────────────────────────────────
⚠️  Alta prioridade (2):
   • Muitos parágrafos curtos (15/30)
   • Repetições detectadas em 3 seções

🚀 ESTRATÉGIA DE EXPANSÃO:
────────────────────────────────────────────────────────────
Modo: Incremental (capítulo por capítulo)
Capítulos a expandir: 12
Tokens estimados: ~3500

Passos:
1. expand_chapter: Capítulo 2 (+250 palavras)
2. expand_chapter: Capítulo 5 (+180 palavras)
...

💡 SUGESTÕES:
────────────────────────────────────────────────────────────
   📝 12 capítulo(s) precisa(m) ser expandido(s)
   📊 Total de 3200 palavras faltando
   🎯 Prioridade: Cap 2 (250), Cap 5 (180), Cap 8 (300)
```

## 🔄 Fluxo de Trabalho

### Criação de Ebook (Exemplo)

```
Usuário: "Criar ebook com 30 páginas, 700 palavras cada"
                    ↓
1. Decomposição automática
   → Detecta requisito quantitativo
   → Cria subtasks (Analisar, Planejar, Escrever)
                    ↓
2. Execução: Escrever ebook
   → Agente cria arquivo initial
                    ↓
3. VALIDAÇÃO EM TEMPO REAL ⚡
   → Lê arquivo criado
   → Conta palavras por capítulo
   → Analisa qualidade e coesão
   → Gera score 0-100
                    ↓
4. DECISÃO:
   
   ✅ Se válido (score ≥ 70, requisitos OK)
      → Marca como completo
      → Continua próxima task
   
   ⚠️  Se inválido (déficit detectado)
      → Cria subtask de expansão automática
      → Subtask lê arquivo
      → Subtask expande capítulo específico
      → Valida novamente
      → Repete até 3x se necessário
                    ↓
5. Resultado Final
   → Ebook completo com 30 capítulos
   → Cada capítulo com 700+ palavras
   → Qualidade verificada
   → Coesão garantida
```

## 🎨 Adaptativo para Frontend/Código

O sistema também funciona para projetos frontend:

```typescript
// Detecta projeto frontend
const validation = await validator.validateContent(
    'src/App.tsx',
    {
        expectedComponents: ['Header', 'Sidebar', 'Player'],
        codeQuality: true
    }
);

// Valida:
// - Componentes foram criados?
// - Imports estão corretos?
// - Não há placeholders?
// - Código compila?
```

## 🚀 Benefícios

### Qualidade Garantida
- ✅ Conteúdo sempre atende requisitos
- ✅ Sem parágrafos vazios ou placeholders
- ✅ Coesão narrativa mantida

### Autonomia Total
- 🤖 Detecção automática de problemas
- 🤖 Criação automática de correções
- 🤖 Expansão incremental inteligente

### Eficiência
- ⚡ Validação em tempo real (não espera até o final)
- ⚡ Correções pontuais (expande só o necessário)
- ⚡ Até 3 tentativas de expansão por subtask

### Versatilidade
- 📚 Ebooks e artigos longos
- 💻 Projetos de código
- 📄 Documentação técnica
- 🎨 Conteúdo criativo

## 🔧 Configuração

### Requisitos Quantitativos Suportados

```typescript
// Palavras por capítulo
"700 palavras por capítulo"
"mínimo 1000 palavras"

// Total de capítulos
"30 páginas"
"50 capítulos"

// Palavras totais
"mínimo 20000 palavras"
```

### Tipos de Conteúdo

```typescript
contentType: 'ebook' | 'article' | 'documentation'
```

## 📝 Exemplo de Uso

```bash
# Ebook com validação automática
npm test "Criar ebook sobre IA com 30 capítulos, cada um com 700 palavras. Salvar em work/ebook-ia.md"

# O Flui irá:
# 1. Detectar requisitos (30 capítulos × 700 palavras)
# 2. Criar ebook inicial
# 3. LER o arquivo criado
# 4. VALIDAR cada capítulo
# 5. EXPANDIR automaticamente se necessário
# 6. VALIDAR novamente até atingir requisitos
# 7. Garantir qualidade e coesão
```

## 🎯 Próximos Passos

### Em Desenvolvimento
- [ ] Validação de estilo de escrita (formal, casual, técnico)
- [ ] Detecção de plágio/similaridade
- [ ] Sugestões de melhoria baseadas em IA
- [ ] Validação de fatos e informações

### Planejado
- [ ] Suporte a múltiplos idiomas
- [ ] Análise de SEO para artigos
- [ ] Exportação para diferentes formatos (PDF, EPUB)
- [ ] Integração com editores de markdown

## 🏆 Resultado

O Flui agora é um **super agente autônomo** capaz de:
- ✅ Criar conteúdo extenso e complexo
- ✅ Validar qualidade em tempo real
- ✅ Corrigir automaticamente deficiências
- ✅ Garantir coesão e consistência
- ✅ Atingir requisitos quantitativos precisos
- ✅ Funcionar como uma agência de conteúdo digital completa

---

**Desenvolvido por:** Cursor AI Agent  
**Versão:** 2.0 - Real-Time Validation System  
**Data:** 2025-11-10
