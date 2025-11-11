#!/bin/bash

LOG_FILE="/workspace/flui_output.log"
SLIDES_DIR="/workspace/work/slides/s_elegantes"
WORK_DIR="/workspace/work"
CHECK_INTERVAL=30
ITERATION=0
LAST_LOG_SIZE=0
MAX_ITERATIONS=100  # Limite para evitar loop infinito

echo "==========================================="
echo "VALIDAÇÃO CONTÍNUA - EBOOK EMAGRECIMENTO"
echo "Analisando log a cada ${CHECK_INTERVAL}s"
echo "==========================================="
echo ""

# Função para validar um slide individual
validate_slide() {
    local slide_file="$1"
    local slide_num="$2"
    
    if [ ! -f "$slide_file" ]; then
        return 1
    fi
    
    local ui_ok=0
    local content_ok=0
    
    # Validar UI
    if grep -q "Inter\|SF Pro\|font-family" "$slide_file" 2>/dev/null; then
        ui_ok=1
    fi
    if grep -q "color\|background\|#000000\|#FFFFFF" "$slide_file" 2>/dev/null; then
        ui_ok=$((ui_ok + 1))
    fi
    
    # Validar conteúdo
    local title=$(grep -oP '<h1[^>]*>([^<]+)</h1>' "$slide_file" 2>/dev/null | sed 's/<[^>]*>//g' | head -1)
    local content=$(grep -oP '<div[^>]*class="content-text"[^>]*>([\s\S]*?)</div>' "$slide_file" 2>/dev/null | sed 's/<[^>]*>//g' | head -1)
    
    if [ -n "$title" ] && [ "$title" != "" ]; then
        content_ok=1
    fi
    if [ -n "$content" ] && [ ${#content} -gt 50 ]; then
        content_ok=$((content_ok + 1))
    fi
    if echo "$content" | grep -qi "emagrecimento\|perda.*peso\|dieta\|exercício\|nutrição"; then
        content_ok=$((content_ok + 1))
    fi
    
    echo "   Slide $slide_num: UI=$ui_ok/2 | Conteúdo=$content_ok/3"
    if [ -n "$title" ]; then
        echo "      Título: \"${title:0:60}\""
    fi
    if [ -n "$content" ]; then
        echo "      Preview: \"${content:0:100}...\""
    fi
    
    return 0
}

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))
    echo ""
    echo "[CHECK #${ITERATION}] $(date '+%H:%M:%S')"
    echo "==========================================="
    
    # Verificar processo
    PROCESS_PID=$(pgrep -f "tsx.*cli.tsx" | head -1)
    if [ -z "$PROCESS_PID" ]; then
        echo "✅ Processo Flui finalizado"
    else
        echo "⚡ Processo ativo (PID: $PROCESS_PID)"
    fi
    
    # Verificar log
    if [ -f "$LOG_FILE" ]; then
        CURRENT_LOG_SIZE=$(wc -c < "$LOG_FILE" 2>/dev/null || echo "0")
        if [ "$CURRENT_LOG_SIZE" -gt "$LAST_LOG_SIZE" ]; then
            NEW_LINES=$(tail -c +$((LAST_LOG_SIZE + 1)) "$LOG_FILE" 2>/dev/null | wc -l)
            echo "📝 Novo conteúdo: $NEW_LINES linhas"
            LAST_LOG_SIZE=$CURRENT_LOG_SIZE
            
            # Analisar últimas linhas do log
            echo ""
            echo "📊 ÚLTIMAS AÇÕES NO LOG:"
            echo "-------------------------------------------"
            tail -20 "$LOG_FILE" 2>/dev/null | grep -E "(slide [0-9]+/20|PDF|PPTX|Completed|Error|success|Gerando conteúdo)" | tail -5
        fi
    fi
    
    # Verificar arquivos gerados
    echo ""
    echo "📁 ARQUIVOS GERADOS:"
    echo "-------------------------------------------"
    
    pdf_files=$(find "$WORK_DIR" -name "*.pdf" -type f 2>/dev/null | grep -v node_modules | head -3)
    pptx_files=$(find "$WORK_DIR" -name "*.pptx" -type f 2>/dev/null | grep -v node_modules | head -3)
    
    if [ -n "$pdf_files" ]; then
        echo "$pdf_files" | while read pdf; do
            if [ -n "$pdf" ]; then
                size=$(du -h "$pdf" 2>/dev/null | cut -f1)
                echo "   ✅ PDF: $(basename $pdf) ($size)"
            fi
        done
    else
        echo "   ⚠️  PDF ainda não criado"
    fi
    
    if [ -n "$pptx_files" ]; then
        echo "$pptx_files" | while read pptx; do
            if [ -n "$pptx" ]; then
                size=$(du -h "$pptx" 2>/dev/null | cut -f1)
                echo "   ✅ PPTX: $(basename $pptx) ($size)"
            fi
        done
    else
        echo "   ⚠️  PPTX ainda não criado"
    fi
    
    # Validar slides HTML
    echo ""
    echo "🎨 VALIDAÇÃO DE SLIDES:"
    echo "-------------------------------------------"
    
    if [ -d "$SLIDES_DIR" ]; then
        html_count=$(find "$SLIDES_DIR" -name "slide_*.html" -type f 2>/dev/null | wc -l)
        echo "   📄 Total de slides HTML: $html_count/20"
        
        if [ "$html_count" -gt 0 ]; then
            # Validar primeiros 5 slides
            validated=0
            for i in {1..5}; do
                slide_file="$SLIDES_DIR/slide_$(printf "%03d" $i).html"
                if [ -f "$slide_file" ]; then
                    validate_slide "$slide_file" "$i"
                    validated=$((validated + 1))
                fi
            done
            
            # Validar últimos 3 slides se houver mais de 5
            if [ "$html_count" -gt 5 ]; then
                for i in {18..20}; do
                    slide_file="$SLIDES_DIR/slide_$(printf "%03d" $i).html"
                    if [ -f "$slide_file" ]; then
                        validate_slide "$slide_file" "$i"
                    fi
                done
            fi
            
            echo ""
            echo "   ✅ $validated slides validados"
        else
            echo "   ⚠️  Slides ainda não criados"
        fi
    else
        echo "   ⚠️  Diretório de slides não encontrado: $SLIDES_DIR"
    fi
    
    # Verificar se completou
    if [ -n "$pdf_files" ] && [ "$html_count" -ge 20 ]; then
        echo ""
        echo "==========================================="
        echo "✅ TESTE COMPLETO!"
        echo "==========================================="
        echo "PDF: $pdf_files"
        echo "Slides HTML: $html_count"
        break
    fi
    
    # Verificar se processo terminou sem completar
    if [ -z "$PROCESS_PID" ] && [ "$html_count" -lt 20 ]; then
        echo ""
        echo "⚠️  Processo terminou mas slides incompletos ($html_count/20)"
        echo "Verificando log para erros..."
        tail -30 "$LOG_FILE" 2>/dev/null | grep -i "error\|failed\|exception" | tail -5
    fi
    
    sleep $CHECK_INTERVAL
done

echo ""
echo "Validação finalizada após $ITERATION iterações"
