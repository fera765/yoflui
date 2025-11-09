#!/usr/bin/env node

/**
 * TESTE REAL DO FLUI 10/10
 * Criar clone completo da UI do Spotify
 * 
 * Monitorar:
 * - Autonomia
 * - Tools utilizadas
 * - Correções automáticas
 * - Build e execução
 * - Qualidade final
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

console.log('\n🎵 TESTE REAL: FLUI 10/10 vs SPOTIFY CLONE\n');
console.log('━'.repeat(80));

// Criar diretório para o projeto
const projectDir = '/workspace/spotify-clone-test';
if (existsSync(projectDir)) {
	console.log('🗑️  Limpando projeto anterior...');
	spawn('rm', ['-rf', projectDir], { stdio: 'inherit' }).on('close', () => {
		createProject();
	});
} else {
	createProject();
}

function createProject() {
	mkdirSync(projectDir, { recursive: true });
	console.log(`✅ Diretório criado: ${projectDir}\n`);
	
	// Executar Flui
	console.log('🚀 Iniciando Flui 10/10 (Preset: BALANCED)...\n');
	console.log('━'.repeat(80));
	
	const prompt = `
Criar um clone COMPLETO e PROFISSIONAL da interface do Spotify usando:
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Componentes totalmente responsivos

REQUISITOS OBRIGATÓRIOS:
1. UI IDÊNTICA ao Spotify:
   - Sidebar esquerda com navegação
   - Player de música na parte inferior (fixo)
   - Área principal com cards de playlists/álbuns
   - Header com gradiente
   - Ícones e espaçamento idênticos

2. COMPONENTES:
   - Sidebar (navegação Home, Search, Library)
   - Player (controles, barra de progresso, volume)
   - PlaylistCard (cards de álbuns/playlists)
   - Header (com gradiente e botão de perfil)
   - Layout (estrutura geral)

3. RESPONSIVO:
   - Mobile (< 768px): Sidebar colapsada, layout simplificado
   - Tablet (768-1024px): Sidebar reduzida
   - Desktop (> 1024px): Layout completo

4. MOCK DE DADOS:
   - Array com 20+ playlists/álbuns
   - Dados de músicas para o player
   - Imagens placeholder via Unsplash ou similar

5. ESTILO:
   - Fundo escuro (#121212)
   - Verde do Spotify (#1DB954)
   - Hover effects
   - Transições suaves
   - Ícones (react-icons ou lucide-react)

6. FUNCIONALIDADES:
   - Player funcional (play/pause simulado)
   - Navegação entre seções
   - Hover states
   - Click handlers

ESTRUTURA DE ARQUIVOS:
src/
  components/
    Sidebar.tsx
    Player.tsx
    PlaylistCard.tsx
    Header.tsx
    Layout.tsx
  data/
    mockData.ts
  App.tsx
  index.css (Tailwind)

IMPORTANTE:
- Configurar Vite + React + TypeScript + Tailwind corretamente
- Usar componentes modulares e reutilizáveis
- Código limpo e profissional
- README com instruções
- package.json com todos os scripts

APÓS CRIAR:
1. Instalar dependências (npm install)
2. Rodar build (npm run build) para validar
3. Testar dev server (npm run dev)

O projeto deve estar 100% funcional e profissional.
`.trim();

	// Executar CLI do Flui
	const fluiProcess = spawn('npx', ['tsx', 'source/cli.tsx'], {
		cwd: '/workspace/youtube-cli',
		stdio: ['pipe', 'pipe', 'pipe'],
		env: {
			...process.env,
			FLUI_MODE: 'non-interactive',
			FLUI_PROMPT: prompt,
			FLUI_WORKDIR: projectDir,
		}
	});

	let output = '';
	let toolsUsed = [];
	let errors = [];
	let builds = 0;
	let corrections = 0;

	fluiProcess.stdout.on('data', (data) => {
		const text = data.toString();
		output += text;
		process.stdout.write(text);

		// Detectar tools usadas
		if (text.includes('🔧') || text.includes('[TOOL]')) {
			const toolMatch = text.match(/(?:🔧|TOOL])\s*(\w+)/);
			if (toolMatch && !toolsUsed.includes(toolMatch[1])) {
				toolsUsed.push(toolMatch[1]);
			}
		}

		// Detectar builds
		if (text.includes('npm run build') || text.includes('building')) {
			builds++;
		}

		// Detectar correções
		if (text.includes('correcting') || text.includes('fixing') || text.includes('retry')) {
			corrections++;
		}

		// Detectar erros
		if (text.includes('Error:') || text.includes('ERROR')) {
			errors.push(text.trim());
		}
	});

	fluiProcess.stderr.on('data', (data) => {
		const text = data.toString();
		process.stderr.write(text);
		if (text.includes('Error') || text.includes('ERROR')) {
			errors.push(text.trim());
		}
	});

	fluiProcess.on('close', (code) => {
		console.log('\n' + '━'.repeat(80));
		console.log('📊 ANÁLISE DO PROCESSO\n');
		
		console.log(`Exit Code: ${code}`);
		console.log(`Tools Utilizadas: ${toolsUsed.length > 0 ? toolsUsed.join(', ') : 'Nenhuma detectada'}`);
		console.log(`Builds Executados: ${builds}`);
		console.log(`Correções Feitas: ${corrections}`);
		console.log(`Erros Encontrados: ${errors.length}`);
		
		if (errors.length > 0) {
			console.log('\n❌ ERROS:');
			errors.slice(0, 5).forEach(err => console.log(`  - ${err.substring(0, 100)}`));
		}
		
		console.log('\n━'.repeat(80));
		console.log('🔍 VALIDANDO PROJETO...\n');
		
		// Validar estrutura
		validateProject(projectDir);
	});
}

function validateProject(projectDir) {
	const checks = {
		'package.json': existsSync(join(projectDir, 'package.json')),
		'vite.config': existsSync(join(projectDir, 'vite.config.ts')) || existsSync(join(projectDir, 'vite.config.js')),
		'tailwind.config': existsSync(join(projectDir, 'tailwind.config.js')) || existsSync(join(projectDir, 'tailwind.config.ts')),
		'src/App.tsx': existsSync(join(projectDir, 'src/App.tsx')),
		'src/components/Sidebar.tsx': existsSync(join(projectDir, 'src/components/Sidebar.tsx')),
		'src/components/Player.tsx': existsSync(join(projectDir, 'src/components/Player.tsx')),
		'src/components/Header.tsx': existsSync(join(projectDir, 'src/components/Header.tsx')),
		'README.md': existsSync(join(projectDir, 'README.md')),
	};

	console.log('📁 ESTRUTURA DE ARQUIVOS:');
	let score = 0;
	for (const [file, exists] of Object.entries(checks)) {
		console.log(`  ${exists ? '✅' : '❌'} ${file}`);
		if (exists) score++;
	}

	const totalChecks = Object.keys(checks).length;
	const percentage = (score / totalChecks * 100).toFixed(1);
	
	console.log(`\n📊 Score de Estrutura: ${score}/${totalChecks} (${percentage}%)`);
	
	// Tentar build
	console.log('\n🏗️  TESTANDO BUILD...');
	const buildProcess = spawn('npm', ['run', 'build'], {
		cwd: projectDir,
		stdio: 'inherit'
	});

	buildProcess.on('close', (code) => {
		console.log(`\nBuild ${code === 0 ? '✅ SUCESSO' : '❌ FALHOU'}`);
		
		// Nota final
		const finalScore = calculateFinalScore(score, totalChecks, code);
		console.log('\n' + '━'.repeat(80));
		console.log(`🎯 NOTA FINAL: ${finalScore}/10`);
		console.log('━'.repeat(80));
		
		if (finalScore < 10) {
			console.log('\n❌ PROJETO NÃO ATINGIU 10/10');
			console.log('🔄 Ajustes necessários...');
		} else {
			console.log('\n🎉 PROJETO PERFEITO! 10/10');
		}
	});
}

function calculateFinalScore(filesScore, totalFiles, buildCode) {
	const filePercentage = (filesScore / totalFiles) * 100;
	const buildSuccess = buildCode === 0;
	
	let score = 0;
	
	// 50% pela estrutura de arquivos
	score += (filePercentage / 100) * 5;
	
	// 50% pelo build
	score += buildSuccess ? 5 : 0;
	
	return Math.round(score);
}
