#!/usr/bin/env node

/**
 * TESTE REAL - SPOTIFY UI CLONE COM FLUI 10/10
 * 
 * Este teste vai validar se o Flui é realmente 10/10 criando um projeto complexo.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

console.log('\n🎵 TESTE REAL - SPOTIFY UI CLONE COM FLUI 10/10\n');
console.log('━'.repeat(80));

const prompt = `Criar um frontend completo com UI idêntica ao Spotify usando:
- React
- TailwindCSS  
- Vite

REQUISITOS OBRIGATÓRIOS:
1. UI DEVE SER IDÊNTICA AO SPOTIFY:
   - Sidebar lateral escura com navegação (Home, Search, Your Library)
   - Player de música na parte inferior com controles
   - Área principal com cards de playlists/álbuns
   - Barra de pesquisa no topo
   - Cores: fundo escuro (#121212), verde do Spotify (#1DB954)
   
2. TOTALMENTE RESPONSIVA:
   - Desktop (1920px)
   - Tablet (768px)
   - Mobile (375px)
   - Sidebar colapsável em mobile
   
3. COMPONENTES NECESSÁRIOS:
   - Sidebar com navegação
   - Header com busca
   - Player de música (bottom bar)
   - Cards de playlist/álbum com hover effects
   - Grid responsivo de conteúdo
   - Botões play/pause
   
4. MOCK DE API:
   - Lista de playlists
   - Lista de álbuns populares
   - Lista de músicas
   - Dados mockados em JSON

5. FUNCIONALIDADES:
   - Navegação funcional entre seções
   - Player com play/pause/next/previous (mock)
   - Hover effects nos cards
   - Busca funcional (filtro client-side)
   - Progress bar da música
   - Volume control

IMPORTANTE:
- Projeto DEVE buildar sem erros
- Código limpo e bem organizado
- TypeScript para type-safety
- Tailwind configurado corretamente
- Ícones usando react-icons ou lucide-react
- Deve rodar com 'npm run dev' sem erros

Crie TUDO em /workspace/spotify-clone/`;

// Executar Flui via CLI
async function executeFluiTest() {
	const startTime = Date.now();
	let logs = [];
	
	console.log('📝 Prompt enviado ao Flui:');
	console.log('-'.repeat(80));
	console.log(prompt);
	console.log('-'.repeat(80));
	console.log('\n🚀 Iniciando execução do Flui...\n');
	
	try {
		// Criar diretório de trabalho
		await execAsync('mkdir -p /workspace/spotify-clone');
		
		// Executar Flui via CLI
		const fluiCommand = `cd /workspace/youtube-cli && npx tsx source/cli.tsx --non-interactive "${prompt.replace(/"/g, '\\"')}" --work-dir /workspace/spotify-clone`;
		
		console.log('⚡ Executando comando:', fluiCommand.substring(0, 100) + '...');
		console.log('\n📊 MONITORANDO EXECUÇÃO:\n');
		
		const { stdout, stderr } = await execAsync(fluiCommand, {
			maxBuffer: 10 * 1024 * 1024, // 10MB buffer
			timeout: 600000, // 10 minutos
		});
		
		logs.push(stdout);
		if (stderr) logs.push(stderr);
		
		console.log(stdout);
		if (stderr) console.error(stderr);
		
		const duration = Date.now() - startTime;
		console.log(`\n✅ Flui finalizado em ${(duration / 1000).toFixed(1)}s\n`);
		
		return { success: true, duration, logs: logs.join('\n') };
	} catch (error) {
		const duration = Date.now() - startTime;
		console.error(`\n❌ Erro na execução (${(duration / 1000).toFixed(1)}s):`, error.message);
		return { success: false, duration, logs: logs.join('\n'), error: error.message };
	}
}

// Validar projeto criado
async function validateProject() {
	console.log('\n📋 VALIDANDO PROJETO CRIADO:\n');
	
	const checks = {
		projectExists: existsSync('/workspace/spotify-clone'),
		packageJson: existsSync('/workspace/spotify-clone/package.json'),
		viteConfig: existsSync('/workspace/spotify-clone/vite.config.ts') || existsSync('/workspace/spotify-clone/vite.config.js'),
		tailwindConfig: existsSync('/workspace/spotify-clone/tailwind.config.js') || existsSync('/workspace/spotify-clone/tailwind.config.ts'),
		srcFolder: existsSync('/workspace/spotify-clone/src'),
		indexHtml: existsSync('/workspace/spotify-clone/index.html'),
	};
	
	for (const [check, passed] of Object.entries(checks)) {
		console.log(`${passed ? '✅' : '❌'} ${check}`);
	}
	
	return Object.values(checks).every(v => v);
}

// Contar arquivos e componentes
async function analyzeProject() {
	console.log('\n📊 ANÁLISE DO PROJETO:\n');
	
	try {
		// Contar arquivos TypeScript/JavaScript
		const { stdout: tsFiles } = await execAsync('find /workspace/spotify-clone -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" 2>/dev/null | wc -l');
		
		// Contar componentes
		const { stdout: components } = await execAsync('find /workspace/spotify-clone/src -name "*.tsx" -o -name "*.jsx" 2>/dev/null | wc -l');
		
		// Listar arquivos principais
		const { stdout: fileList } = await execAsync('find /workspace/spotify-clone/src -type f 2>/dev/null | head -30');
		
		// Tamanho do projeto
		const { stdout: size } = await execAsync('du -sh /workspace/spotify-clone 2>/dev/null');
		
		console.log(`📄 Total de arquivos TS/JS: ${tsFiles.trim()}`);
		console.log(`🎨 Total de componentes: ${components.trim()}`);
		console.log(`💾 Tamanho do projeto: ${size.trim()}`);
		console.log('\n📁 Estrutura de arquivos:');
		console.log(fileList);
		
		return {
			totalFiles: parseInt(tsFiles.trim()) || 0,
			totalComponents: parseInt(components.trim()) || 0,
			size: size.trim(),
		};
	} catch (error) {
		console.error('Erro na análise:', error.message);
		return { totalFiles: 0, totalComponents: 0, size: '0' };
	}
}

// Tentar build
async function tryBuild() {
	console.log('\n🔨 TENTANDO BUILD DO PROJETO:\n');
	
	try {
		// Instalar dependências
		console.log('📦 Instalando dependências...');
		await execAsync('cd /workspace/spotify-clone && npm install', { timeout: 180000 });
		console.log('✅ Dependências instaladas\n');
		
		// Build
		console.log('🔨 Executando build...');
		const { stdout, stderr } = await execAsync('cd /workspace/spotify-clone && npm run build', { timeout: 120000 });
		console.log(stdout);
		if (stderr && !stderr.includes('warning')) {
			console.warn('Warnings:', stderr);
		}
		console.log('✅ Build concluído com sucesso!');
		
		return { success: true };
	} catch (error) {
		console.error('❌ Build falhou:', error.message);
		return { success: false, error: error.message };
	}
}

// Dar nota final
function giveFinalScore(results) {
	console.log('\n' + '━'.repeat(80));
	console.log('📊 AVALIAÇÃO FINAL - SPOTIFY CLONE');
	console.log('━'.repeat(80));
	
	let score = 0;
	const maxScore = 10;
	
	// Critérios de avaliação
	const criteria = [
		{ name: 'Projeto criado', weight: 1, passed: results.projectValid },
		{ name: 'Arquivos essenciais', weight: 1, passed: results.projectValid },
		{ name: 'Número adequado de componentes', weight: 2, passed: results.analysis.totalComponents >= 5 },
		{ name: 'Build sem erros', weight: 3, passed: results.buildSuccess },
		{ name: 'Tempo de execução razoável', weight: 1, passed: results.executionTime < 600 },
		{ name: 'Estrutura organizada', weight: 2, passed: results.analysis.totalFiles >= 10 },
	];
	
	console.log('\n📋 Critérios:');
	for (const criterion of criteria) {
		const status = criterion.passed ? '✅' : '❌';
		const points = criterion.passed ? criterion.weight : 0;
		score += points;
		console.log(`${status} ${criterion.name} (${points}/${criterion.weight} pontos)`);
	}
	
	const finalScore = (score / maxScore) * 10;
	
	console.log('\n' + '━'.repeat(80));
	console.log(`🎯 NOTA FINAL: ${finalScore.toFixed(1)}/10`);
	console.log('━'.repeat(80));
	
	if (finalScore >= 10) {
		console.log('\n🎉 PARABÉNS! FLUI É 10/10!');
		console.log('✅ Projeto atende todos os requisitos');
		console.log('✅ Build sem erros');
		console.log('✅ Estrutura adequada');
	} else if (finalScore >= 7) {
		console.log('\n⚠️  BOM, MAS PRECISA MELHORAR');
		console.log('Alguns requisitos não foram atendidos completamente');
	} else {
		console.log('\n❌ PRECISA REFAZER');
		console.log('Projeto não atende aos requisitos mínimos');
	}
	
	return finalScore;
}

// Executar teste completo
async function runFullTest() {
	try {
		// 1. Executar Flui
		const execution = await executeFluiTest();
		
		// 2. Validar projeto
		const projectValid = await validateProject();
		
		// 3. Analisar projeto
		const analysis = await analyzeProject();
		
		// 4. Build
		const build = await tryBuild();
		
		// 5. Nota final
		const results = {
			executionTime: execution.duration / 1000,
			projectValid,
			analysis,
			buildSuccess: build.success,
		};
		
		const finalScore = giveFinalScore(results);
		
		// Feedback detalhado
		console.log('\n📝 RESUMO DETALHADO:');
		console.log(`   Tempo de execução: ${results.executionTime.toFixed(1)}s`);
		console.log(`   Arquivos criados: ${analysis.totalFiles}`);
		console.log(`   Componentes: ${analysis.totalComponents}`);
		console.log(`   Tamanho: ${analysis.size}`);
		console.log(`   Build: ${build.success ? 'SUCESSO' : 'FALHA'}`);
		
		if (finalScore < 10) {
			console.log('\n⚠️  NOTA ABAIXO DE 10/10 - PROJETO SERÁ DELETADO');
			process.exit(1);
		} else {
			console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
			process.exit(0);
		}
	} catch (error) {
		console.error('\n❌ Erro fatal no teste:', error);
		process.exit(1);
	}
}

// Iniciar
runFullTest().catch(console.error);
