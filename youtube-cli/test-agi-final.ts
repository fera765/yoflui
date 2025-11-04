/**
 * TESTE FINAL COMPLETO - MÚLTIPLOS CENÁRIOS REAIS
 */

import { CentralOrchestrator } from './source/agi/orchestrator.js';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function finalTests() {
	console.log('╔═══════════════════════════════════════════════════════════════════════╗');
	console.log('║         FLUI AGI - TESTES REAIS COMPLETOS COM QWEN LLM              ║');
	console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

	const orchestrator = new CentralOrchestrator();
	const workDir = join(process.cwd(), 'test-final-work');
	mkdirSync(workDir, { recursive: true });

	const tests = [
		{
			name: 'Tarefa Trivial (Conhecimento Direto)',
			prompt: 'Quanto é 2+2?',
			maxTime: 15
		},
		{
			name: 'Tarefa Simples (Explicação)',
			prompt: 'Explique em 2 linhas o que é machine learning',
			maxTime: 20
		},
		{
			name: 'Tarefa Média (Análise)',
			prompt: 'Compare as vantagens de Python vs JavaScript em 5 pontos',
			maxTime: 30
		}
	];

	let successCount = 0;
	let totalTime = 0;

	for (const test of tests) {
		console.log(`\n${'='.repeat(75)}`);
		console.log(`📝 ${test.name}`);
		console.log(`Prompt: "${test.prompt}"`);
		console.log(`${'='.repeat(75)}`);
		
		const startTime = Date.now();
		let success = false;
		
		try {
			const result = await orchestrator.orchestrate(
				test.prompt,
				workDir,
				(message) => {
					// Log apenas mensagens importantes
					if (message.includes('🧠') || message.includes('✅') || message.includes('🔧')) {
						console.log(`  ${message}`);
					}
				}
			);
			
			const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
			totalTime += parseFloat(elapsed);
			success = true;
			successCount++;
			
			console.log(`\n✅ SUCESSO (${elapsed}s):`);
			console.log(`${result.substring(0, 200)}${result.length > 200 ? '...' : ''}`);
			
		} catch (error) {
			const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
			console.log(`\n❌ FALHOU (${elapsed}s):`);
			console.log(error instanceof Error ? error.message : String(error));
		}
	}

	// Resumo final
	console.log(`\n\n╔═══════════════════════════════════════════════════════════════════════╗`);
	console.log(`║                         RESUMO DOS TESTES                            ║`);
	console.log(`╚═══════════════════════════════════════════════════════════════════════╝`);
	console.log(`\n📊 Resultados:`);
	console.log(`   ✅ Sucessos: ${successCount}/${tests.length}`);
	console.log(`   ⏱️  Tempo total: ${totalTime.toFixed(2)}s`);
	console.log(`   📈 Tempo médio: ${(totalTime / tests.length).toFixed(2)}s por teste`);
	console.log(`   🎯 Taxa de sucesso: ${((successCount / tests.length) * 100).toFixed(0)}%\n`);

	if (successCount === tests.length) {
		console.log('🎉 TODOS OS TESTES PASSARAM! FLUI AGI OPERACIONAL!\n');
	} else {
		console.log('⚠️  Alguns testes falharam. Sistema parcialmente funcional.\n');
	}
}

finalTests().catch(console.error);
