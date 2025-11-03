#!/bin/bash

echo "🧠 FLUI AGI - Validação Rápida"
echo "================================"
echo ""

echo "✅ Checklist Pré-Teste:"
echo ""

# Check 1: Build
if [ -d "build" ]; then
    echo "  ✓ Build exists"
else
    echo "  ✗ Build missing - run: npm run build"
    exit 1
fi

# Check 2: Prompt AGI
if grep -q "Autonomous General Intelligence" prompts/system-prompts.json; then
    echo "  ✓ Prompt AGI ativo"
else
    echo "  ✗ Prompt AGI não encontrado"
    exit 1
fi

# Check 3: Logs silenciados
if grep -q "console.log.*Searching web" source/tools/intelligent-web-research.ts; then
    echo "  ✗ Logs ainda presentes em intelligent-web-research.ts"
else
    echo "  ✓ Logs silenciados (intelligent-web-research)"
fi

if grep -q "console.log.*DuckDuckGo attempt" source/tools/web-search.ts; then
    echo "  ✗ Logs ainda presentes em web-search.ts"
else
    echo "  ✓ Logs silenciados (web-search)"
fi

# Check 4: /clear-memory command
if grep -q "clear-memory" source/app.tsx; then
    echo "  ✓ Comando /clear-memory implementado"
else
    echo "  ✗ Comando /clear-memory não encontrado"
fi

# Check 5: No ??
if grep -r "??" source/components/ 2>/dev/null | grep -v node_modules | grep -v ".map" | wc -l | grep -q "^0$"; then
    echo "  ✓ Nenhum ?? encontrado em componentes"
else
    FOUND=$(grep -r "??" source/components/ 2>/dev/null | grep -v node_modules | grep -v ".map" | wc -l)
    echo "  ⚠ Ainda existem $FOUND ocorrências de ??"
fi

echo ""
echo "================================"
echo "🚀 Tudo Pronto!"
echo ""
echo "Inicie o FLUI:"
echo "  npm start"
echo ""
echo "📝 Queries de Teste:"
echo "  1. Resultado Corinthians ontem"
echo "  2. Como funciona energia solar?"
echo "  3. Crie uma API REST simples"
echo "  4. /clear-memory"
echo ""
echo "📊 Observe:"
echo "  • Sem logs ?? durante execução"
echo "  • Decisões inteligentes (busca vs explica)"
echo "  • Respostas estruturadas e naturais"
echo "  • Autonomia completa em tarefas"
echo ""
echo "📚 Documentação:"
echo "  • START_HERE.md"
echo "  • AGI_TRANSFORMATION_COMPLETE.md"
echo "  • TESTE_CENARIOS_AGI.md"
echo ""
