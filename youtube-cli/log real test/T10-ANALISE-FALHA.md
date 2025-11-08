# T10 - ANÁLISE DE FALHA CRÍTICA

**Data:** 2025-11-07  
**Teste:** T10 - Ebook Cap1 1200+ palavras  
**Nota:** ❌ **1/10** (FALHA CRÍTICA)

---

## ❌ FALHAS IDENTIFICADAS

### 1. PATH COMPLETAMENTE IGNORADO
- **Esperado**: `work/ebook-cap1.md`
- **Resultado**: `chapter_1_*.md` NO ROOT DO PROJETO
- **Severidade**: CRÍTICA

### 2. FRAGMENTAÇÃO NÃO SOLICITADA
- **Esperado**: 1 arquivo consolidado
- **Resultado**: 6 arquivos separados
  - `chapter_1_introduction.md`
  - `chapter_1_fundamentos_prompting.md`
  - `chapter_1_tecnicas_basicas.md`
  - `chapter_1_exemplos_praticos.md`
  - `chapter_1_exercicios.md`
  - `chapter_1_complete.md`
- **Severidade**: ALTA

### 3. NOME DE ARQUIVO DIFERENTE
- **Esperado**: `ebook-cap1.md`
- **Resultado**: `chapter_1_*.md`
- **Severidade**: ALTA

---

## 🔍 DIAGNÓSTICO

### Causa Raiz 1: extractFilePath() Não Funciona
A função `extractFilePath()` em `task-decomposer.ts` não está capturando o path corretamente, ou o LLM está ignorando o path injetado no prompt de decomposição.

### Causa Raiz 2: LLM Decide Fragmentar
O LLM decide autonomamente fragmentar o conteúdo em múltiplos arquivos, mesmo quando o usuário pede UM arquivo único.

### Causa Raiz 3: Extração de PATH Falha em Frases Complexas
O regex de `extractFilePath()` pode não estar capturando paths em frases mais complexas:
- "Salvar Capítulo 1 em work/ebook-cap1.md" ← pode não capturar corretamente

---

## 🔧 CORREÇÕES NECESSÁRIAS

### URGENTE: Forçar PATH nas Ferramentas
1. Modificar `source/tools/write-file.ts` para validar se path está dentro de `work/`
2. Se path não estiver em `work/`, forçar prefixo `work/`
3. Logar warning se path for corrigido

### CRÍTICA: Melhorar extractFilePath()
1. Adicionar regex mais robusto para capturar paths com "Capítulo 1 em..."
2. Testar com múltiplos formatos de frase

### ALTA: Instruir LLM para NÃO Fragmentar
1. No prompt de decomposição, adicionar instrução explícita:
   "NÃO crie múltiplos arquivos para partes de um único capítulo. Todo o capítulo deve estar em UM ÚNICO arquivo."

---

## 📊 ESTATÍSTICAS ATUAIS

**Teste T8:** ✅ 10/10 (PATH correto, 1591 palavras)  
**Teste T10:** ❌ 1/10 (PATH errado, fragmentação, nome errado)

**Conclusão:** O fix de PATH não está funcionando em todos os cenários. Precisa de correção mais robusta.

---

**Status:** BLOQUEADOR para finalização dos testes
