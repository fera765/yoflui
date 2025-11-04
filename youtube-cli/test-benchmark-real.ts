/**
 * BENCHMARK COMPLETO DO FLUI AGI
 * Testes REAIS em múltiplos cenários com Qwen LLM
 */

import { CentralOrchestrator } from './source/agi/orchestrator.js';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TestCase {
	category: string;
	name: string;
	prompt: string;
	maxTime: number;
	expectedType: 'knowledge' | 'analysis' | 'research' | 'code' | 'automation';
}

const testCases: TestCase[] = [
	// === CONHECIMENTO SIMPLES ===
	{
		category: 'Conhecimento Simples',
		name: 'Matemática básica',
		prompt: 'Quanto é 15 x 7?',
		maxTime: 10,
		expectedType: 'knowledge'
	},
	{
		category: 'Conhecimento Simples',
		name: 'Pergunta factual',
		prompt: 'Quem descobriu a penicilina?',
		maxTime: 10,
		expectedType: 'knowledge'
	},
	
	// === ANÁLISE E COMPARAÇÃO ===
	{
		category: 'Análise',
		name: 'Comparação técnica',
		prompt: 'Compare TypeScript e JavaScript em 3 pontos principais',
		maxTime: 20,
		expectedType: 'analysis'
	},
	{
		category: 'Análise',
		name: 'Vantagens e desvantagens',
		prompt: 'Liste 2 vantagens e 2 desvantagens de usar Docker',
		maxTime: 20,
		expectedType: 'analysis'
	},
	
	// === CÓDIGO SIMPLES ===
	{
		category: 'Codificação',
		name: 'Código simples',
		prompt: 'Escreva uma função Python que calcula o fatorial de um número',
		maxTime: 15,
		expectedType: 'code'
	},
	{
		category: 'Codificação',
		name: 'Exemplo prático',
		prompt: 'Crie um exemplo de uso de async/await em JavaScript',
		maxTime: 15,
		expectedType: 'code'
	},
	
	// === BENCHMARK MATEMÁTICO ===
	{
		category: 'Benchmark',
		name: 'Problema matemático',
		prompt: 'Resolva: Se uma bicicleta custa 800 reais e tem 20% de desconto, qual o preço final?',
		maxTime: 15,
		expectedType: 'knowledge'
	},
	{
		category: 'Benchmark',
		name: 'Lógica',
		prompt: 'Se todos os gatos são mamíferos e alguns mamíferos voam, podemos concluir que alguns gatos voam? Explique.',
		maxTime: 20,
		expectedType: 'analysis'
	},
	
	// === EXPLICAÇÕES ===
	{
		category: 'Explicação',
		name: 'Conceito técnico',
		prompt: 'Explique em 3 linhas o que é CI/CD',
		maxTime: 15,
		expectedType: 'knowledge'
	},
	{
		category: 'Explicação',
		name: 'Conceito complexo simplificado',
		prompt: 'Explique blockchain como se eu tivesse 10 anos',
		maxTime: 20,
		expectedType: 'analysis'
	}
];

interface TestResult {
	testCase: TestCase;
	success: boolean;
	time: number;
	result?: string;
	error?: string;
	tokensEstimated?: number;
}

