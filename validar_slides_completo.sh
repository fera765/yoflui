#!/bin/bash

LOG_FILE="/workspace/flui_output.log"
SLIDES_DIR="/workspace/work/slides"
WORK_DIR="/workspace/work"
CHECK_INTERVAL=30
ITERATION=0
LAST_LOG_SIZE=0

echo "==========================================="
echo "VALIDAÇÃO COMPLETA - EBOOK EMAGRECIMENTO"
echo "Verificando cada slide individualmente"
echo "==========================================="
echo ""

# Função para validar UI elegante de um slide
validate_slide_ui() {
    local slide_file="$1"
    local slide_num="$2"
    local issues=0
    
    echo "   📄 Slide $slide_num:"
    
    # Verificar se arquivo existe
    if [ ! -f "$slide_file" ]; then
        echo "      ❌ Arquivo não encontrado"
        return 1
    fi
    
    # 1. Verificar fontes elegantes
    has_inter=$(grep -c "Inter\|font-family.*Inter" "$slide_file" 2>/dev/null || echo "0")
    has_sf_pro=$(grep -c "SF Pro\|font-family.*SF" "$slide_file" 2>/dev/null || echo "0")
    if [ "$has_inter" -gt 0 ] || [ "$has_sf_pro" -gt 0 ]; then
        echo "      ✅ Fontes elegantes (Inter/SF Pro)"
    else
        echo "      ⚠️  Fontes podem não ser elegantes"
        issues=$((issues + 1))
    fi
    
    # 2. Verificar cores e tema
    has_colors=$(grep -c "color\|background\|#000000\|#FFFFFF" "$slide_file" 2>/dev/null || echo "0")
    if [ "$has_colors" -gt 3 ]; then
        echo "      ✅ Paleta de cores definida"
    else
        echo "      ⚠️  Paleta de cores pode estar incompleta"
        issues=$((issues + 1))
    fi
    
    # 3. Verificar layout responsivo
    has_viewport=$(grep -c "1280\|720\|width\|height" "$slide_file" 2>/dev/null || echo "0")
    if [ "$has_viewport" -gt 2 ]; then
        echo "      ✅ Layout responsivo (1280x720)"
    else
        echo "      ⚠️  Layout pode não ser responsivo"
        issues=$((issues + 1))
    fi
    
    # 4. Verificar elementos visuais
    has_circle=$(grep -c "circle\|border-radius" "$slide_file" 2>/dev/null || echo "0")
    has_styles=$(grep -c "style\|css\|tailwind" "$slide_file" 2>/dev/null || echo "0")
    if [ "$has_styles" -gt 5 ]; then
        echo "      ✅ Estilos CSS bem estruturados"
    else
        echo "      ⚠️  Estilos podem estar incompletos"
        issues=$((issues + 1))
    fi
    
    # 5. Verificar numeração de slide
    has_number=$(grep -c "slide-number\|slideNumber\|/ 20\|/ 19\|/ 18" "$slide_file" 2>/dev/null || echo "0")
    if [ "$has_number" -gt 0 ]; then
        echo "      ✅ Numeração de slide presente"
    else
        echo "      ⚠️  Numeração de slide ausente"
        issues=$((issues + 1))
    fi
    
    return $issues
}

