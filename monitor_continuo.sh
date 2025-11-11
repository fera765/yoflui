#!/bin/bash

LOG_FILE="/workspace/flui_output.log"
EBOOK_DIR="/workspace/work/ebook"
CHECK_INTERVAL=20
ITERATION=0
LAST_LOG_SIZE=0

echo "==========================================="
echo "MONITOR CONTÍNUO COM CORREÇÃO EM TEMPO REAL"
echo "==========================================="
echo "Verificando a cada ${CHECK_INTERVAL} segundos..."
echo ""

while true; do
    ITERATION=$((ITERATION + 1))
    echo ""
    echo "[CHECK #${ITERATION}] $(date '+%H:%M:%S')"
    echo "==========================================="
    
    # Verificar se processo está rodando
    if ! pgrep -f "tsx.*cli.tsx" > /dev/null; then
        echo "⚠️  Processo Flui não está rodando!"
        echo "Reiniciando..."
        cd /workspace && PROMPT="Crie um ebook completo sobre 'A mecânica das emoções - Conversando com emocional de uma mulher'. REGRAS CRÍTICAS: 1) PRIMEIRO use a tool search_youtube_comments com query EXATA 'mecânica das emoções mulher emocional relacionamento' para coletar dados reais. 2) Crie exatamente 30 páginas em work/ebook/pagina_01.md até pagina_30.md - use EXATAMENTE esse caminho. 3) Cada página deve ter MÍNIMO 700 palavras - valide antes de salvar. 4) Use os dados do YouTube coletados - mencione comentários e dores reais. 5) NÃO use mocks ou conteúdo genérico. ORDEM: search_youtube_comments PRIMEIRO com query 'mecânica das emoções mulher emocional relacionamento', depois analise dados, depois escreva páginas validando 700+ palavras cada em work/ebook/pagina_XX.md." && ./node_modules/.bin/tsx source/cli.tsx --prompt "$PROMPT" > flui_output.log 2>&1 &
        sleep 5
        continue
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
    
    # 2. VERIFICAR TOOL YOUTUBE E QUERY
    echo ""
    echo "2. TOOL YOUTUBE:"
    echo "-------------------------------------------"
    youtube_used=$(grep -i "TOOL:.*SEARCH_YOUTUBE_COMMENTS" "$LOG_FILE" 2>/dev/null | grep -v "User Task" | wc -l)
    if [ "$youtube_used" -gt 0 ]; then
        echo "   ✅ Tool usada: $youtube_used vezes"
        
        # Verificar query usada
        last_query=$(grep -i "TOOL:.*SEARCH_YOUTUBE_COMMENTS" "$LOG_FILE" | tail -1 | grep -oP 'query.*?}' | head -1)
        if echo "$last_query" | grep -qi "mecânica.*emoções\|emoções.*mulher"; then
            echo "   ✅ Query correta detectada"
        else
            echo "   ❌ Query incorreta: $last_query"
            echo "   ⚠️  CORREÇÃO NECESSÁRIA: Query deve ser 'mecânica das emoções mulher emocional relacionamento'"
        fi
    else
        echo "   ⚠️  Tool ainda não usada"
    fi
    
    # 3. VERIFICAR ARQUIVOS
    echo ""
    echo "3. ARQUIVOS CRIADOS:"
    echo "-------------------------------------------"
    files_correct=$(find "$EBOOK_DIR" -name "pagina_*.md" -type f 2>/dev/null | wc -l)
    files_wrong=$(find /workspace -maxdepth 1 -name "pagina_*.md" -type f 2>/dev/null | wc -l)
    files_wrong_project=$(find /workspace/work/project -name "*.md" -type f 2>/dev/null 2>/dev/null | wc -l)
    
    if [ "$files_correct" -gt 0 ]; then
        echo "   ✅ Arquivos em work/ebook/: $files_correct"
        echo ""
        echo "   📊 Análise de palavras:"
        for file in $(find "$EBOOK_DIR" -name "pagina_*.md" -type f 2>/dev/null | sort | tail -5); do
            words=$(wc -w < "$file" 2>/dev/null || echo "0")
            if [ "$words" -lt 700 ]; then
                echo "   ⚠️  $(basename $file): $words palavras (MIN: 700)"
            else
                echo "   ✅ $(basename $file): $words palavras"
            fi
        done
    else
        echo "   ⚠️  Arquivos em work/ebook/: 0"
    fi
    
    if [ "$files_wrong" -gt 0 ]; then
        echo "   ❌ FALHA: $files_wrong arquivo(s) na raiz - movendo..."
        find /workspace -maxdepth 1 -name "pagina_*.md" -type f -exec mv {} "$EBOOK_DIR/" \; 2>/dev/null
    fi
    
    if [ "$files_wrong_project" -gt 0 ]; then
        echo "   ❌ FALHA: $files_wrong_project arquivo(s) em work/project/ - movendo..."
        mkdir -p "$EBOOK_DIR"
        find /workspace/work/project -name "*.md" -type f -exec mv {} "$EBOOK_DIR/" \; 2>/dev/null
    fi
    
    # 4. VERIFICAR ÚLTIMAS LINHAS DO LOG
    echo ""
    echo "4. ÚLTIMAS AÇÕES NO LOG:"
    echo "-------------------------------------------"
    tail -10 "$LOG_FILE" 2>/dev/null | grep -E "(TOOL:|WRITE_FILE|KANBAN|Completed|Error)" | tail -5 || tail -3 "$LOG_FILE"
    
    # 5. VERIFICAR SE COMPLETOU
    if [ "$files_correct" -ge 30 ]; then
        echo ""
        echo "==========================================="
        echo "✅ EBOOK COMPLETO - 30 PÁGINAS CRIADAS!"
        echo "==========================================="
        break
    fi
    
    sleep $CHECK_INTERVAL
done

echo ""
echo "Monitoramento finalizado"
