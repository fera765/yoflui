#!/usr/bin/env node

import { CentralOrchestratorV2 } from './source/agi/orchestrator-v2.js';

console.log('\n🎵 FLUI 10/10 - TESTE REAL: SPOTIFY CLONE\n');
console.log('━'.repeat(80));

const orchestrator = new CentralOrchestratorV2();
const projectDir = '/workspace/spotify-clone';

const prompt = `
Criar um clone COMPLETO e PROFISSIONAL da interface do Spotify.

STACK:
- React 18 + TypeScript
- Vite como bundler
- Tailwind CSS para estilização
- react-icons para ícones

ESTRUTURA DO PROJETO:
1. Configurar Vite com React + TypeScript
2. Configurar Tailwind CSS
3. Criar estrutura de componentes
4. Adicionar mock de dados
5. Implementar responsividade

COMPONENTES OBRIGATÓRIOS:
1. Sidebar.tsx - Navegação lateral (Home, Search, Your Library)
2. Player.tsx - Player de música fixo na parte inferior
3. Header.tsx - Header com gradiente e botão de perfil
4. PlaylistCard.tsx - Cards de álbuns/playlists
5. Layout.tsx - Layout principal que organiza tudo

UI REQUIREMENTS:
- Fundo escuro: #121212
- Verde Spotify: #1DB954
- Sidebar esquerda com ícones
- Player fixo na parte inferior com:
  * Controles (anterior, play/pause, próximo)
  * Barra de progresso
  * Controle de volume
- Área principal com grid de cards
- Header com gradiente

MOCK DATA:
- Criar arquivo src/data/mockData.ts com:
  * 20+ playlists/álbuns com nome, artista, imagem
  * Lista de músicas para o player

RESPONSIVIDADE:
- Mobile (< 768px): Sidebar colapsada, layout simplificado
- Tablet (768-1024px): Sidebar menor
- Desktop (> 1024px): Layout completo

FUNCIONALIDADES:
- Player com play/pause funcional (simulado)
- Navegação entre seções
- Hover effects nos cards
- Estados visuais (playing, hover, etc)

PASSOS DE EXECUÇÃO:
1. Criar projeto Vite: npm create vite@latest . -- --template react-ts
2. Instalar dependências: npm install
3. Instalar Tailwind: npm install -D tailwindcss postcss autoprefixer
4. Configurar Tailwind: npx tailwindcss init -p
5. Instalar react-icons: npm install react-icons
6. Criar todos os componentes
7. Configurar index.css com Tailwind
8. Criar mockData.ts
9. Implementar App.tsx com Layout
10. Testar build: npm run build
11. Criar README.md com instruções

IMPORTANTE:
- Código limpo e profissional
- TypeScript strict
- Componentes modulares
- ESLint/Prettier configurados
- Build sem erros
- README com screenshots e instruções

Salvar TUDO em ${projectDir}
`;

let toolsUsed = new Set();
let steps = [];
let currentStep = 0;
let totalSteps = 0;

const result = await orchestrator.orchestrate(
	prompt.trim(),
	projectDir,
	(message, kanban) => {
		// Contar steps
		if (kanban && kanban.length > 0) {
			totalSteps = kanban.filter(t => !t.parentId).length;
			const inProgress = kanban.find(t => t.status === 'in_progress');
			if (inProgress) {
				currentStep = kanban.filter(t => 
					t.status === 'done' || t.status === 'in_progress'
				).length;
			}
		}

		// Detectar tools
		const toolMatch = message.match(/(?:tool|ferramenta):\s*(\w+)/i);
		if (toolMatch) {
			toolsUsed.add(toolMatch[1]);
		}

		// Log progresso
		if (message && message.trim()) {
			const progress = totalSteps > 0 ? `[${currentStep}/${totalSteps}]` : '';
			console.log(`${progress} ${message}`);
			
			if (message.includes('✅') || message.includes('completed')) {
				steps.push(message);
			}
		}
	}
);

console.log('\n' + '━'.repeat(80));
console.log('📊 ANÁLISE DA EXECUÇÃO\n');
console.log(`Modo: ${result.mode.toUpperCase()}`);
console.log(`Steps completados: ${steps.length}`);
console.log(`Tools utilizadas: ${Array.from(toolsUsed).join(', ') || 'Detectando...'}`);
console.log('\n' + '━'.repeat(80));
console.log('✅ Execução do Flui concluída!');
console.log('━'.repeat(80));

process.exit(0);
