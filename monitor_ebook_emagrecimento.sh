#!/bin/bash

LOG_FILE="/workspace/flui_output.log"
SLIDES_DIR="/workspace/work/slides"
PDF_FILE=""
PPTX_FILE=""
CHECK_INTERVAL=30
ITERATION=0
LAST_LOG_SIZE=0
ERRORS_DETECTED=0
PROCESS_PID=""

echo "==========================================="
echo "MONITOR EBOOK EMAGRECIMENTO - PDF/PPTX"
echo "==========================================="
echo "Verificando logs e conteúdo a cada ${CHECK_INTERVAL} segundos..."
echo ""

# Função para analisar qualidade do conteúdo
analyze_content_quality() {
    local file="$1"
    local file_type="$2"
    
    if [ ! -f "$file" ]; then
        echo "   ⚠️  Arquivo não encontrado: $file"
        return 1
    fi
    
    echo "   📊 Análise de qualidade ($file_type):"
    
    # Tamanho do arquivo
    file_size=$(wc -c < "$file" 2>/dev/null || echo "0")
    echo "      - Tamanho: $file_size bytes"
    
    if [ "$file_type" = "HTML" ]; then
        # Para HTML: verificar estrutura, conteúdo, UI
        has_title=$(grep -c "<h1\|class=\"title\"" "$file" 2>/dev/null || echo "0")
        has_content=$(grep -c "content-text\|content" "$file" 2>/dev/null || echo "0")
        has_styles=$(grep -c "style\|css\|tailwind" "$file" 2>/dev/null || echo "0")
        
        echo "      - Títulos: $has_title"
        echo "      - Conteúdo: $has_content"
        echo "      - Estilos: $has_styles"
        
        # Verificar se tem conteúdo real (não apenas placeholders)
        if grep -qi "será gerado\|placeholder\|exemplo\|mock" "$file" 2>/dev/null; then
            echo "      ⚠️  Possível conteúdo placeholder detectado"
            return 1
        fi
        
        # Verificar UI elegante (cores, fontes, layout)
        has_colors=$(grep -c "color\|background\|theme" "$file" 2>/dev/null || echo "0")
        has_fonts=$(grep -c "font-family\|font-size" "$file" 2>/dev/null || echo "0")
        
        if [ "$has_colors" -gt 0 ] && [ "$has_fonts" -gt 0 ]; then
            echo "      ✅ UI elegante detectada (cores e fontes)"
        else
            echo "      ⚠️  UI pode estar incompleta"
        fi
        
    elif [ "$file_type" = "PDF" ]; then
        # Para PDF: verificar se é válido
        if file "$file" | grep -qi "PDF"; then
            echo "      ✅ Arquivo PDF válido"
            # Tentar contar páginas (se pdfinfo estiver disponível)
            if command -v pdfinfo &> /dev/null; then
                pages=$(pdfinfo "$file" 2>/dev/null | grep "Pages:" | awk '{print $2}' || echo "?")
                echo "      - Páginas: $pages"
            fi
        else
            echo "      ❌ Arquivo não é um PDF válido"
            return 1
        fi
        
    elif [ "$file_type" = "PPTX" ]; then
        # Para PPTX: verificar se é válido (ZIP com estrutura PPTX)
        if file "$file" | grep -qi "Zip\|Microsoft\|PowerPoint"; then
            echo "      ✅ Arquivo PPTX válido"
            # Tentar contar slides (descompactar e contar)
            if command -v unzip &> /dev/null; then
                temp_dir=$(mktemp -d)
                unzip -q "$file" -d "$temp_dir" 2>/dev/null
                slides=$(find "$temp_dir/ppt/slides" -name "slide*.xml" 2>/dev/null | wc -l || echo "0")
                rm -rf "$temp_dir"
                echo "      - Slides: $slides"
            fi
        else
            echo "      ❌ Arquivo não é um PPTX válido"
            return 1
        fi
    fi
    
    return 0
}

# Função para verificar conformidade
check_compliance() {
    local compliance_issues=0
    
    echo "   🔍 Verificação de conformidade:"
    
    # Verificar se arquivos foram criados nos locais corretos
    if [ -n "$PDF_FILE" ] && [ ! -f "$PDF_FILE" ]; then
        echo "      ❌ PDF não encontrado no caminho esperado"
        compliance_issues=$((compliance_issues + 1))
    fi
    
    if [ -n "$PPTX_FILE" ] && [ ! -f "$PPTX_FILE" ]; then
        echo "      ❌ PPTX não encontrado no caminho esperado"
        compliance_issues=$((compliance_issues + 1))
    fi
    
    # Verificar se o conteúdo é sobre emagrecimento
    if [ -f "$PDF_FILE" ]; then
        # Tentar extrair texto do PDF (se pdftotext estiver disponível)
        if command -v pdftotext &> /dev/null; then
            temp_txt=$(mktemp)
            pdftotext "$PDF_FILE" "$temp_txt" 2>/dev/null
            if grep -qi "emagrecimento\|perda.*peso\|dieta\|exercício\|nutrição\|saudável" "$temp_txt" 2>/dev/null; then
                echo "      ✅ Conteúdo sobre emagrecimento detectado"
            else
                echo "      ⚠️  Conteúdo pode não estar relacionado a emagrecimento"
                compliance_issues=$((compliance_issues + 1))
            fi
            rm -f "$temp_txt"
        fi
    fi
    
    return $compliance_issues
}

