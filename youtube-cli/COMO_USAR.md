# 🚀 COMO USAR - Guia Rápido

## 1️⃣ Primeira Vez

\`\`\`bash
npm run start
\`\`\`

Digite:
\`\`\`
/llm
\`\`\`

Selecione:
\`\`\`
> 🔐 OAuth Qwen (2000 requests/day - FREE)
\`\`\`

O navegador abre automaticamente → Você faz login → Autoriza → Seleciona modelo → Pronto!

## 2️⃣ Usar Normalmente

\`\`\`bash
npm run start
\`\`\`

Pergunte:
\`\`\`
> Pesquise sobre as dores de quem quer emagrecer
\`\`\`

Sistema:
- ✅ Detecta necessidade de buscar YouTube
- ✅ Executa tool automaticamente
- ✅ Coleta 7 vídeos com 10 comentários cada
- ✅ LLM analisa e retorna insights

## 3️⃣ Modo Não-Interativo

\`\`\`bash
npm run start -- --prompt "Pesquise sobre programação"
\`\`\`

Output direto no terminal com análise completa.

## 4️⃣ Se Token Expirar (401)

Sistema detecta automaticamente e mostra:
\`\`\`
Error: Authentication expired. Please run /llm
\`\`\`

Você:
\`\`\`
/llm
\`\`\`

Refaz OAuth → Seleciona modelo → Pronto!

## 📊 Comandos

- \`/llm\` - Configurar autenticação e modelo
- \`/exit\` - Sair
- \`Esc\` - Limpar input

## ✅ Tudo Pronto!

**Build**: ✅ Success  
**OAuth**: ✅ Qwen Device Flow  
**Models**: ✅ Seleção dinâmica  
**401 Fix**: ✅ Auto cleanup  
**Docs**: ✅ Completa

**Sistema funcionando 100%!** 🎉
