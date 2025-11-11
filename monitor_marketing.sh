#!/bin/bash
# Monitor contínuo para testes de marketing do Flui
# Verifica a cada 20 segundos e ajusta conforme necessário

LOG_FILE="/workspace/flui_test_marketing.log"
CHECK_INTERVAL=20
MAX_CHECKS=60  # 20 minutos máximo
check_count=0

echo "=== MONITOR DE MARKETING FLUI ==="
echo "Verificando a cada ${CHECK_INTERVAL}s"
echo ""

while [ $check_count -lt $MAX_CHECKS ]; do
    check_count=$((check_count + 1))
    echo "[CHECK #$check_count] $(date '+%H:%M:%S')"
    echo "==========================================="
    
    # Verificar se processo está rodando
    if ! pgrep -f "tsx.*cli.tsx" > /dev/null; then
        echo "❌ Processo Flui não está rodando!"
        break
    fi
    
    # Verificar log por erros críticos
    if grep -qi "Error\|Exception\|Failed\|Cannot find module" "$LOG_FILE" 2>/dev/null; then
        echo "⚠️  ERROS DETECTADOS:"
        grep -i "Error\|Exception\|Failed\|Cannot find module" "$LOG_FILE" | tail -5
        echo ""
    fi
    
    # Verificar se ferramenta de marketing foi usada
    if grep -qi "generate_marketing_campaign" "$LOG_FILE" 2>/dev/null; then
        echo "✅ Ferramenta generate_marketing_campaign detectada!"
        grep -i "generate_marketing_campaign" "$LOG_FILE" | tail -3
        echo ""
    else
        echo "⚠️  Ferramenta de marketing NÃO detectada ainda"
        echo ""
    fi
    
    # Verificar Kanban
    echo "📋 KANBAN STATUS:"
    tail -50 "$LOG_FILE" | grep -E "KANBAN UPDATE" | tail -1 || echo "Nenhum update recente"
    echo ""
    
    # Verificar se campanha foi criada
    if [ -d "/workspace/work/campaigns" ]; then
        CAMPAIGN_COUNT=$(find /workspace/work/campaigns -name "campaign.json" 2>/dev/null | wc -l)
        if [ "$CAMPAIGN_COUNT" -gt 0 ]; then
            echo "✅ Campanhas criadas: $CAMPAIGN_COUNT"
            find /workspace/work/campaigns -name "campaign.json" | head -3
            echo ""
        fi
    fi
    
    # Verificar últimas linhas do log
    echo "📝 ÚLTIMAS AÇÕES:"
    tail -10 "$LOG_FILE" | grep -v "^$"
    echo ""
    
    # Verificar se completou
    if grep -qi "Completed.*campanha\|Concluí.*campanha\|campaign.*complete" "$LOG_FILE" 2>/dev/null; then
        echo "🎉 CAMPANHA COMPLETA DETECTADA!"
        break
    fi
    
    sleep $CHECK_INTERVAL
done

echo ""
echo "=== MONITORAMENTO FINALIZADO ==="
echo "Total de checks: $check_count"