# Função para investigar problemas
investigate_issues() {
    echo "   🔍 Investigando problemas..."
    
    # Verificar erros no log
    errors=$(grep -i "error\|failed\|falha\|exception" "$LOG_FILE" 2>/dev/null | tail -5)
    if [ -n "$errors" ]; then
        echo "      ⚠️  Erros detectados no log:"
        echo "$errors" | head -3 | sed 's/^/         /'
    fi
    
    # Verificar se processo está travado
    if [ -n "$PROCESS_PID" ]; then
        if ! ps -p "$PROCESS_PID" > /dev/null 2>&1; then
            echo "      ❌ Processo não está mais rodando!"
            return 1
        fi
        
        # Verificar se processo está consumindo CPU (não travado)
        cpu_usage=$(ps -p "$PROCESS_PID" -o %cpu --no-headers 2>/dev/null | tr -d ' ' || echo "0")
        if [ "$(echo "$cpu_usage > 0" | bc 2>/dev/null || echo "0")" = "1" ]; then
            echo "      ✅ Processo ativo (CPU: ${cpu_usage}%)"
        else
            echo "      ⚠️  Processo pode estar travado (CPU: ${cpu_usage}%)"
        fi
    fi
    
    # Verificar última atividade no log
    last_activity=$(stat -c %Y "$LOG_FILE" 2>/dev/null || echo "0")
    current_time=$(date +%s)
    time_since_activity=$((current_time - last_activity))
    
    if [ "$time_since_activity" -gt 120 ]; then
        echo "      ⚠️  Sem atividade no log há ${time_since_activity}s (possível travamento)"
        return 1
    else
        echo "      ✅ Atividade recente no log (${time_since_activity}s atrás)"
    fi
    
    return 0
}

