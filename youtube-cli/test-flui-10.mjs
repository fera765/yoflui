#!/usr/bin/env node

import { CentralOrchestratorV2 } from './source/agi/orchestrator-v2.js';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';

const projectDir = '/workspace/spotify-clone-final';

console.log('\n🎯 TESTE FLUI 10/10 - COM TEMPLATE CONFIGURADO\n');
console.log('━'.repeat(80));

if (existsSync(projectDir)) {
	rmSync(projectDir, { recursive: true, force: true });
}
mkdirSync(projectDir, { recursive: true });

const orchestrator = new CentralOrchestratorV2();

const prompt = `
Criar um clone da interface do Spotify usando React + Tailwind + Vite.

Requisitos:
- Sidebar lateral com navegação (Home, Search, Library)
- Player de música fixo na parte inferior com controles
- Header com gradiente
- Cards de playlists/álbuns
- Mock de dados (20 playlists, 15 músicas)
- UI responsiva igual ao Spotify
- Cores: #1DB954 (verde), #121212 (fundo), #000000 (sidebar)

Build funcional sem erros.
`;

let logs = [];
let start = Date.now();

orchestrator.orchestrate(
	prompt.trim(),
	projectDir,
	(msg) => {
		const time = ((Date.now() - start) / 1000).toFixed(1);
		const log = `[${time}s] ${msg}`;
		console.log(log);
		logs.push(log);
	}
).then(result => {
	const total = ((Date.now() - start) / 1000).toFixed(1);
	console.log(`\n⏱️  Total: ${total}s\n${result.result}\n`);
	writeFileSync('/tmp/flui-10-result.json', JSON.stringify({ total, logs, result }, null, 2));
}).catch(error => {
	console.error(`\n❌ ${error}\n`);
	writeFileSync('/tmp/flui-10-error.json', JSON.stringify({ error: error.message, logs }, null, 2));
});
