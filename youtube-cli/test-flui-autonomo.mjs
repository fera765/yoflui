#!/usr/bin/env node

import { CentralOrchestratorV2 } from './source/agi/orchestrator-v2.js';
import { existsSync, mkdirSync, rmSync } from 'fs';

const projectDir = '/workspace/spotify-clone';

console.log('\n🎯 TESTE COMPLETO: FLUI AUTÔNOMO - SPOTIFY CLONE\n');
console.log('━'.repeat(80));

// Limpar diretório
if (existsSync(projectDir)) {
	rmSync(projectDir, { recursive: true, force: true });
}
mkdirSync(projectDir, { recursive: true });

const orchestrator = new CentralOrchestratorV2();

// Prompt real - Flui deve fazer TUDO
const prompt = `
Criar um clone completo da interface do Spotify usando React + Tailwind + Vite.

TAREFAS QUE VOCÊ DEVE FAZER AUTONOMAMENTE:
1. Usar o template que foi clonado como base
2. Desenvolver componentes do Spotify (Sidebar, Player, Header, Cards)
3. Implementar UI responsiva e moderna
4. Adicionar mock de dados (playlists, músicas)
5. EXECUTAR npm install
6. EXECUTAR npm run build
7. EXECUTAR npm run dev em background
8. TESTAR com curl http://localhost:5173
9. CORRIGIR qualquer erro encontrado
10. VALIDAR que o projeto está funcionando

IMPORTANTE: Você deve fazer TUDO sozinho, incluindo instalar, buildar e testar!
`;

let allLogs = [];
let lastLogCount = 0;

orchestrator.orchestrate(
	prompt.trim(),
	projectDir,
	(message) => {
		console.log(message);
		allLogs.push({
			time: new Date().toISOString(),
			message
		});
	}
).then(result => {
	console.log('\n' + '━'.repeat(80));
	console.log('📊 EXECUÇÃO COMPLETA\n');
	console.log(result.result);
	console.log('\n' + '━'.repeat(80));
	
	// Salvar logs para análise
	import('fs').then(fs => {
		fs.writeFileSync('/tmp/flui-complete-log.json', JSON.stringify(allLogs, null, 2));
	});
	
}).catch(error => {
	console.error('\n❌ ERRO:', error);
	import('fs').then(fs => {
		fs.writeFileSync('/tmp/flui-error-log.json', JSON.stringify({ error: error.message, allLogs }, null, 2));
	});
});
