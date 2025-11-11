#!/bin/bash

# Script para monitorar o Flui e verificar qualidade do ebook
LOG_FILE="flui_output.log"
EBOOK_DIR="work/ebook"
CHECK_INTERVAL=30

echo "==========================================="
echo "Monitor Flui - Verificação de Qualidade"
echo "==========================================="
echo ""
echo "Verificando a cada ${CHECK_INTERVAL} segundos..."
echo ""

iteration=0

while true; do
    iteration=$((iteration + 1))
    echo "[CHECK #${iteration}] $(date '+%H:%M:%S')"
    echo "-------------------------------------------"
    
    # Verificar se há arquivos de ebook criados
    if [ -d "$EBOOK_DIR" ]; then
        ebook_files=$(find "$EBOOK_DIR" -name "*.md" -type f 2>/dev/null | wc -l)
        echo "📚 Arquivos de ebook encontrados: $ebook_files"
        
        if [ "$ebook_files" -gt 0 ]; then
            echo ""
            echo "📄 Últimos arquivos criados:"
            find "$EBOOK_DIR" -name "*.md" -type f -exec ls -lh {} \; | tail -5 | awk '{print "   " $9 " (" $5 ")"}'
            
            echo ""
            echo "📊 Análise de conteúdo:"
            
            # Contar palavras nos arquivos
            total_words=0
            total_files=0
            for file in $(find "$EBOOK_DIR" -name "*.md" -type f); do
                words=$(wc -w < "$file" 2>/dev/null || echo "0")
                total_words=$((total_words + words))
                total_files=$((total_files + 1))
                
                if [ "$words" -lt 700 ]; then
                    echo "   ⚠️  $(basename $file): $words palavras (MIN: 700)"
                else
                    echo "   ✅ $(basename $file): $words palavras"
                fi
            done
            
            if [ "$total_files" -gt 0 ]; then
                avg_words=$((total_words / total_files))
                echo ""
                echo "   📈 Média: $avg_words palavras por arquivo"
                echo "   📈 Total: $total_words palavras em $total_files arquivos"
            fi
        fi
    else
        echo "📚 Diretório de ebook ainda não criado"
    fi
    
    echo ""
    echo "🔍 Verificando uso de YouTube tool..."
    
    # Verificar logs por uso de YouTube
    if [ -f "$LOG_FILE" ]; then
        youtube_usage=$(grep -i "youtube\|search_youtube" "$LOG_FILE" 2>/dev/null | wc -l)
        if [ "$youtube_usage" -gt 0 ]; then
            echo "   ✅ YouTube tool detectada: $youtube_usage ocorrências"
        else
            echo "   ⚠️  YouTube tool ainda não detectada"
        fi
        
        # Verificar por mocks/simulações
        mock_usage=$(grep -i "mock\|simulate\|fake\|dummy\|test data" "$LOG_FILE" 2>/dev/null | wc -l)
        if [ "$mock_usage" -gt 0 ]; then
            echo "   ⚠️  ATENÇÃO: Possíveis mocks/simulações detectados: $mock_usage ocorrências"
        else
            echo "   ✅ Nenhum mock/simulação detectado"
        fi
    fi
    
    echo ""
    echo "-------------------------------------------"
    echo ""
    
    sleep $CHECK_INTERVAL
done
