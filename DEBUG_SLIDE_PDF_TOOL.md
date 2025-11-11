# DEBUG E FEEDBACK - TOOL SLIDE_PDF

## PROBLEMA IDENTIFICADO

**UI do PDF está ruim**: Texto único em um parágrafo sem formatação adequada.

## ANÁLISE DO CÓDIGO

### 1. PROMPT DE GERAÇÃO DE CONTEÚDO
**Localização**: `slide-pdf-tool.ts` linhas 146-159

```typescript
const contentPrompt = `Você é um especialista em criar conteúdo para ebooks de emagrecimento.
...
Retorne APENAS o conteúdo, sem formatação adicional.`;
```

**PROBLEMA**: O prompt pede conteúdo SEM formatação, então o texto vem como bloco único.

### 2. INSERÇÃO NO HTML
**Localização**: `slide-pdf.ts` linha 202

```typescript
<div class="content-text">${config.content}</div>
```

**PROBLEMA**: O conteúdo é inserido diretamente sem processar quebras de linha ou parágrafos. O CSS tem `white-space: normal` implícito, mas o texto não tem `<br>` ou `<p>` tags.

### 3. CSS DO CONTEÚDO
**Localização**: `slide-pdf.ts` linhas 157-163

```css
.content-text {
  font-size: 24px;
  line-height: 1.6;
  max-width: 1000px;
  text-align: center;
  color: ${theme.textColor};
}
```

**PROBLEMA**: Falta `white-space: pre-wrap` ou processamento de quebras de linha. O texto longo fica como parágrafo único.

## SOLUÇÕES NECESSÁRIAS

1. **Processar quebras de linha**: Converter `\n` em `<br>` ou `<p>`
2. **Melhorar prompt**: Pedir formatação com parágrafos ou bullets
3. **Adicionar CSS**: `white-space: pre-wrap` ou melhor estruturação
4. **Quebrar texto longo**: Dividir em múltiplos parágrafos visuais

## FEEDBACK DE 100 PALAVRAS

A tool `slide_pdf` funciona bem na geração de conteúdo e estrutura HTML, mas falha na formatação visual do PDF. O problema principal é que o texto é inserido como bloco único sem processamento de quebras de linha. O prompt pede conteúdo "sem formatação adicional", resultando em parágrafos gigantes. A solução requer processar `\n` em `<br>` ou `<p>`, melhorar o prompt para incluir estruturação, e adicionar CSS adequado. A conversão Puppeteer funciona, mas o HTML gerado precisa de melhor formatação textual antes da conversão.
