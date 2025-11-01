#!/bin/bash
echo "🧪 TESTE RÁPIDO DE DUPLICAÇÃO"
echo "=============================="
echo ""
echo "Executando CLI com logs..."
echo "Digite: teste"
echo "Pressione: ENTER"
echo "Aguarde processamento..."
echo "Pressione: Ctrl+C"
echo ""
sleep 2

timeout 30s node dist/cli.js 2> quick-test.log || true

echo ""
echo "=============================="
echo "📊 RESULTADO:"
echo "=============================="

COUNT=$(grep -c "HANDLE_SUBMIT CALLED" quick-test.log 2>/dev/null || echo "0")

if [ "$COUNT" = "0" ]; then
    echo "⚠️  Nenhuma mensagem foi enviada"
    echo "   (Talvez você não tenha digitado nada)"
elif [ "$COUNT" = "1" ]; then
    echo "✅ SUCESSO! handleSubmit foi chamado APENAS 1 vez"
    echo "   Duplicação RESOLVIDA! 🎉"
else
    echo "❌ PROBLEMA! handleSubmit foi chamado $COUNT vezes"
    echo "   Ainda há duplicação"
fi

echo ""
echo "Ver logs completos:"
echo "  cat quick-test.log"
