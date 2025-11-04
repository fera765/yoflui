/**
 * TESTE COMPLEXO REAL - MÚLTIPLAS TOOLS E COORDENAÇÃO
 */

import { CentralOrchestrator } from './source/agi/orchestrator.js';
import { runAutonomousAgent } from './source/autonomous-agent.js';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function testComplexTasks() {
	console.log('🚀 TESTE DE TASKS COMPLEXAS - AGI vs LLM\n');

	const orchestrator = new CentralOrchestrator();
	const workDir = join(process.cwd(), 'test-complex');
	mkdirSync(workDir, { recursive: true });

	const complexTests = [
		{
			name: 'Task Complexa 1: Multi-arquivo',
			prompt: 'Crie 3 arquivos: hello.js com console.log, add.js com função de soma, e README.md descrevendo os arquivos',
			expectedFiles: 3
		},
		{
			name: 'Task Complexa 2: Análise + Shell',
			prompt: 'Liste todos os arquivos TypeScript no diretório source/agi e conte quantos existem',
			expectedFiles: 0
		},
		{
			name: 'Task Complexa 3: Código Funcional',
			prompt: 'Crie uma função TypeScript que valida email e retorne true/false, com teste de exemplo',
			expectedFiles: 0
		}
	];

	let agiSuccess = 0;
	let agiTime = 0;

	console.log('═══════════════════════════════════════════════════════════════════════');
	console.log('MODO AGI - TASKS COMPLEXAS');
	console.log('═══════════════════════════════════════════════════════════════════════\n');

	for (const test of complexTests) {
		console.log(`📝 ${test.name}`);
		console.log(`Prompt: "${test.prompt}"`);
		console.log(`${'─'.repeat(75)}`);

		const start = Date.now();

		try {
			const result = await orchestrator.orchestrate(
				test.prompt,
				workDir,
				(message) => {
					if (message.includes('✅') || message.includes('🔧')) {
						console.log(`  ${message}`);
					}
				}
			);

			const time = ((Date.now() - start) / 1000).toFixed(2);
			agiTime += parseFloat(time);

			const success = result && result.length > 50 && !result.includes('Falha após');

			if (success) {
				agiSuccess++;
				console.log(`\n✅ SUCESSO (${time}s)`);
				console.log(`Resultado: ${result.substring(0, 150)}...\n`);
			} else {
				console.log(`\n⚠️  RESULTADO PARCIAL (${time}s)\n`);
			}

		} catch (error) {
			const time = ((Date.now() - start) / 1000).toFixed(2);
			console.log(`\n❌ ERRO (${time}s): ${error instanceof Error ? error.message : 'Erro'}\n`);
		}
	}

	console.log('\n═══════════════════════════════════════════════════════════════════════');
	console.log('MODO LLM AUTÔNOMO - TASKS COMPLEXAS');
	console.log('═══════════════════════════════════════════════════════════════════════\n');

	let llmSuccess = 0;
	let llmTime = 0;

	for (const test of complexTests) {
		console.log(`📝 ${test.name}`);
		console.log(`Prompt: "${test.prompt}"`);
		console.log(`${'─'.repeat(75)}`);

		const start = Date.now();

		try {
			const result = await runAutonomousAgent({
				userMessage: test.prompt,
				workDir,
				onProgress: () => {},
				onKanbanUpdate: () => {},
				onToolExecute: (name) => console.log(`  🔧 ${name}`),
				onToolComplete: (name) => console.log(`  ✅ ${name}`)
			});

			const time = ((Date.now() - start) / 1000).toFixed(2);
			llmTime += parseFloat(time);

			const success = result && result.length > 50;

			if (success) {
				llmSuccess++;
				console.log(`\n✅ SUCESSO (${time}s)`);
				console.log(`Resultado: ${result.substring(0, 150)}...\n`);
			} else {
				console.log(`\n⚠️  RESULTADO PARCIAL (${time}s)\n`);
			}

		} catch (error) {
			const time = ((Date.now() - start) / 1000).toFixed(2);
			console.log(`\n❌ ERRO (${time}s): ${error instanceof Error ? error.message : 'Erro'}\n`);
		}
	}

	// ANÁLISE COMPARATIVA
	console.log('\n╔═══════════════════════════════════════════════════════════════════════╗');
	console.log('║                    ANÁLISE COMPARATIVA FINAL                         ║');
	console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

	console.log('📊 RESULTADOS POR MODO:\n');
	
	console.log('🧠 MODO AGI:');
	console.log(`   ✅ Sucesso: ${agiSuccess}/${complexTests.length} (${((agiSuccess/complexTests.length)*100).toFixed(0)}%)`);
	console.log(`   ⏱️  Tempo médio: ${(agiTime/complexTests.length).toFixed(2)}s`);
	
	console.log('\n🤖 MODO LLM AUTÔNOMO:');
	console.log(`   ✅ Sucesso: ${llmSuccess}/${complexTests.length} (${((llmSuccess/complexTests.length)*100).toFixed(0)}%)`);
	console.log(`   ⏱️  Tempo médio: ${(llmTime/complexTests.length).toFixed(2)}s`);

	// Vencedor
	console.log('\n🏆 VENCEDOR PARA TASKS COMPLEXAS:');
	if (agiSuccess > llmSuccess) {
		console.log(`   🧠 AGI (${agiSuccess}/${complexTests.length} vs ${llmSuccess}/${complexTests.length})`);
	} else if (llmSuccess > agiSuccess) {
		console.log(`   🤖 LLM Autônomo (${llmSuccess}/${complexTests.length} vs ${agiSuccess}/${complexTests.length})`);
	} else {
		const agiAvg = agiTime / complexTests.length;
		const llmAvg = llmTime / complexTests.length;
		console.log(`   ${agiAvg < llmAvg ? '🧠 AGI' : '🤖 LLM'} (empate em sucesso, ${agiAvg < llmAvg ? 'AGI' : 'LLM'} mais rápido)`);
	}

	console.log('\n');
}

testComplexTasks().catch(console.error);