while true; do
    ITERATION=$((ITERATION + 1))
    echo ""
    echo "[CHECK #${ITERATION}] $(date '+%H:%M:%S')"
    echo "==========================================="
    
    # Verificar se processo está rodando
    if [ -z "$PROCESS_PID" ] || ! ps -p "$PROCESS_PID" > /dev/null 2>&1; then
        PROCESS_PID=$(pgrep -f "tsx.*cli.tsx" | head -1)
        if [ -z "$PROCESS_PID" ]; then
            echo "⚠️  Processo Flui não está rodando!"
            break
        else
            echo "✅ Processo encontrado (PID: $PROCESS_PID)"
        fi
    fi
    
    # Verificar tamanho do log (novo conteúdo)
    CURRENT_LOG_SIZE=$(wc -c < "$LOG_FILE" 2>/dev/null || echo "0")
    if [ "$CURRENT_LOG_SIZE" -gt "$LAST_LOG_SIZE" ]; then
        NEW_LINES=$(tail -c +$((LAST_LOG_SIZE + 1)) "$LOG_FILE" 2>/dev/null | wc -l)
        echo "📝 Novo conteúdo no log: $NEW_LINES linhas"
        LAST_LOG_SIZE=$CURRENT_LOG_SIZE
    fi
    
    # 1. VERIFICAR KANBAN
    echo ""
    echo "1. KANBAN STATUS:"
    echo "-------------------------------------------"
    if [ -f "$LOG_FILE" ]; then
        kanban_line=$(grep -E "KANBAN UPDATE|Received:|Planning:|Queue:|In Progress:|Review:|Completed:" "$LOG_FILE" | tail -1)
        if [ -n "$kanban_line" ]; then
            echo "   $kanban_line"
            completed=$(echo "$kanban_line" | grep -oP 'Completed: \K\d+' || echo "0")
            in_progress=$(echo "$kanban_line" | grep -oP 'In Progress: \K\d+' || echo "0")
            echo "   ✅ Completadas: $completed | ⚡ Em progresso: $in_progress"
        fi
    fi
    
    # 2. VERIFICAR TOOL SLIDE_PDF
    echo ""
    echo "2. TOOL SLIDE_PDF:"
    echo "-------------------------------------------"
    slide_tool_used=$(grep -i "TOOL:.*SLIDE_PDF\|slide_pdf" "$LOG_FILE" 2>/dev/null | wc -l)
    if [ "$slide_tool_used" -gt 0 ]; then
        echo "   ✅ Tool usada: $slide_tool_used vezes"
        
        # Extrair caminhos dos arquivos gerados
        pdf_path=$(grep -i "PDF criado\|pdf.*path\|\.pdf" "$LOG_FILE" 2>/dev/null | tail -1 | grep -oP '/[^\s]+\.pdf' | head -1 || echo "")
        pptx_path=$(grep -i "PowerPoint criado\|pptx.*path\|\.pptx" "$LOG_FILE" 2>/dev/null | tail -1 | grep -oP '/[^\s]+\.pptx' | head -1 || echo "")
        
        if [ -n "$pdf_path" ]; then
            PDF_FILE="$pdf_path"
            echo "   📄 PDF detectado: $PDF_FILE"
        fi
        
        if [ -n "$pptx_path" ]; then
            PPTX_FILE="$pptx_path"
            echo "   📊 PPTX detectado: $PPTX_FILE"
        fi
    else
        echo "   ⚠️  Tool ainda não usada"
    fi
    
    # 3. VERIFICAR ARQUIVOS GERADOS
    echo ""
    echo "3. ARQUIVOS GERADOS:"
    echo "-------------------------------------------"
    
    # Procurar PDFs e PPTX em work/
    if [ -d "/workspace/work" ]; then
        found_pdfs=$(find /workspace/work -name "*.pdf" -type f 2>/dev/null | head -1)
        found_pptx=$(find /workspace/work -name "*.pptx" -type f 2>/dev/null | head -1)
        
        if [ -n "$found_pdfs" ]; then
            PDF_FILE="$found_pdfs"
            echo "   ✅ PDF encontrado: $PDF_FILE"
            analyze_content_quality "$PDF_FILE" "PDF"
        else
            echo "   ⚠️  PDF ainda não criado"
        fi
        
        if [ -n "$found_pptx" ]; then
            PPTX_FILE="$found_pptx"
            echo "   ✅ PPTX encontrado: $PPTX_FILE"
            analyze_content_quality "$PPTX_FILE" "PPTX"
        else
            echo "   ⚠️  PPTX ainda não criado"
        fi
        
        # Verificar HTMLs dos slides
        html_slides=$(find "$SLIDES_DIR" -name "*.html" -type f 2>/dev/null | wc -l)
        if [ "$html_slides" -gt 0 ]; then
            echo "   ✅ HTML slides: $html_slides arquivos"
            # Analisar primeiro slide como exemplo
            first_slide=$(find "$SLIDES_DIR" -name "*.html" -type f 2>/dev/null | sort | head -1)
            if [ -n "$first_slide" ]; then
                echo "   📄 Analisando primeiro slide:"
                analyze_content_quality "$first_slide" "HTML"
            fi
        else
            echo "   ⚠️  HTML slides ainda não criados"
        fi
    fi
    
    # 4. VERIFICAR CONFORMIDADE
    echo ""
    echo "4. CONFORMIDADE:"
    echo "-------------------------------------------"
    check_compliance
    compliance_result=$?
    
    # 5. INVESTIGAR PROBLEMAS
    echo ""
    echo "5. INVESTIGAÇÃO:"
    echo "-------------------------------------------"
    investigate_issues
    investigation_result=$?
    
    if [ $investigation_result -ne 0 ]; then
        ERRORS_DETECTED=$((ERRORS_DETECTED + 1))
        echo "   ⚠️  Problemas detectados na investigação"
    fi
    
    # 6. VERIFICAR ÚLTIMAS AÇÕES NO LOG
    echo ""
    echo "6. ÚLTIMAS AÇÕES NO LOG:"
    echo "-------------------------------------------"
    tail -15 "$LOG_FILE" 2>/dev/null | grep -E "(TOOL:|SLIDE|PDF|PPTX|KANBAN|Error|Completed)" | tail -5 || tail -3 "$LOG_FILE"
    
    # 7. VERIFICAR SE COMPLETOU
    if [ -f "$PDF_FILE" ] && [ -f "$PPTX_FILE" ]; then
        echo ""
        echo "==========================================="
        echo "✅ ARQUIVOS GERADOS COM SUCESSO!"
        echo "==========================================="
        echo "PDF: $PDF_FILE"
        echo "PPTX: $PPTX_FILE"
        
        # Verificação final de qualidade
        echo ""
        echo "Verificação final de qualidade:"
        analyze_content_quality "$PDF_FILE" "PDF"
        analyze_content_quality "$PPTX_FILE" "PPTX"
        
        break
    fi
    
    # Verificar se há muitos erros
    if [ "$ERRORS_DETECTED" -gt 5 ]; then
        echo ""
        echo "==========================================="
        echo "❌ MUITOS ERROS DETECTADOS: $ERRORS_DETECTED"
        echo "==========================================="
        echo "Parando monitoramento..."
        break
    fi
    
    sleep $CHECK_INTERVAL
done

echo ""
echo "Monitoramento finalizado"
