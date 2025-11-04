/**
 * INVESTIGAÇÃO: Por que teste de comparação demorou 86s?
 * Testando com logging detalhado
 */

import { CentralOrchestrator } from './source/agi/orchestrator.js';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function investigateSlowness() {
	console.log('🔍 INVESTIGANDO LENTIDÃO - ANÁLISE DETALHADA\n');

	const orchestrator = new CentralOrchestrator();
	const workDir = join(process.cwd(), 'test-investigate');
	mkdirSync(workDir, { recursive: true });

	const testCases = [
		'Compare Python vs Ruby em 2 pontos',
		'Compare TypeScript vs JavaScript em 2 pontos',
		'Quais as diferenças entre SQL e NoSQL?'
	];

	for (const prompt of testCases) {
		console.log(`\n${'='.repeat(75)}`);
		console.log(`📝 TESTE: ${prompt}`);
		console.log(`${'='.repeat(75)}\n`);

		const timestamps: Array<{ phase: string; time: number }> = [];
		let phaseStart = Date.now();

		const logPhase = (phase: string) => {
			const now = Date.now();
			const elapsed = ((now - phaseStart) / 1000).toFixed(2);
			timestamps.push({ phase, time: parseFloat(elapsed) });
			console.log(`⏱️  ${phase}: ${elapsed}s`);
			phaseStart = now;
		};

		const overallStart = Date.now();

		try {
			const result = await orchestrator.orchestrate(
				prompt,
				workDir,
				(message, kanban) => {
					// Log fases com timestamps
					if (message.includes('Analisando intenção')) {
						logPhase('Análise de Intenção');
					} else if (message.includes('Planejando decomposição')) {
						logPhase('Decomposição');
					} else if (message.includes('Sub-tarefas na fila')) {
						logPhase('Enfileiramento');
					} else if (message.includes('Executando:')) {
						logPhase(`Execução - ${message.substring(message.indexOf(':') + 2)}`);
					} else if (message.includes('Revisando:')) {
						logPhase('Revisão');
					} else if (message.includes('Concluído:')) {
						logPhase('Conclusão');
					} else if (message.includes('Replanejando')) {
						logPhase('❌ REPLANEJAMENTO (problema!)');
					}

					console.log(`   ${message}`);
				}
			);

			const totalTime = ((Date.now() - overallStart) / 1000).toFixed(2);
			logPhase('Síntese Final');

			console.log(`\n✅ RESULTADO (${totalTime}s total):`);
			console.log(`   ${result.substring(0, 150)}...\n`);

			console.log(`📊 BREAKDOWN DE TEMPO:`);
			timestamps.forEach((t, i) => {
				console.log(`   ${i + 1}. ${t.phase}: ${t.time}s`);
			});

			// Identificar gargalo
			const slowest = timestamps.reduce((max, t) => t.time > max.time ? t : max);
			console.log(`\n🐌 GARGALO: ${slowest.phase} (${slowest.time}s)`);

		} catch (error) {
			console.log(`\n❌ ERRO: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}

investigateSlowness().catch(console.error);
