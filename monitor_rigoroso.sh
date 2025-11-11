#!/bin/bash

LOG_FILE="/workspace/flui_output.log"
EBOOK_DIR="/workspace/work/ebook"
CHECK_INTERVAL=20
FAILED=false

echo "==========================================="
echo "MONITOR RIGOROSO - FLUI EBOOK TEST"
echo "==========================================="
echo "Verificando a cada ${CHECK_INTERVAL} segundos..."
echo ""

iteration=0

while true; do
    iteration=$((iteration + 1))
    echo ""
    echo "[CHECK #${iteration}] $(date '+%H:%M:%S')"
    echo "==========================================="
    
    # 1. VERIFICAR KANBAN
    echo ""
    echo "1. KANBAN STATUS:"
    echo "-------------------------------------------"
    if [ -f "$LOG_FILE" ]; then
        kanban_line=$(grep -E "KANBAN UPDATE|Received:|Planning:|Queue:|In Progress:|Review:|Completed:" "$LOG_FILE" | tail -1)
        if [ -n "$kanban_line" ]; then
            echo "   $kanban_line"
            received=$(echo "$kanban_line" | grep -oP 'Received: \K\d+' || echo "0")
            completed=$(echo "$kanban_line" | grep -oP 'Completed: \K\d+' || echo "0")
            in_progress=$(echo "$kanban_line" | grep -oP 'In Progress: \K\d+' || echo "0")
            echo "   📊 Completadas: $completed | Em progresso: $in_progress"
        fi
    fi
    
    # 2. VERIFICAR TOOL YOUTUBE
    echo ""
    echo "2. TOOL YOUTUBE:"
    echo "-------------------------------------------"
    youtube_used=$(grep -i "TOOL:.*search_youtube_comments\|> TOOL.*SEARCH_YOUTUBE" "$LOG_FILE" 2>/dev/null | grep -v "User Task" | wc -l)
    if [ "$youtube_used" -gt 0 ]; then
        echo "   ✅ Tool usada: $youtube_used vezes"
    else
        echo "   ❌ FALHA: Tool NÃO usada!"
        FAILED=true
    fi
    
    # 3. VERIFICAR ARQUIVOS
    echo ""
    echo "3. ARQUIVOS:"
    echo "-------------------------------------------"
    files_correct=$(find "$EBOOK_DIR" -name "pagina_*.md" -type f 2>/dev/null | wc -l)
    files_wrong=$(find /workspace -maxdepth 1 -name "pagina_*.md" -type f 2>/dev/null | wc -l)
    
    if [ "$files_correct" -gt 0 ]; then
        echo "   ✅ Em work/ebook/: $files_correct"
    fi
    
    if [ "$files_wrong" -gt 0 ]; then
        echo "   ❌ FALHA: $files_wrong arquivo(s) na raiz!"
        FAILED=true
    fi
    
    # Verificar palavras
    if [ "$files_correct" -gt 0 ]; then
        for file in $(find "$EBOOK_DIR" -name "pagina_*.md" -type f 2>/dev/null | sort); do
            words=$(wc -w < "$file" 2>/dev/null || echo "0")
            if [ "$words" -lt 700 ]; then
                echo "   ❌ $(basename $file): $words palavras (MIN: 700)"
                FAILED=true
            fi
        done
    fi
    
    # PARAR SE FALHAS
    if [ "$FAILED" = true ]; then
        echo ""
        echo "❌ FALHAS DETECTADAS! Parando..."
        pkill -f "tsx.*cli.tsx" 2>/dev/null
        exit 1
    fi
    
    if ! pgrep -f "tsx.*cli.tsx" > /dev/null; then
        echo "Processo finalizou"
        break
    fi
    
    sleep $CHECK_INTERVAL
done