# Função para validar conteúdo de um slide
validate_slide_content() {
    local slide_file="$1"
    local slide_num="$2"
    local issues=0
    
    # Extrair título
    title=$(grep -oP '<h1[^>]*>([^<]+)</h1>' "$slide_file" 2>/dev/null | sed 's/<[^>]*>//g' | head -1)
    
    # Extrair conteúdo
    content=$(grep -oP '<div[^>]*class="content-text"[^>]*>([\s\S]*?)</div>' "$slide_file" 2>/dev/null | sed 's/<[^>]*>//g' | head -1)
    
    echo "   📝 Conteúdo Slide $slide_num:"
    
    # Verificar se tem título
    if [ -n "$title" ] && [ "$title" != "" ]; then
        echo "      ✅ Título: \"$title\""
        
        # Verificar se título não é genérico
        if echo "$title" | grep -qi "Página [0-9]\|Page [0-9]\|Slide [0-9]"; then
            echo "      ⚠️  Título genérico detectado"
            issues=$((issues + 1))
        fi
    else
        echo "      ❌ Título ausente"
        issues=$((issues + 1))
    fi
    
    # Verificar se tem conteúdo
    if [ -n "$content" ] && [ "$content" != "" ]; then
        content_length=${#content}
        echo "      ✅ Conteúdo presente ($content_length caracteres)"
        
        # Verificar se conteúdo não é placeholder
        if echo "$content" | grep -qi "será gerado\|placeholder\|exemplo.*genérico\|mock\|Conteúdo sobre.*relacionado"; then
            echo "      ❌ Conteúdo placeholder detectado"
            echo "      📄 Texto: \"${content:0:100}...\""
            issues=$((issues + 1))
        else
            # Verificar se conteúdo é sobre emagrecimento
            if echo "$content" | grep -qi "emagrecimento\|perda.*peso\|dieta\|exercício\|nutrição\|saudável\|calorias\|metabolismo"; then
                echo "      ✅ Conteúdo relacionado a emagrecimento"
                echo "      📄 Preview: \"${content:0:150}...\""
            else
                echo "      ⚠️  Conteúdo pode não estar relacionado a emagrecimento"
                echo "      📄 Preview: \"${content:0:150}...\""
                issues=$((issues + 1))
            fi
        fi
        
        # Verificar tamanho mínimo do conteúdo
        if [ "$content_length" -lt 50 ]; then
            echo "      ⚠️  Conteúdo muito curto (mínimo recomendado: 50 caracteres)"
            issues=$((issues + 1))
        fi
    else
        echo "      ❌ Conteúdo ausente"
        issues=$((issues + 1))
    fi
    
    return $issues
}

# Função para validar todos os slides
validate_all_slides() {
    local slides_dir="$1"
    local total_issues=0
    local total_slides=0
    local valid_slides=0
    
    echo ""
    echo "==========================================="
    echo "VALIDAÇÃO DETALHADA DE CADA SLIDE"
    echo "==========================================="
    echo ""
    
    if [ ! -d "$slides_dir" ]; then
        echo "❌ Diretório de slides não encontrado: $slides_dir"
        return 1
    fi
    
    # Encontrar todos os slides HTML
    slides=$(find "$slides_dir" -name "slide_*.html" -type f 2>/dev/null | sort)
    
    if [ -z "$slides" ]; then
        echo "⚠️  Nenhum slide HTML encontrado ainda"
        return 1
    fi
    
    echo "$slides" | while read slide_file; do
        if [ -n "$slide_file" ]; then
            total_slides=$((total_slides + 1))
            slide_num=$(basename "$slide_file" | grep -oP 'slide_\K\d+' | head -1)
            
            echo "-------------------------------------------"
            echo "Slide $slide_num: $(basename $slide_file)"
            echo "-------------------------------------------"
            
            # Validar UI
            validate_slide_ui "$slide_file" "$slide_num"
            ui_issues=$?
            
            # Validar conteúdo
            validate_slide_content "$slide_file" "$slide_num"
            content_issues=$?
            
            total_slide_issues=$((ui_issues + content_issues))
            
            if [ "$total_slide_issues" -eq 0 ]; then
                echo "   ✅ Slide $slide_num: VALIDADO"
                valid_slides=$((valid_slides + 1))
            else
                echo "   ⚠️  Slide $slide_num: $total_slide_issues problema(s) detectado(s)"
            fi
            
            echo ""
        fi
    done
    
    echo "==========================================="
    echo "RESUMO DA VALIDAÇÃO"
    echo "==========================================="
    echo "Total de slides encontrados: $total_slides"
    echo "Slides válidos: $valid_slides"
    echo "Slides com problemas: $((total_slides - valid_slides))"
    echo ""
}

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
    
    # 2. ARQUIVOS GERADOS
    echo ""
    echo "2. ARQUIVOS GERADOS:"
    echo "-------------------------------------------"
    
    pdf_files=$(find "$WORK_DIR" -name "*.pdf" -type f 2>/dev/null | grep -i emagrecimento)
    pptx_files=$(find "$WORK_DIR" -name "*.pptx" -type f 2>/dev/null | grep -i emagrecimento)
    
    if [ -n "$pdf_files" ]; then
        echo "   ✅ PDF encontrado: $(basename $pdf_files)"
        ls -lh "$pdf_files" 2>/dev/null | awk '{print "      Tamanho: " $5}'
    else
        echo "   ⚠️  PDF ainda não criado"
    fi
    
    if [ -n "$pptx_files" ]; then
        echo "   ✅ PPTX encontrado: $(basename $pptx_files)"
        ls -lh "$pptx_files" 2>/dev/null | awk '{print "      Tamanho: " $5}'
    else
        echo "   ⚠️  PPTX ainda não criado"
    fi
    
    # 3. VALIDAÇÃO DETALHADA DOS SLIDES
    slides_dir=$(find "$SLIDES_DIR" -type d -name "*Emagrecimento*" 2>/dev/null | head -1)
    if [ -n "$slides_dir" ]; then
        html_count=$(find "$slides_dir" -name "*.html" -type f 2>/dev/null | wc -l)
        echo ""
        echo "3. SLIDES HTML:"
        echo "-------------------------------------------"
        echo "   ✅ Diretório: $slides_dir"
        echo "   📄 Total de slides: $html_count"
        
        # Validar todos os slides se houver pelo menos 5
        if [ "$html_count" -ge 5 ]; then
            validate_all_slides "$slides_dir"
        elif [ "$html_count" -gt 0 ]; then
            echo "   ⚠️  Ainda gerando slides ($html_count/$20)..."
        fi
    else
        echo ""
        echo "3. SLIDES HTML:"
        echo "-------------------------------------------"
        echo "   ⚠️  Diretório de slides ainda não criado"
    fi
    
    # 4. ÚLTIMAS AÇÕES
    echo ""
    echo "4. ÚLTIMAS AÇÕES NO LOG:"
    echo "-------------------------------------------"
    tail -10 "$LOG_FILE" 2>/dev/null | grep -E "(TOOL:|SLIDE|PDF|PPTX|KANBAN|Completed|Error)" | tail -5 || tail -3 "$LOG_FILE"
    
    # 5. VERIFICAR SE COMPLETOU
    if [ -n "$pdf_files" ] && [ -n "$pptx_files" ]; then
        html_count=$(find "$slides_dir" -name "*.html" -type f 2>/dev/null | wc -l)
        if [ "$html_count" -ge 15 ]; then
            echo ""
            echo "==========================================="
            echo "✅ ARQUIVOS GERADOS COM SUCESSO!"
            echo "==========================================="
            echo "PDF: $pdf_files"
            echo "PPTX: $pptx_files"
            echo "Slides HTML: $html_count"
            echo ""
            echo "Executando validação final completa..."
            validate_all_slides "$slides_dir"
            break
        fi
    fi
    
    # Verificar se processo terminou sem gerar arquivos
    if [ -z "$PROCESS_PID" ] && [ -z "$pdf_files" ] && [ -z "$pptx_files" ]; then
        echo ""
        echo "==========================================="
        echo "⚠️  PROCESSO TERMINOU SEM GERAR ARQUIVOS"
        echo "==========================================="
        tail -30 "$LOG_FILE" 2>/dev/null
        break
    fi
    
    sleep $CHECK_INTERVAL
done

echo ""
echo "Validação finalizada"
