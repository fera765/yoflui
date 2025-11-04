/**
 * TESTE REAL DO FLUI AGI
 * Sem mocks, sem simulações - apenas chamadas reais para Qwen
 */

import { CentralOrchestrator } from './source/agi/orchestrator.js';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function testAGI() {
	console.log('╔════════════════════════════════════════════════════════════════╗');
	console.log('║         TESTE REAL FLUI AGI - CHAMADAS REAIS QWEN LLM        ║');
	console.log('╚════════════════════════════════════════════════════════════════╝\n');

	const orchestrator = new CentralOrchestrator();
	const workDir = join(process.cwd(), 'test-agi-work');
	mkdirSync(workDir, { recursive: true });

	// TESTE 1: Tarefa simples
	console.log('\n📝 TESTE 1: Tarefa Simples');
	console.log('─────────────────────────────────────────────────────────────────');
	const startTime1 = Date.now();
	try {
		const result1 = await orchestrator.orchestrate(
			'Explique em 3 linhas o que é inteligência artificial',
			workDir,
			(message, kanban) => {
				console.log(`   ℹ️  ${message}`);
				if (kanban && kanban.length > 0) {
					const summary = kanban.reduce((acc, t) => {
						acc[t.column] = (acc[t.column] || 0) + 1;
						return acc;
					}, {} as Record<string, number>);
					console.log(`   📊 Kanban: ${JSON.stringify(summary)}`);
				}
			}
		);
		const time1 = ((Date.now() - startTime1) / 1000).toFixed(2);
		console.log(`\n✅ RESULTADO (${time1}s):\n${result1}\n`);
	} catch (error) {
		console.log(`\n❌ ERRO: ${error instanceof Error ? error.message : String(error)}\n`);
	}

	// TESTE 2: Tarefa de pesquisa (média complexidade)
	console.log('\n🔬 TESTE 2: Tarefa de Pesquisa (Complexidade Média)');
	console.log('─────────────────────────────────────────────────────────────────');
	const startTime2 = Date.now();
	try {
		const result2 = await orchestrator.orchestrate(
			'Crie uma análise comparativa entre Python e JavaScript para desenvolvimento web',
			workDir,
			(message, kanban) => {
				console.log(`   ℹ️  ${message}`);
				if (kanban && kanban.length > 5) {
					const inProgress = kanban.filter(t => t.column === 'in_progress').length;
					const completed = kanban.filter(t => t.column === 'completed').length;
					console.log(`   📊 Progresso: ${completed}/${kanban.length - 1} completas, ${inProgress} em andamento`);
				}
			}
		);
		const time2 = ((Date.now() - startTime2) / 1000).toFixed(2);
		console.log(`\n✅ RESULTADO (${time2}s):\n${result2.substring(0, 500)}...\n`);
	} catch (error) {
		console.log(`\n❌ ERRO: ${error instanceof Error ? error.message : String(error)}\n`);
	}

	// TESTE 3: Tarefa complexa com múltiplas etapas
	console.log('\n🚀 TESTE 3: Tarefa Complexa (Multi-Step)');
	console.log('─────────────────────────────────────────────────────────────────');
	const startTime3 = Date.now();
	try {
		const result3 = await orchestrator.orchestrate(
			'Desenvolver um plano de estudo de 30 dias para aprender machine learning, incluindo recursos, tópicos diários e projetos práticos',
			workDir,
			(message, kanban) => {
				console.log(`   ℹ️  ${message}`);
				if (kanban && kanban.length > 0) {
					const columns = ['received', 'planning', 'execution_queue', 'in_progress', 'review', 'completed', 'replanning', 'delivery'];
					const status = columns.map(col => {
						const count = kanban.filter(t => t.column === col).length;
						return count > 0 ? `${col}: ${count}` : '';
					}).filter(s => s).join(', ');
					console.log(`   📊 ${status}`);
				}
			}
		);
		const time3 = ((Date.now() - startTime3) / 1000).toFixed(2);
		console.log(`\n✅ RESULTADO (${time3}s):\n${result3.substring(0, 800)}...\n`);
	} catch (error) {
		console.log(`\n❌ ERRO: ${error instanceof Error ? error.message : String(error)}\n`);
	}

	console.log('\n╔════════════════════════════════════════════════════════════════╗');
	console.log('║                    TESTES FINALIZADOS                          ║');
	console.log('╚════════════════════════════════════════════════════════════════╝\n');
}

// Executar testes
testAGI().catch(console.error);
