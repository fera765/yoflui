#!/bin/bash

LOG_FILE="/workspace/flui_output.log"
EBOOK_FILE="/workspace/work/ebook/ebook.md"
CHECK_INTERVAL=20
ITERATION=0
LAST_LOG_SIZE=0
ERRORS_DETECTED=0

echo "==========================================="
echo "MONITOR RIGOROSO - EBOOK ARQUIVO ÚNICO"
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
        break
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
    
    # 2. VERIFICAR ARQUIVO ÚNICO
    echo ""
    echo "2. ARQUIVO EBOOK:"
    echo "-------------------------------------------"
    if [ -f "$EBOOK_FILE" ]; then
        file_size=$(wc -c < "$EBOOK_FILE" 2>/dev/null || echo "0")
        word_count=$(wc -w < "$EBOOK_FILE" 2>/dev/null || echo "0")
        page_count=$(grep -c "^# Página " "$EBOOK_FILE" 2>/dev/null || echo "0")
        
        echo "   ✅ Arquivo único encontrado: $EBOOK_FILE"
        echo "   📊 Tamanho: $file_size bytes"
        echo "   📝 Palavras: $word_count"
        echo "   📄 Páginas detectadas: $page_count"
        
        # Verificar se tem múltiplos arquivos (VIOLAÇÃO)
        multiple_files=$(find /workspace/work/ebook -name "pagina_*.md" -type f 2>/dev/null | wc -l)
        if [ "$multiple_files" -gt 0 ]; then
            echo "   ❌ FALHA CRÍTICA: $multiple_files arquivo(s) pagina_XX.md detectados!"
            echo "   ⚠️  VIOLAÇÃO: Ebook deve ser UM ÚNICO arquivo"
            ERRORS_DETECTED=$((ERRORS_DETECTED + 1))
        fi
    else
        echo "   ⚠️  Arquivo ebook.md ainda não criado"
    fi
    
    # 3. VERIFICAR MÚLTIPLOS ARQUIVOS (VIOLAÇÃO)
    echo ""
    echo "3. VERIFICAÇÃO DE VIOLAÇÕES:"
    echo "-------------------------------------------"
    multiple_page_files=$(find /workspace/work/ebook -name "pagina_*.md" -type f 2>/dev/null | wc -l)
    if [ "$multiple_page_files" -gt 0 ]; then
        echo "   ❌ FALHA CRÍTICA: $multiple_page_files arquivo(s) pagina_XX.md criados!"
        echo "   ⚠️  REGRA VIOLADA: Ebook deve ser UM ÚNICO arquivo"
        echo "   📁 Arquivos detectados:"
        find /workspace/work/ebook -name "pagina_*.md" -type f 2>/dev/null | head -5 | while read f; do
            echo "      - $(basename $f)"
        done
        ERRORS_DETECTED=$((ERRORS_DETECTED + 1))
    else
        echo "   ✅ Nenhuma violação detectada"
    fi
    
    # 4. VERIFICAR QUALIDADE DO CONTEÚDO
    echo ""
    echo "4. QUALIDADE DO CONTEÚDO:"
    echo "-------------------------------------------"
    if [ -f "$EBOOK_FILE" ]; then
        # Verificar palavras por página
        pages=$(grep -n "^# Página " "$EBOOK_FILE" 2>/dev/null | head -5)
        if [ -n "$pages" ]; then
            echo "$pages" | while IFS=: read line_num page_title; do
                next_line=$(sed -n "$((line_num + 1))p" "$EBOOK_FILE")
                if [ -n "$next_line" ]; then
                    # Contar palavras até próxima página ou fim
                    end_line=$(grep -n "^# Página " "$EBOOK_FILE" | grep -A1 "^$line_num:" | tail -1 | cut -d: -f1 || echo "$(wc -l < "$EBOOK_FILE")")
                    if [ "$end_line" = "$(wc -l < "$EBOOK_FILE")" ]; then
                        end_line=$((end_line + 1))
                    fi
                    page_content=$(sed -n "$line_num,$((end_line - 1))p" "$EBOOK_FILE")
                    words=$(echo "$page_content" | wc -w)
                    if [ "$words" -lt 700 ]; then
                        echo "   ⚠️  $page_title: $words palavras (MIN: 700)"
                    else
                        echo "   ✅ $page_title: $words palavras"
                    fi
                fi
            done
        fi
        
        # Verificar mocks/simulações
        if grep -qi "mock\|simulação\|simulation\|hardcoded\|preset\|exemplo.*genérico" "$EBOOK_FILE" 2>/dev/null; then
            echo "   ⚠️  Possível uso de mocks/simulações detectado"
        else
            echo "   ✅ Sem mocks detectados"
        fi
    fi
    
    # 5. VERIFICAR ÚLTIMAS AÇÕES
    echo ""
    echo "5. ÚLTIMAS AÇÕES NO LOG:"
    echo "-------------------------------------------"
    tail -10 "$LOG_FILE" 2>/dev/null | grep -E "(WRITE_FILE|TOOL:|KANBAN|Error|VIOLAÇÃO)" | tail -5 || tail -3 "$LOG_FILE"
    
    # 6. VERIFICAR ERROS
    if [ "$ERRORS_DETECTED" -gt 0 ]; then
        echo ""
        echo "==========================================="
        echo "❌ ERROS DETECTADOS: $ERRORS_DETECTED"
        echo "==========================================="
        echo "Parando processo para correção..."
        pkill -f "tsx.*cli.tsx" 2>/dev/null
        break
    fi
    
    # 7. VERIFICAR SE COMPLETOU
    if [ -f "$EBOOK_FILE" ]; then
        page_count=$(grep -c "^# Página " "$EBOOK_FILE" 2>/dev/null || echo "0")
        if [ "$page_count" -ge 30 ]; then
            echo ""
            echo "==========================================="
            echo "✅ EBOOK COMPLETO - 30 PÁGINAS NO ARQUIVO ÚNICO!"
            echo "==========================================="
            break
        fi
    fi
    
    sleep $CHECK_INTERVAL
done

echo ""
echo "Monitoramento finalizado"