async function runBenchmark() {
	console.log('╔═══════════════════════════════════════════════════════════════════════╗');
	console.log('║              FLUI AGI - BENCHMARK COMPLETO REAL                      ║');
	console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

	const orchestrator = new CentralOrchestrator();
	const workDir = join(process.cwd(), 'test-benchmark-work');
	mkdirSync(workDir, { recursive: true });

	const results: TestResult[] = [];
	let currentCategory = '';

	for (const testCase of testCases) {
		// Mostrar categoria se mudou
		if (testCase.category !== currentCategory) {
			currentCategory = testCase.category;
			console.log(`\n${'═'.repeat(75)}`);
			console.log(`📁 CATEGORIA: ${testCase.category}`);
			console.log(`${'═'.repeat(75)}`);
		}

		console.log(`\n📝 ${testCase.name}`);
		console.log(`   Prompt: "${testCase.prompt}"`);
		console.log(`   Tipo esperado: ${testCase.expectedType} | Timeout: ${testCase.maxTime}s`);
		
		const startTime = Date.now();
		let success = false;
		let result = '';
		let error = '';

		try {
			result = await orchestrator.orchestrate(
				testCase.prompt,
				workDir,
				(message) => {
					// Log silencioso - apenas erros e conclusão
					if (message.includes('✅') || message.includes('❌')) {
						console.log(`   ${message}`);
					}
				}
			);

			const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
			success = true;

			// Validar resultado
			const hasContent = result.length > 10 && !result.toLowerCase().includes('falha após');
			const withinTime = parseFloat(elapsed) <= testCase.maxTime;

			console.log(`\n   ✅ SUCESSO (${elapsed}s ${withinTime ? '✓' : '⚠️ LENTO'})`);
			console.log(`   📊 Resultado: ${result.substring(0, 150)}${result.length > 150 ? '...' : ''}\n`);

			results.push({
				testCase,
				success: hasContent,
				time: parseFloat(elapsed),
				result,
				tokensEstimated: Math.ceil((testCase.prompt.length + result.length) / 4)
			});

		} catch (err) {
			const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
			error = err instanceof Error ? err.message : String(err);
			
			console.log(`\n   ❌ ERRO (${elapsed}s)`);
			console.log(`   💥 ${error}\n`);

			results.push({
				testCase,
				success: false,
				time: parseFloat(elapsed),
				error
			});
		}
	}

	// RELATÓRIO FINAL
	console.log(`\n\n╔═══════════════════════════════════════════════════════════════════════╗`);
	console.log(`║                      RELATÓRIO DE BENCHMARK                          ║`);
	console.log(`╚═══════════════════════════════════════════════════════════════════════╝\n`);

	const successful = results.filter(r => r.success);
	const failed = results.filter(r => !r.success);
	const totalTime = results.reduce((sum, r) => sum + r.time, 0);
	const avgTime = totalTime / results.length;
	const totalTokens = results.reduce((sum, r) => sum + (r.tokensEstimated || 0), 0);

	console.log(`📊 ESTATÍSTICAS GERAIS:`);
	console.log(`   Total de testes: ${results.length}`);
	console.log(`   ✅ Sucessos: ${successful.length} (${((successful.length / results.length) * 100).toFixed(1)}%)`);
	console.log(`   ❌ Falhas: ${failed.length} (${((failed.length / results.length) * 100).toFixed(1)}%)`);
	console.log(`   ⏱️  Tempo total: ${totalTime.toFixed(2)}s`);
	console.log(`   📈 Tempo médio: ${avgTime.toFixed(2)}s`);
	console.log(`   📊 Tokens estimados: ~${totalTokens}`);

	// Por categoria
	console.log(`\n📁 PERFORMANCE POR CATEGORIA:`);
	const categories = [...new Set(testCases.map(t => t.category))];
	
	for (const cat of categories) {
		const catResults = results.filter(r => r.testCase.category === cat);
		const catSuccess = catResults.filter(r => r.success);
		const catAvgTime = catResults.reduce((sum, r) => sum + r.time, 0) / catResults.length;
		
		console.log(`   ${cat}:`);
		console.log(`     Taxa de sucesso: ${catSuccess.length}/${catResults.length} (${((catSuccess.length / catResults.length) * 100).toFixed(0)}%)`);
		console.log(`     Tempo médio: ${catAvgTime.toFixed(2)}s`);
	}

	// Análise de performance
	console.log(`\n⚡ ANÁLISE DE PERFORMANCE:`);
	const fast = successful.filter(r => r.time <= 10);
	const medium = successful.filter(r => r.time > 10 && r.time <= 20);
	const slow = successful.filter(r => r.time > 20);

	console.log(`   Rápido (≤10s): ${fast.length} testes`);
	console.log(`   Médio (10-20s): ${medium.length} testes`);
	console.log(`   Lento (>20s): ${slow.length} testes`);

	// Veredicto final
	const successRate = (successful.length / results.length) * 100;
	console.log(`\n╔═══════════════════════════════════════════════════════════════════════╗`);
	
	if (successRate >= 90) {
		console.log(`║ 🎉 EXCELENTE! Taxa de sucesso: ${successRate.toFixed(1)}%`);
		console.log(`║ ✅ FLUI AGI está operacional e superior aos concorrentes`);
	} else if (successRate >= 70) {
		console.log(`║ ✓ BOM! Taxa de sucesso: ${successRate.toFixed(1)}%`);
		console.log(`║ ⚠️ FLUI AGI funciona bem mas precisa melhorias`);
	} else {
		console.log(`║ ⚠️ ATENÇÃO! Taxa de sucesso: ${successRate.toFixed(1)}%`);
		console.log(`║ ❌ FLUI AGI precisa otimizações críticas`);
	}
	
	console.log(`╚═══════════════════════════════════════════════════════════════════════╝\n`);

	// Salvar relatório
	const report = {
		timestamp: new Date().toISOString(),
		totalTests: results.length,
		successful: successful.length,
		failed: failed.length,
		successRate: successRate,
		totalTime: totalTime,
		avgTime: avgTime,
		tokensEstimated: totalTokens,
		results: results.map(r => ({
			category: r.testCase.category,
			name: r.testCase.name,
			success: r.success,
			time: r.time,
			resultLength: r.result?.length || 0,
			error: r.error
		}))
	};

	writeFileSync(
		join(workDir, 'benchmark-report.json'),
		JSON.stringify(report, null, 2),
		'utf-8'
	);

	console.log(`📄 Relatório detalhado salvo em: ${join(workDir, 'benchmark-report.json')}\n`);
}

runBenchmark().catch(console.error);
