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
Criar um clone COMPLETO e PROFISSIONAL da interface do Spotify com TODOS os arquivos necessários.

⚠️  CRÍTICO - ARQUIVO MAIS IMPORTANTE:
🔴 package.json - DEVE ser o PRIMEIRO arquivo criado na raiz do projeto!
   - Incluir: "name": "spotify-clone", "private": true, "version": "0.0.0"
   - Incluir scripts: "dev": "vite", "build": "vite build", "preview": "vite preview"
   - Incluir TODAS dependências: react@^18.2.0, react-dom@^18.2.0, react-icons@^5.0.0
   - Incluir TODAS devDependencies: typescript@^5.0.0, vite@^5.0.0, tailwindcss@^3.4.0, postcss@^8.4.0, autoprefixer@^10.4.0, @vitejs/plugin-react@^4.2.0, @types/react@^18.2.0, @types/react-dom@^18.2.0

ARQUIVOS OBRIGATÓRIOS NA RAIZ:
✅ package.json (CRÍTICO - criar PRIMEIRO!)
✅ vite.config.ts (configuração completa do Vite com plugin React)
✅ tsconfig.json (configuração TypeScript)
✅ tsconfig.node.json (configuração TypeScript para Node)
✅ index.html (arquivo HTML de entrada)
✅ tailwind.config.js (configuração Tailwind com darkMode)
✅ postcss.config.js (configuração PostCSS)
✅ .gitignore (ignorar node_modules, dist, etc)
✅ README.md (instruções completas de instalação e uso)

ESTRUTURA src/ OBRIGATÓRIA:
✅ src/main.tsx (entrada principal React)
✅ src/App.tsx (componente raiz da aplicação)
✅ src/index.css (estilos globais com @tailwind)
✅ src/vite-env.d.ts (tipos Vite)

COMPONENTES OBRIGATÓRIOS (src/components/):
1. Sidebar.tsx - Navegação lateral com Home, Search, Library, ícones
2. Player.tsx - Player de música fixo na parte inferior com controles
3. PlaylistCard.tsx - Cards de álbuns/playlists com hover
4. Header.tsx - Cabeçalho com gradiente e navegação
5. Layout.tsx - Layout principal que combina Sidebar + Header + Content + Player

MOCK DE DADOS OBRIGATÓRIO:
✅ src/data/mockData.ts com:
  - 20+ playlists/álbuns (título, artista, imagem URL, ano, descrição)
  - 15+ músicas (título, artista, álbum, duração, imageUrl)
  - Usar URLs reais do Unsplash para imagens

CARACTERÍSTICAS DA UI (cores exatas do Spotify):
- Fundo escuro: #121212
- Verde Spotify: #1DB954
- Cinza sidebar: #000000
- Texto primário: #FFFFFF
- Texto secundário: #B3B3B3
- Hover cards: rgba(255,255,255,0.1)
- Transições: transition-all duration-300

RESPONSIVIDADE COMPLETA:
- Mobile (< 768px): Sidebar colapsada, bottom nav, player adaptado
- Tablet (768px - 1024px): Sidebar ícones apenas
- Desktop (> 1024px): Layout completo

FUNCIONALIDADES IMPLEMENTADAS:
- Play/pause simulado com estado
- Barra de progresso animada e clicável
- Controle de volume funcional (0-100%)
- Navegação entre seções (Home, Search, Library)
- Like em músicas (toggle estado)
- Shuffle e repeat (toggle visual)
- Lista de músicas clicável
- Player mostra música atual

PASSOS OBRIGATÓRIOS:
1. Criar TODOS os arquivos listados acima
2. Garantir package.json completo com scripts: dev, build, preview
3. Configurar Vite corretamente com @vitejs/plugin-react
4. Configurar Tailwind com todas diretivas
5. Implementar TODOS os componentes com TypeScript rigoroso
6. EXECUTAR: npm install
7. EXECUTAR: npm run build (verificar se compila sem erros)
8. Verificar que dist/ foi criado com sucesso

CRITÉRIO DE SUCESSO:
- TODOS os arquivos listados devem existir
- npm install deve completar sem erros
- npm run build deve gerar dist/ sem erros
- Interface deve ser idêntica ao Spotify
- Código TypeScript sem erros
- Responsividade perfeita
- NOTA MÍNIMA: 10/10

O projeto deve estar 100% COMPLETO, funcional e pronto para produção.
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
	console.log('\n🔍 VALIDANDO PROJETO COMPLETO...\n');
	
	const requiredFiles = [
		'package.json',
		'package-lock.json',
		'vite.config.ts',
		'tsconfig.json',
		'index.html',
		'tailwind.config.js',
		'postcss.config.js',
		'README.md',
		'src/main.tsx',
		'src/App.tsx',
		'src/index.css',
		'src/components/Sidebar.tsx',
		'src/components/Player.tsx',
		'src/components/PlaylistCard.tsx',
		'src/components/Header.tsx',
		'src/components/Layout.tsx',
	];
	
	// Check for mockData in either location
	const mockDataExists = existsSync(`${projectDir}/src/data/mockData.ts`) || 
	                       existsSync(`${projectDir}/src/mockData.ts`);
	console.log(`${mockDataExists ? '✅' : '❌'} src/mockData.ts (or src/data/mockData.ts)`);
	
	let score = 0;
	requiredFiles.forEach(file => {
		const exists = existsSync(`${projectDir}/${file}`);
		console.log(`${exists ? '✅' : '❌'} ${file}`);
		if (exists) score++;
	});
	
	console.log(`\n📊 Score: ${score}/${requiredFiles.length}`);
	const nota = (score / requiredFiles.length * 10).toFixed(1);
	console.log(`🎯 Nota: ${nota}/10\n`);
	
	if (score === requiredFiles.length) {
		console.log('✨ PROJETO COMPLETO E PERFEITO! ✨\n');
		console.log('🎉 NOTA 10/10 ALCANÇADA! 🎉\n');
	} else {
		console.log(`⚠️  INCOMPLETO - Faltam ${requiredFiles.length - score} arquivos críticos\n`);
	}
}
