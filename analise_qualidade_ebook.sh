#!/bin/bash

echo "==========================================="
echo "ANÁLISE DE QUALIDADE DO EBOOK"
echo "==========================================="
echo ""

# Verificar uso da tool search_youtube_comments
echo "1. VERIFICAÇÃO DE USO DA TOOL YOUTUBE:"
echo "-------------------------------------------"
youtube_tool_usage=$(grep -i "search_youtube_comments" /workspace/flui_output.log 2>/dev/null | wc -l)
if [ "$youtube_tool_usage" -gt 0 ]; then
    echo "   ✅ Tool search_youtube_comments foi usada: $youtube_tool_usage vezes"
    grep -i "search_youtube_comments" /workspace/flui_output.log | tail -5
else
    echo "   ❌ Tool search_youtube_comments NÃO foi usada"
    echo "   ⚠️  Verificando uso de outras tools relacionadas ao YouTube:"
    web_search_youtube=$(grep -i "WEB_SEARCH.*youtube\|youtube.*WEB_SEARCH" /workspace/flui_output.log 2>/dev/null | wc -l)
    echo "   - WEB_SEARCH com YouTube: $web_search_youtube ocorrências"
fi

echo ""
echo "2. VERIFICAÇÃO DE MOCKS/SIMULAÇÕES:"
echo "-------------------------------------------"
mock_count=$(grep -iE "mock|simulate|fake|dummy|test data|exemplo|exemplo fictício" /workspace/flui_output.log 2>/dev/null | wc -l)
if [ "$mock_count" -gt 0 ]; then
    echo "   ⚠️  ATENÇÃO: Possíveis mocks/simulações detectados: $mock_count ocorrências"
    grep -iE "mock|simulate|fake|dummy|test data" /workspace/flui_output.log | tail -5
else
    echo "   ✅ Nenhum mock/simulação detectado nos logs"
fi

echo ""
echo "3. VERIFICAÇÃO DE ARQUIVOS DO EBOOK:"
echo "-------------------------------------------"

# Verificar diretório correto
if [ -d "/workspace/work/ebook" ]; then
    echo "   ✅ Diretório work/ebook/ existe"
    ebook_files=$(find /workspace/work/ebook -name "pagina_*.md" -type f 2>/dev/null | wc -l)
    echo "   📄 Arquivos pagina_XX.md encontrados: $ebook_files"
    
    if [ "$ebook_files" -gt 0 ]; then
        echo ""
        echo "   📊 Análise de conteúdo:"
        total_words=0
        files_below_min=0
        
        for file in $(find /workspace/work/ebook -name "pagina_*.md" -type f | sort); do
            words=$(wc -w < "$file" 2>/dev/null || echo "0")
            total_words=$((total_words + words))
            
            if [ "$words" -lt 700 ]; then
                files_below_min=$((files_below_min + 1))
                echo "   ⚠️  $(basename $file): $words palavras (MIN: 700)"
            else
                echo "   ✅ $(basename $file): $words palavras"
            fi
        done
        
        echo ""
        if [ "$ebook_files" -gt 0 ]; then
            avg_words=$((total_words / ebook_files))
            echo "   📈 Média de palavras por página: $avg_words"
            echo "   📈 Total de palavras: $total_words"
            echo "   📈 Páginas abaixo do mínimo (700 palavras): $files_below_min"
        fi
        
        if [ "$ebook_files" -eq 30 ]; then
            echo "   ✅ Número correto de páginas: 30/30"
        else
            echo "   ⚠️  Número de páginas: $ebook_files/30 esperadas"
        fi
    else
        echo "   ⚠️  Nenhum arquivo pagina_XX.md encontrado em work/ebook/"
    fi
else
    echo "   ❌ Diretório work/ebook/ não existe"
    echo "   🔍 Verificando outros diretórios:"
    find /workspace/work -type d -name "*ebook*" 2>/dev/null | while read dir; do
        files=$(find "$dir" -name "*.md" -type f 2>/dev/null | wc -l)
        echo "   - $dir: $files arquivos .md"
    done
fi

echo ""
echo "4. VERIFICAÇÃO DE QUALIDADE DO CONTEÚDO:"
echo "-------------------------------------------"

# Verificar se há conteúdo real (não apenas estrutura)
if [ -d "/workspace/work/ebook" ]; then
    sample_file=$(find /workspace/work/ebook -name "pagina_*.md" -type f | head -1)
    if [ -n "$sample_file" ] && [ -f "$sample_file" ]; then
        echo "   📄 Analisando arquivo de exemplo: $(basename $sample_file)"
        content_length=$(wc -c < "$sample_file" 2>/dev/null || echo "0")
        has_real_content=$(grep -vE "^#|^$|^---" "$sample_file" 2>/dev/null | wc -l)
        
        echo "   - Tamanho do arquivo: $content_length bytes"
        echo "   - Linhas com conteúdo: $has_real_content"
        
        # Verificar se menciona dados do YouTube
        youtube_mentions=$(grep -i "youtube\|comentário\|vídeo\|transcrição" "$sample_file" 2>/dev/null | wc -l)
        if [ "$youtube_mentions" -gt 0 ]; then
            echo "   ✅ Contém referências a dados do YouTube: $youtube_mentions menções"
        else
            echo "   ⚠️  Não encontradas referências explícitas a dados do YouTube"
        fi
    fi
fi

echo ""
echo "==========================================="
