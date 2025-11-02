#!/bin/bash

echo "?? TESTE MANUAL DE DUPLICA??O"
echo "================================"
echo ""
echo "?? INSTRU??ES:"
echo ""
echo "1. A CLI vai iniciar"
echo "2. Digite: teste"
echo "3. Pressione ENTER"
echo "4. Observe quantas vezes 'teste' aparece na tela"
echo "5. Pressione Ctrl+C para sair"
echo "6. Analise os logs em debug-manual.log"
echo ""
echo "??  IMPORTANTE: Ap?s digitar 'teste' e pressionar ENTER,"
echo "   conte quantas vezes a palavra 'teste' aparece ACIMA do prompt '>'"
echo ""
echo "Iniciando em 5 segundos..."
sleep 5

cd /workspace/youtube-cli

# Executar com logs
echo ""
echo "??  Executando CLI com logs..."
echo ""

node dist/cli.js 2> debug-manual.log

echo ""
echo "================================"
echo "?? AN?LISE DOS LOGS"
echo "================================"
echo ""

# Contar quantas vezes handleSubmit foi chamado
SUBMIT_COUNT=$(grep -c "HANDLE_SUBMIT CALLED" debug-manual.log 2>/dev/null || echo "0")
echo "handleSubmit foi chamado: $SUBMIT_COUNT vezes"

# Contar quantas vezes setMessages(user) foi chamado
SET_USER_COUNT=$(grep -c "setMessages (user)" debug-manual.log 2>/dev/null || echo "0")
echo "setMessages(user) foi chamado: $SET_USER_COUNT vezes"

# Mostrar mensagens adicionadas
echo ""
echo "Mensagens adicionadas:"
grep "handleSubmit: Message content:" debug-manual.log 2>/dev/null | head -5

echo ""
echo "Logs completos salvos em: debug-manual.log"
echo ""

if [ "$SUBMIT_COUNT" -gt "1" ]; then
    echo "? PROBLEMA: handleSubmit foi chamado M?LTIPLAS vezes!"
    exit 1
else
    echo "? handleSubmit foi chamado apenas 1 vez"
    exit 0
fi
