/**
 * TESTE AGI COM DEBUG DETALHADO
 */

import { CentralOrchestrator } from './source/agi/orchestrator.js';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function testDebug() {
	console.log('DEBUG: Iniciando teste\n');

	const orchestrator = new CentralOrchestrator();
	const workDir = join(process.cwd(), 'test-debug');
	mkdirSync(workDir, { recursive: true });

	let errorCount = 0;
	let lastError = '';

	try {
		const result = await orchestrator.orchestrate(
			'Qual é a capital do Brasil?',
			workDir,
			(message, kanban) => {
				if (message.includes('Erro') || message.includes('⚠️')) {
					errorCount++;
					lastError = message;
					
					// Capturar erro após 3 tentativas
					if (errorCount >= 3) {
						console.log(`\n🚨 ERRO REPETIDO ${errorCount}x:`);
						console.log(message);
						
						// Ver estado do kanban
						if (kanban) {
							const failedTask = kanban.find(t => t.column === 'replanning');
							if (failedTask) {
								console.log('\n📋 Tarefa falhada:');
								console.log(JSON.stringify(failedTask, null, 2));
							}
						}
						
						// Forçar erro após 3 tentativas para não looping
						if (errorCount >= 3) {
							throw new Error('Loop de replanejamento detectado');
						}
					}
				} else {
					console.log(message);
				}
			}
		);
		
		console.log(`\n✅ SUCESSO: ${result}\n`);
	} catch (error) {
		console.log(`\n❌ ERRO FINAL: ${error instanceof Error ? error.message : String(error)}`);
		console.log(`Total de erros: ${errorCount}`);
		console.log(`Último erro: ${lastError}`);
	}
}

testDebug().catch(err => {
	console.error('FALHA CRÍTICA:', err);
	process.exit(1);
});
