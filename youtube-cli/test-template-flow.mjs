#!/usr/bin/env node

import { CentralOrchestratorV2 } from './source/agi/orchestrator-v2.js';
import { existsSync, mkdirSync, rmSync } from 'fs';

const projectDir = '/workspace/spotify-clone-test';

console.log('\n🧪 TESTE: FLUXO DE TEMPLATE FRONTEND\n');
console.log('━'.repeat(80));

// Limpar diretório se existir
if (existsSync(projectDir)) {
	console.log('🗑️  Limpando diretório anterior...');
	rmSync(projectDir, { recursive: true, force: true });
}

// Criar diretório
mkdirSync(projectDir, { recursive: true });

const orchestrator = new CentralOrchestratorV2();

// Prompt de teste - deve acionar o template
const prompt = `
Criar um clone da interface do Spotify usando React + Tailwind + Vite.
Interface responsiva e moderna com player de música.
`;

console.log('📝 Prompt de teste:');
console.log(prompt.trim());
console.log('\n' + '━'.repeat(80) + '\n');

let logs = [];

orchestrator.orchestrate(
	prompt.trim(),
	projectDir,
	(message) => {
		console.log(message);
		logs.push(message);
	}
).then(result => {
	console.log('\n' + '━'.repeat(80));
	console.log('📊 RESULTADO FINAL\n');
	console.log(result.result);
	console.log('\n' + '━'.repeat(80));
	
	// Validar se o template foi clonado
	console.log('\n🔍 VALIDAÇÃO:\n');
	
	const checkTemplate = [
		'🎯 Detectado: Criação de Frontend',
		'📦 Clonando template',
		'✅ Template clonado'
	];
	
	let templateUsed = false;
	checkTemplate.forEach(check => {
		const found = logs.some(log => log.includes(check));
		console.log(`${found ? '✅' : '❌'} ${check}`);
		if (found) templateUsed = true;
	});
	
	// Verificar arquivos do template
	if (existsSync(`${projectDir}/package.json`)) {
		console.log('✅ package.json existe (do template)');
	} else {
		console.log('❌ package.json não encontrado');
	}
	
	if (existsSync(`${projectDir}/vite.config.ts`)) {
		console.log('✅ vite.config.ts existe (do template)');
	} else {
		console.log('❌ vite.config.ts não encontrado');
	}
	
	console.log(`\n${templateUsed ? '🎉' : '⚠️'} Template ${templateUsed ? 'FOI' : 'NÃO FOI'} utilizado\n`);
	
}).catch(error => {
	console.error('\n❌ ERRO:', error);
	process.exit(1);
});
