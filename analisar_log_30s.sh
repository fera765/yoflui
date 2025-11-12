#!/bin/bash

LOG_FILE="/workspace/flui_output.log"
SLIDES_DIR="/workspace/work/slides/s_elegantes"
WORK_DIR="/workspace/work"
CHECK_INTERVAL=30

echo "==========================================="
echo "ANÁLISE CONTÍNUA DO LOG - A cada ${CHECK_INTERVAL}s"
echo "==========================================="
echo ""

LAST_LOG_SIZE=0
ITERATION=0

while true; do
    ITERATION=$((ITERATION + 1))
    echo ""
    echo "[ANÁLISE #${ITERATION}] $(date '+%H:%M:%S')"
    echo "==========================================="
    
    # Verificar processo
    PROCESS_PID=$(pgrep -f "tsx.*cli.tsx" | head -1)
    if [ -n "$PROCESS_PID" ]; then
        echo "⚡ Processo ativo (PID: $PROCESS_PID)"
    else
        echo "✅ Processo finalizado"
    fi
    
    # Analisar log
    if [ -f "$LOG_FILE" ]; then
        CURRENT_SIZE=$(wc -c < "$LOG_FILE" 2>/dev/null || echo "0")
        
        if [ "$CURRENT_SIZE" -gt "$LAST_LOG_SIZE" ]; then
            echo ""
            echo "📝 NOVO CONTEÚDO NO LOG:"
            echo "-------------------------------------------"
            tail -c +$((LAST_LOG_SIZE + 1)) "$LOG_FILE" 2>/dev/null | tail -20 | grep -E "(slide|PDF|PPTX|Gerando|Conteúdo gerado|Error|Completed|success)" | head -10
            
            LAST_LOG_SIZE=$CURRENT_SIZE
        else
            echo "📝 Sem novo conteúdo no log"
        fi
        
        echo ""
        echo "📊 ÚLTIMAS LINHAS DO LOG:"
        echo "-------------------------------------------"
        tail -10 "$LOG_FILE" 2>/dev/null | grep -v "^$"
    fi
    
    # Verificar arquivos
    echo ""
    echo "📁 ARQUIVOS:"
    echo "-------------------------------------------"
    
    pdf_count=$(find "$WORK_DIR" -name "*.pdf" -type f 2>/dev/null | grep -v node_modules | wc -l)
    pptx_count=$(find "$WORK_DIR" -name "*.pptx" -type f 2>/dev/null | grep -v node_modules | wc -l)
    html_count=$(find "$SLIDES_DIR" -name "slide_*.html" -type f 2>/dev/null | wc -l)
    
    echo "   PDFs: $pdf_count"
    echo "   PPTX: $pptx_count"
    echo "   Slides HTML: $html_count/20"
    
    # Validar alguns slides
    if [ "$html_count" -gt 0 ]; then
        echo ""
        echo "🎨 VALIDAÇÃO RÁPIDA (primeiros 3 slides):"
        echo "-------------------------------------------"
        for i in {1..3}; do
            slide_file="$SLIDES_DIR/slide_$(printf "%03d" $i).html"
            if [ -f "$slide_file" ]; then
                title=$(grep -oP '<h1[^>]*>([^<]+)</h1>' "$slide_file" 2>/dev/null | sed 's/<[^>]*>//g' | head -1)
                content=$(grep -oP '<div[^>]*class="content-text"[^>]*>([\s\S]*?)</div>' "$slide_file" 2>/dev/null | sed 's/<[^>]*>//g' | head -1)
                has_ui=$(grep -c "Inter\|SF Pro\|color\|background" "$slide_file" 2>/dev/null || echo "0")
                content_len=${#content}
                
                echo "   Slide $i:"
                echo "      UI: ✅ ($has_ui elementos)"
                echo "      Título: \"${title:0:50}\""
                if [ "$content_len" -gt 0 ]; then
                    echo "      Conteúdo: ✅ ($content_len chars)"
                    echo "      Preview: \"${content:0:80}...\""
                else
                    echo "      Conteúdo: ⚠️  VAZIO"
                fi
            fi
        done
    fi
    
    # Verificar se completou
    if [ -z "$PROCESS_PID" ] && [ "$html_count" -ge 20 ]; then
        echo ""
        echo "==========================================="
        echo "✅ TESTE COMPLETO!"
        echo "==========================================="
        break
    fi
    
    sleep $CHECK_INTERVAL
done

echo ""
echo "Análise finalizada"
