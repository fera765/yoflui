#!/bin/bash

LOG_FILE="/workspace/flui_output.log"
SLIDES_DIR="/workspace/work/slides"
WORK_DIR="/workspace/work"
CHECK_INTERVAL=30
ITERATION=0
LAST_LOG_SIZE=0

echo "==========================================="
echo "MONITOR EBOOK EMAGRECIMENTO - PDF/PPTX"
echo "Verificando a cada ${CHECK_INTERVAL} segundos"
echo "==========================================="
echo ""

while true; do
    ITERATION=$((ITERATION + 1))
    echo ""
    echo "[CHECK #${ITERATION}] $(date '+%H:%M:%S')"
    echo "==========================================="
    
    # Verificar se processo está rodando
    PROCESS_PID=$(pgrep -f "tsx.*cli.tsx" | head -1)
    if [ -z "$PROCESS_PID" ]; then
        echo "⚠️  Processo Flui não está rodando!"
        echo "Verificando se completou..."
    else
        echo "✅ Processo ativo (PID: $PROCESS_PID)"
    fi
    
    # Verificar tamanho do log
    CURRENT_LOG_SIZE=$(wc -c < "$LOG_FILE" 2>/dev/null || echo "0")
    if [ "$CURRENT_LOG_SIZE" -gt "$LAST_LOG_SIZE" ]; then
        NEW_LINES=$(tail -c +$((LAST_LOG_SIZE + 1)) "$LOG_FILE" 2>/dev/null | wc -l)
        echo "📝 Novo conteúdo no log: $NEW_LINES linhas"
        LAST_LOG_SIZE=$CURRENT_LOG_SIZE
    fi
    
    # 1. KANBAN STATUS
    echo ""
    echo "1. KANBAN STATUS:"
    echo "-------------------------------------------"
    if [ -f "$LOG_FILE" ]; then
        kanban_line=$(grep -E "KANBAN UPDATE|Completed:|In Progress:" "$LOG_FILE" | tail -1)
        if [ -n "$kanban_line" ]; then
            echo "   $kanban_line"
            completed=$(echo "$kanban_line" | grep -oP 'Completed: \K\d+' || echo "0")
            in_progress=$(echo "$kanban_line" | grep -oP 'In Progress: \K\d+' || echo "0")
            echo "   ✅ Completadas: $completed | ⚡ Em progresso: $in_progress"
        fi
    fi
    
    # 2. TOOL SLIDE_PDF
    echo ""
    echo "2. TOOL SLIDE_PDF:"
    echo "-------------------------------------------"
    slide_tool_used=$(grep -i "TOOL:.*SLIDE_PDF\|slide_pdf" "$LOG_FILE" 2>/dev/null | wc -l)
    if [ "$slide_tool_used" -gt 0 ]; then
        echo "   ✅ Tool usada: $slide_tool_used vezes"
        
        # Verificar erros de quota
        quota_errors=$(grep -i "quota exceeded\|429" "$LOG_FILE" 2>/dev/null | wc -l)
        if [ "$quota_errors" -gt 0 ]; then
            echo "   ⚠️  Erros de quota: $quota_errors"
        fi
    else
        echo "   ⚠️  Tool ainda não usada"
    fi
    
    # 3. ARQUIVOS GERADOS
    echo ""
    echo "3. ARQUIVOS GERADOS:"
    echo "-------------------------------------------"
    
    # PDFs
    pdf_files=$(find "$WORK_DIR" -name "*.pdf" -type f 2>/dev/null)
    pdf_count=$(echo "$pdf_files" | grep -c . || echo "0")
    if [ "$pdf_count" -gt 0 ]; then
        echo "   ✅ PDFs encontrados: $pdf_count"
        echo "$pdf_files" | while read pdf; do
            if [ -n "$pdf" ]; then
                size=$(du -h "$pdf" 2>/dev/null | cut -f1)
                echo "      - $(basename $pdf): $size"
            fi
        done
    else
        echo "   ⚠️  PDFs ainda não criados"
    fi
    
    # PPTX
    pptx_files=$(find "$WORK_DIR" -name "*.pptx" -type f 2>/dev/null)
    pptx_count=$(echo "$pptx_files" | grep -c . || echo "0")
    if [ "$pptx_count" -gt 0 ]; then
        echo "   ✅ PPTX encontrados: $pptx_count"
        echo "$pptx_files" | while read pptx; do
            if [ -n "$pptx" ]; then
                size=$(du -h "$pptx" 2>/dev/null | cut -f1)
                echo "      - $(basename $pptx): $size"
            fi
        done
    else
        echo "   ⚠️  PPTX ainda não criados"
    fi
    
    # HTML Slides
    html_slides=$(find "$SLIDES_DIR" -name "*.html" -type f 2>/dev/null | wc -l)
    if [ "$html_slides" -gt 0 ]; then
        echo "   ✅ HTML slides: $html_slides arquivos"
        
        # Analisar primeiro slide
        first_slide=$(find "$SLIDES_DIR" -name "*.html" -type f 2>/dev/null | sort | head -1)
        if [ -n "$first_slide" ] && [ -f "$first_slide" ]; then
            echo "   📄 Analisando primeiro slide:"
            
            # Verificar estrutura
            has_title=$(grep -c "<h1\|class=\"title\"" "$first_slide" 2>/dev/null || echo "0")
            has_content=$(grep -c "content-text\|content" "$first_slide" 2>/dev/null || echo "0")
            has_styles=$(grep -c "style\|css\|tailwind" "$first_slide" 2>/dev/null || echo "0")
            
            echo "      - Títulos: $has_title"
            echo "      - Conteúdo: $has_content"
            echo "      - Estilos: $has_styles"
            
            # Verificar UI elegante
            has_colors=$(grep -c "color\|background\|theme" "$first_slide" 2>/dev/null || echo "0")
            has_fonts=$(grep -c "font-family\|font-size" "$first_slide" 2>/dev/null || echo "0")
            
            if [ "$has_colors" -gt 0 ] && [ "$has_fonts" -gt 0 ]; then
                echo "      ✅ UI elegante detectada"
            else
                echo "      ⚠️  UI pode estar incompleta"
            fi
            
            # Verificar conteúdo placeholder
            if grep -qi "será gerado\|placeholder\|exemplo.*genérico\|mock" "$first_slide" 2>/dev/null; then
                echo "      ⚠️  Possível conteúdo placeholder"
            else
                echo "      ✅ Conteúdo real detectado"
            fi
            
            # Mostrar preview do conteúdo
            echo "      📝 Preview do título:"
            grep -oP '<h1[^>]*>([^<]+)</h1>' "$first_slide" 2>/dev/null | head -1 | sed 's/^/         /' || echo "         (não encontrado)"
        fi
    else
        echo "   ⚠️  HTML slides ainda não criados"
    fi
    
    # 4. QUALIDADE E CONFORMIDADE
    echo ""
    echo "4. QUALIDADE E CONFORMIDADE:"
    echo "-------------------------------------------"
    
    # Verificar se conteúdo é sobre emagrecimento
    if [ -n "$first_slide" ] && [ -f "$first_slide" ]; then
        content_text=$(grep -oP '<div[^>]*class="content-text"[^>]*>([\s\S]*?)</div>' "$first_slide" 2>/dev/null | head -1)
        if echo "$content_text" | grep -qi "emagrecimento\|perda.*peso\|dieta\|exercício\|nutrição\|saudável"; then
            echo "   ✅ Conteúdo sobre emagrecimento detectado"
        else
            echo "   ⚠️  Conteúdo pode não estar relacionado a emagrecimento"
        fi
    fi
    
    # Verificar erros no log
    recent_errors=$(grep -i "error\|failed\|falha\|exception" "$LOG_FILE" 2>/dev/null | tail -3)
    if [ -n "$recent_errors" ]; then
        echo "   ⚠️  Erros recentes detectados:"
        echo "$recent_errors" | head -2 | sed 's/^/      /'
    else
        echo "   ✅ Sem erros recentes"
    fi
    
    # 5. ÚLTIMAS AÇÕES
    echo ""
    echo "5. ÚLTIMAS AÇÕES NO LOG:"
    echo "-------------------------------------------"
    tail -10 "$LOG_FILE" 2>/dev/null | grep -E "(TOOL:|SLIDE|PDF|PPTX|KANBAN|Completed|Error)" | tail -5 || tail -3 "$LOG_FILE"
    
    # 6. VERIFICAR SE COMPLETOU
    if [ "$pdf_count" -gt 0 ] && [ "$pptx_count" -gt 0 ]; then
        echo ""
        echo "==========================================="
        echo "✅ ARQUIVOS GERADOS COM SUCESSO!"
        echo "==========================================="
        echo "PDFs:"
        echo "$pdf_files" | sed 's/^/   - /'
        echo "PPTX:"
        echo "$pptx_files" | sed 's/^/   - /'
        break
    fi
    
    # Verificar se processo terminou sem gerar arquivos
    if [ -z "$PROCESS_PID" ] && [ "$pdf_count" -eq 0 ] && [ "$pptx_count" -eq 0 ]; then
        echo ""
        echo "==========================================="
        echo "⚠️  PROCESSO TERMINOU SEM GERAR ARQUIVOS"
        echo "==========================================="
        echo "Verificando últimas linhas do log..."
        tail -20 "$LOG_FILE" 2>/dev/null
        break
    fi
    
    sleep $CHECK_INTERVAL
done

echo ""
echo "Monitoramento finalizado"
