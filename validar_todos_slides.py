#!/usr/bin/env python3
import re
import os
from pathlib import Path

SLIDES_DIR = "/workspace/work/slides/s_elegantes"

print("=" * 60)
print("VALIDAÇÃO COMPLETA DE TODOS OS SLIDES")
print("=" * 60)
print()

total_slides = 0
slides_com_conteudo = 0
slides_com_ui = 0
slides_sobre_emagrecimento = 0

for i in range(1, 21):
    slide_file = Path(SLIDES_DIR) / f"slide_{i:03d}.html"
    
    if not slide_file.exists():
        continue
    
    total_slides += 1
    
    with open(slide_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extrair título
    title_match = re.search(r'<h1[^>]*>([^<]+)</h1>', content)
    title = title_match.group(1) if title_match else "Sem título"
    
    # Extrair conteúdo do slide
    content_match = re.search(r'<div[^>]*class="content-text"[^>]*>([\s\S]*?)</div>', content)
    slide_content = content_match.group(1) if content_match else ""
    content_len = len(slide_content.strip())
    
    # Verificar UI elegante
    has_inter = 'Inter' in content or 'font-family.*Inter' in content
    has_sf_pro = 'SF Pro' in content
    has_colors = '#000000' in content or '#FFFFFF' in content or 'color' in content
    has_background = 'background' in content
    ui_elements = sum([has_inter, has_sf_pro, has_colors, has_background])
    
    # Verificar se é sobre emagrecimento
    keywords = ['emagrecimento', 'dieta', 'exercício', 'nutrição', 'perda.*peso', 
                'calorias', 'metabolismo', 'saudável', 'alimentação']
    is_about_emagrecimento = any(re.search(kw, slide_content, re.IGNORECASE) for kw in keywords)
    
    print(f"Slide {i}:")
    print(f"  Título: \"{title}\"")
    
    # UI
    if ui_elements >= 3:
        slides_com_ui += 1
        print(f"  UI Elegante: ✅ ({ui_elements}/4 elementos)")
    else:
        print(f"  UI Elegante: ⚠️  ({ui_elements}/4 elementos)")
    
    # Conteúdo
    if content_len > 50:
        slides_com_conteudo += 1
        print(f"  Conteúdo: ✅ ({content_len} caracteres)")
        print(f"  Sobre emagrecimento: {'✅ SIM' if is_about_emagrecimento else '⚠️  NÃO'}")
        if is_about_emagrecimento:
            slides_sobre_emagrecimento += 1
        preview = slide_content[:150].replace('\n', ' ')
        print(f"  Preview: \"{preview}...\"")
    else:
        print(f"  Conteúdo: ⚠️  VAZIO ou muito curto ({content_len} caracteres)")
    
    print()

print("=" * 60)
print("RESUMO DA VALIDAÇÃO")
print("=" * 60)
print(f"Total de slides: {total_slides}/20")
print(f"Slides com UI elegante: {slides_com_ui}/{total_slides} ✅")
print(f"Slides com conteúdo (>50 chars): {slides_com_conteudo}/{total_slides}")
print(f"Slides sobre emagrecimento: {slides_sobre_emagrecimento}/{total_slides}")
print()

# Verificar PDF
pdf_file = Path("/workspace/work/s_elegantes.pdf")
if pdf_file.exists():
    size = pdf_file.stat().st_size / 1024
    print(f"PDF gerado: ✅ ({size:.1f} KB)")
else:
    print("PDF: ⚠️  Não encontrado")

# Verificar PPTX
pptx_file = Path("/workspace/work/s_elegantes.pptx")
if pptx_file.exists():
    size = pptx_file.stat().st_size / 1024
    print(f"PPTX gerado: ✅ ({size:.1f} KB)")
else:
    print("PPTX: ⚠️  Não encontrado")

print()
print("=" * 60)
