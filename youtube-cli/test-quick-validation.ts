/**
 * VALIDAÇÃO RÁPIDA PÓS-OTIMIZAÇÃO
 */

import { CentralOrchestrator } from './source/agi/orchestrator.js';
import { mkdirSync } from 'fs';
import { join } from 'path';

const quickTests = [
	'Quanto é 25 * 4?',
	'O que é API em uma frase?',
	'Compare Python vs Ruby em 2 pontos',
	'Liste 2 vantagens de usar Docker',
	'Crie uma função que soma dois números'
];

async function quickValidation() {
	console.log('🚀 VALIDAÇÃO RÁPIDA - FLUI AGI OTIMIZADO\n');
	
	const orchestrator = new CentralOrchestrator();
	const workDir = join(process.cwd(), 'test-quick');
	mkdirSync(workDir, { recursive: true });

	let success = 0;
	let totalTime = 0;

	for (let i = 0; i < quickTests.length; i++) {
		const prompt = quickTests[i];
		console.log(`\n[${i + 1}/${quickTests.length}] ${prompt}`);
		
		const start = Date.now();
		try {
			const result = await orchestrator.orchestrate(prompt, workDir);
			const time = ((Date.now() - start) / 1000).toFixed(2);
			totalTime += parseFloat(time);
			
			if (result && result.length > 10) {
				success++;
				console.log(`✅ ${time}s - ${result.substring(0, 80)}...`);
			} else {
				console.log(`⚠️  ${time}s - Resultado inválido`);
			}
		} catch (error) {
			const time = ((Date.now() - start) / 1000).toFixed(2);
			console.log(`❌ ${time}s - ${error instanceof Error ? error.message : 'Erro'}`);
		}
	}

	console.log(`\n📊 RESULTADO: ${success}/${quickTests.length} (${((success/quickTests.length)*100).toFixed(0)}%)`);
	console.log(`⏱️  Tempo médio: ${(totalTime/quickTests.length).toFixed(2)}s`);
	console.log(success === quickTests.length ? '\n🎉 PERFEITO!\n' : '\n⚠️  Precisa ajustes\n');
}

quickValidation().catch(console.error);
