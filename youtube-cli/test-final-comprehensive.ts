/**
 * TESTE FINAL ABRANGENTE - TODAS CATEGORIAS
 * 100% REAL com Qwen LLM
 */

import { CentralOrchestrator } from './source/agi/orchestrator.js';
import { runAutonomousAgent } from './source/autonomous-agent.js';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
	name: string;
	mode: 'AGI' | 'LLM';
	success: boolean;
	time: number;
	result: string;
}

async function comprehensiveTest() {
	console.log('╔═══════════════════════════════════════════════════════════════════════╗');
	console.log('║      FLUI - TESTE FINAL ABRANGENTE (AGI vs LLM AUTÔNOMO)            ║');
	console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

	const orchestrator = new CentralOrchestrator();
	const workDir = join(process.cwd(), 'test-final');
	mkdirSync(workDir, { recursive: true });

	const allResults: TestResult[] = [];

	// CATEGORIA 1: TASKS SIMPLES (testar ambos os modos)
	const simpleTests = [
		{ prompt: 'Quanto é 144 / 12?', mode: 'AGI' as const },
		{ prompt: 'Quanto é 144 / 12?', mode: 'LLM' as const },
		{ prompt: 'O que é REST API em uma frase?', mode: 'AGI' as const },
		{ prompt: 'O que é REST API em uma frase?', mode: 'LLM' as const },
	];

	console.log('\n📂 CATEGORIA 1: TASKS SIMPLES (AGI vs LLM)');
	console.log('─────────────────────────────────────────────────────────────────────────\n');

	for (const test of simpleTests) {
		console.log(`[${test.mode}] "${test.prompt}"`);
		const start = Date.now();

		try {
			let result: string;
			
			if (test.mode === 'AGI') {
				result = await orchestrator.orchestrate(test.prompt, workDir);
			} else {
				result = await runAutonomousAgent({
					userMessage: test.prompt,
					workDir,
					onProgress: () => {},
					onKanbanUpdate: () => {},
					onToolExecute: () => {},
					onToolComplete: () => {}
				});
			}

			const time = ((Date.now() - start) / 1000).toFixed(2);
			const success = result.length > 10 && !result.includes('Erro');

			allResults.push({
				name: test.prompt,
				mode: test.mode,
				success,
				time: parseFloat(time),
				result: result.substring(0, 100)
			});

			console.log(`   ${success ? '✅' : '❌'} ${time}s - ${result.substring(0, 80)}...\n`);

		} catch (error) {
			const time = ((Date.now() - start) / 1000).toFixed(2);
			allResults.push({
				name: test.prompt,
				mode: test.mode,
				success: false,
				time: parseFloat(time),
				result: error instanceof Error ? error.message : 'Erro'
			});
			console.log(`   ❌ ${time}s - ERRO\n`);
		}
	}

	// CATEGORIA 2: TASKS COM TOOLS
	const toolTests = [
		{ prompt: 'Crie um arquivo hello.js com console.log("Hello World")', mode: 'AGI' as const },
		{ prompt: 'Execute ls -la para ver arquivos ocultos', mode: 'AGI' as const },
	];

	console.log('\n📂 CATEGORIA 2: TASKS COM TOOLS REAIS');
	console.log('─────────────────────────────────────────────────────────────────────────\n');

	for (const test of toolTests) {
		console.log(`[${test.mode}] "${test.prompt}"`);
		const start = Date.now();

		try {
			const result = await orchestrator.orchestrate(test.prompt, workDir);
			const time = ((Date.now() - start) / 1000).toFixed(2);
			const success = result.length > 10 && !result.includes('Falha após');

			allResults.push({
				name: test.prompt,
				mode: test.mode,
				success,
				time: parseFloat(time),
				result: result.substring(0, 100)
			});

			console.log(`   ${success ? '✅' : '❌'} ${time}s - ${result.substring(0, 80)}...\n`);

		} catch (error) {
			const time = ((Date.now() - start) / 1000).toFixed(2);
			allResults.push({
				name: test.prompt,
				mode: test.mode,
				success: false,
				time: parseFloat(time),
				result: 'ERRO'
			});
			console.log(`   ❌ ${time}s - ERRO\n`);
		}
	}

	// RESUMO FINAL
	console.log('\n\n╔═══════════════════════════════════════════════════════════════════════╗');
	console.log('║                         RESUMO FINAL                                 ║');
	console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

	const agiResults = allResults.filter(r => r.mode === 'AGI');
	const llmResults = allResults.filter(r => r.mode === 'LLM');

	console.log('📊 COMPARAÇÃO AGI vs LLM AUTÔNOMO:\n');

	console.log('🧠 MODO AGI:');
	console.log(`   Taxa de sucesso: ${agiResults.filter(r => r.success).length}/${agiResults.length} (${((agiResults.filter(r => r.success).length / agiResults.length) * 100).toFixed(0)}%)`);
	console.log(`   Tempo médio: ${(agiResults.reduce((a, r) => a + r.time, 0) / agiResults.length).toFixed(2)}s`);

	if (llmResults.length > 0) {
		console.log('\n🤖 MODO LLM:');
		console.log(`   Taxa de sucesso: ${llmResults.filter(r => r.success).length}/${llmResults.length} (${((llmResults.filter(r => r.success).length / llmResults.length) * 100).toFixed(0)}%)`);
		console.log(`   Tempo médio: ${(llmResults.reduce((a, r) => a + r.time, 0) / llmResults.length).toFixed(2)}s`);
	}

	console.log(`\n🏆 VEREDITO GERAL:`);
	const totalSuccess = allResults.filter(r => r.success).length;
	const totalTests = allResults.length;
	const successRate = (totalSuccess / totalTests) * 100;

	if (successRate === 100) {
		console.log(`   ✅ PERFEITO! 100% de taxa de sucesso`);
	} else if (successRate >= 80) {
		console.log(`   ✅ EXCELENTE! ${successRate.toFixed(0)}% de taxa de sucesso`);
	} else if (successRate >= 60) {
		console.log(`   ⚠️  BOM. ${successRate.toFixed(0)}% de taxa de sucesso`);
	} else {
		console.log(`   ❌ PRECISA MELHORIAS. ${successRate.toFixed(0)}% de taxa de sucesso`);
	}

	console.log(`\n   Total: ${totalSuccess}/${totalTests} testes bem-sucedidos`);
	console.log(`   Tempo total: ${allResults.reduce((a, r) => a + r.time, 0).toFixed(2)}s\n`);
}

comprehensiveTest().catch(console.error);
