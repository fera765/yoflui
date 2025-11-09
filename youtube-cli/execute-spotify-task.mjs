#!/usr/bin/env node

import { CentralOrchestratorV2 } from './source/agi/orchestrator-v2.js';
import { existsSync, mkdirSync } from 'fs';

const projectDir = '/workspace/spotify-clone';

console.log('\n🎵 EXECUTANDO FLUI 10/10 - SPOTIFY CLONE\n');
console.log('━'.repeat(80));

// Criar diretório
if (!existsSync(projectDir)) {
	mkdirSync(projectDir, { recursive: true });
}

const orchestrator = new CentralOrchestratorV2();

const prompt = `
Criar um clone COMPLETO e PROFISSIONAL da interface do Spotify.

STACK OBRIGATÓRIO:
- React 18
- TypeScript
- Vite
- Tailwind CSS
- react-icons

ESTRUTURA DO PROJETO:
1. Inicializar projeto Vite com React + TypeScript
2. Configurar Tailwind CSS
3. Criar componentes em src/components/

COMPONENTES OBRIGATÓRIOS:
1. Sidebar.tsx - Navegação lateral com Home, Search, Library
2. Player.tsx - Player de música fixo na parte inferior
3. PlaylistCard.tsx - Cards de álbuns/playlists
4. Header.tsx - Cabeçalho com gradiente
5. Layout.tsx - Layout principal que combina tudo

CARACTERÍSTICAS DA UI:
- Fundo escuro #121212 (igual Spotify)
- Verde primário #1DB954 (botões e destaques)
- Sidebar esquerda fixa
- Player fixo na parte inferior
- Área de conteúdo com scroll
- Header com gradiente
- Hover effects em todos os cards
- Transições suaves

RESPONSIVIDADE:
- Mobile (< 768px): Sidebar colapsada, bottom navigation
- Tablet (768px - 1024px): Sidebar reduzida
- Desktop (> 1024px): Layout completo

MOCK DE DADOS:
- Criar arquivo src/data/mockData.ts
- 20+ playlists/álbuns com:
  - título
  - artista
  - imagem (Unsplash ou placeholder)
  - ano
- 10+ músicas para o player

FUNCIONALIDADES:
- Play/pause simulado
- Barra de progresso animada
- Controle de volume (visual)
- Navegação entre seções
- Like em músicas (visual)

IMPORTANTE:
1. Usar npm create vite@latest para iniciar
2. Instalar todas as dependências necessárias
3. Configurar Tailwind corretamente
4. Código TypeScript type-safe
5. Componentes modulares e reutilizáveis
6. README com instruções
7. EXECUTAR npm install
8. EXECUTAR npm run build para validar
9. Verificar se não há erros

O projeto deve estar 100% funcional, profissional e idêntico ao Spotify.
`;

let logsCapture = [];
let toolsUsed = new Set();
let filesCreated = [];
let errorsFound = [];

orchestrator.orchestrate(
	prompt.trim(),
	projectDir,
	(message, kanban) => {
		console.log(message);
		logsCapture.push(message);
		
		// Capturar tools usadas
		if (message.includes('write_file') || message.includes('📝')) {
			toolsUsed.add('write_file');
			const fileMatch = message.match(/(?:write_file|📝).*?([a-zA-Z0-9_/-]+\.[a-z]+)/);
			if (fileMatch) filesCreated.push(fileMatch[1]);
		}
		if (message.includes('execute_shell') || message.includes('💻')) {
			toolsUsed.add('execute_shell');
		}
		if (message.includes('read_file')) {
			toolsUsed.add('read_file');
		}
		if (message.includes('edit_file')) {
			toolsUsed.add('edit_file');
		}
		
		// Capturar erros
		if (message.toLowerCase().includes('error') || message.toLowerCase().includes('falha')) {
			errorsFound.push(message);
		}
	}
).then(result => {
	console.log('\n' + '━'.repeat(80));
	console.log('📊 ANÁLISE FINAL\n');
	console.log(`Tools Utilizadas: ${Array.from(toolsUsed).join(', ')}`);
	console.log(`Arquivos Criados: ${filesCreated.length}`);
	console.log(`Erros Encontrados: ${errorsFound.length}`);
	console.log(`\n${result.result}\n`);
	console.log('━'.repeat(80));
	
	// Validar projeto
	validateProject();
}).catch(error => {
	console.error('\n❌ ERRO:', error);
	process.exit(1);
});

function validateProject() {
	console.log('\n🔍 VALIDANDO PROJETO...\n');
	
	const requiredFiles = [
		'package.json',
		'src/App.tsx',
		'src/components/Sidebar.tsx',
		'src/components/Player.tsx',
		'src/components/PlaylistCard.tsx',
		'src/components/Header.tsx',
		'tailwind.config.js',
	];
	
	let score = 0;
	requiredFiles.forEach(file => {
		const exists = existsSync(`${projectDir}/${file}`);
		console.log(`${exists ? '✅' : '❌'} ${file}`);
		if (exists) score++;
	});
	
	console.log(`\n📊 Score: ${score}/${requiredFiles.length}`);
	console.log(`🎯 Nota: ${(score / requiredFiles.length * 10).toFixed(1)}/10\n`);
	
	if (score === requiredFiles.length) {
		console.log('🎉 ESTRUTURA PERFEITA!\n');
	}
}
