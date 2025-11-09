import { CentralOrchestratorV2 } from './source/agi/orchestrator-v2.js';

console.log('\n🎵 TESTE FLUI 10/10: CRIAR CLONE DO SPOTIFY\n');
console.log('━'.repeat(80));

const orchestrator = new CentralOrchestratorV2();

const prompt = `
Criar um clone da UI do Spotify com React + TypeScript + Vite + Tailwind CSS.

COMPONENTES:
1. Sidebar.tsx - navegação lateral
2. Player.tsx - player fixo na parte inferior  
3. PlaylistCard.tsx - cards de álbuns
4. Header.tsx - header com gradiente
5. Layout.tsx - layout principal

REQUISITOS:
- Cores do Spotify: fundo #121212, verde #1DB954
- Responsivo: mobile/tablet/desktop
- Mock de 20 playlists
- Player funcional com play/pause
- Instalar dependências e fazer build

Salvar em /workspace/spotify-clone
`;

try {
	const result = await orchestrator.orchestrate(
		prompt,
		'/workspace/spotify-clone',
		(message, kanban) => {
			if (message) console.log(message);
		}
	);
	
	console.log('\n✅ Concluído!');
	console.log('Resultado:', result.result.substring(0, 200));
} catch (error) {
	console.error('❌ Erro:', error);
}
