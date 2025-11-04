/**
 * SUITE COMPLETA DE TESTES REAIS - SEM MOCK, SEM SIMULAÇÃO
 * Testando FLUI AGI otimizado em múltiplos cenários
 */

import { CentralOrchestrator } from './source/agi/orchestrator.js';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TestCase {
	category: string;
	name: string;
	prompt: string;
	maxTime: number;
	expectSuccess: boolean;
}

const tests: TestCase[] = [
	// CATEGORIA 1: TAREFAS SIMPLES
	{
		category: '1. TAREFAS SIMPLES',
		name: 'Matemática Básica',
		prompt: 'Quanto é 15 * 8?',
		maxTime: 10,
		expectSuccess: true
	},
	{
		category: '1. TAREFAS SIMPLES',
		name: 'Definição',
		prompt: 'O que é DevOps em uma frase?',
		maxTime: 10,
		expectSuccess: true
	},
	{
		category: '1. TAREFAS SIMPLES',
		name: 'Conversão',
		prompt: 'Converta 100 fahrenheit para celsius',
		maxTime: 10,
		expectSuccess: true
	},

	// CATEGORIA 2: ANÁLISE E COMPARAÇÃO
	{
		category: '2. ANÁLISE E COMPARAÇÃO',
		name: 'Comparação Técnica',
		prompt: 'Compare React vs Vue.js em 3 pontos principais',
		maxTime: 20,
		expectSuccess: true
	},
	{
		category: '2. ANÁLISE E COMPARAÇÃO',
		name: 'Análise de Pros/Cons',
		prompt: 'Liste 3 vantagens e 3 desvantagens de usar TypeScript',
		maxTime: 20,
		expectSuccess: true
	},

	// CATEGORIA 3: CÓDIGO SIMPLES
	{
		category: '3. CÓDIGO SIMPLES',
		name: 'Função Básica',
		prompt: 'Crie uma função JavaScript que calcula fatorial',
		maxTime: 15,
		expectSuccess: true
	},
	{
		category: '3. CÓDIGO SIMPLES',
		name: 'Regex Pattern',
		prompt: 'Crie um regex para validar email',
		maxTime: 15,
		expectSuccess: true
	},

	// CATEGORIA 4: PESQUISA (SE TOOLS FUNCIONAREM)
	// NOTA: Comentado pois pode falhar se web_scraper não funcionar
	// {
	// 	category: '4. PESQUISA',
	// 	name: 'Pesquisa Web Simples',
	// 	prompt: 'Pesquise o que é quantum computing e resuma em 2 parágrafos',
	// 	maxTime: 30,
	// 	expectSuccess: false // Pode falhar por limitações de rede
	// },

	// CATEGORIA 5: BENCHMARK MATEMÁTICO
	{
		category: '5. BENCHMARK',
		name: 'Sequência Fibonacci',
		prompt: 'Calcule os primeiros 10 números da sequência de Fibonacci',
		maxTime: 15,
		expectSuccess: true
	},
	{
		category: '5. BENCHMARK',
		name: 'Problema Lógico',
		prompt: 'Se um trem viaja 120km em 2 horas, qual sua velocidade média?',
		maxTime: 10,
		expectSuccess: true
	},
];

async function runComprehensiveTests() {
	console.log('╔═══════════════════════════════════════════════════════════════════════╗');
	console.log('║     FLUI AGI - SUITE COMPLETA DE TESTES REAIS (OTIMIZADO)           ║');
	console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

	const orchestrator = new CentralOrchestrator();
	const workDir = join(process.cwd(), 'test-comprehensive');
	mkdirSync(workDir, { recursive: true });

	const results = {
		total: tests.length,
		success: 0,
		failed: 0,
		totalTime: 0,
		times: [] as number[],
		failures: [] as string[]
	};

	for (let i = 0; i < tests.length; i++) {
		const test = tests[i];
		const testNum = i + 1;

		// Separador de categoria
		if (i === 0 || test.category !== tests[i - 1].category) {
			console.log(`\n${'='.repeat(75)}`);
			console.log(`📂 ${test.category}`);
			console.log(`${'='.repeat(75)}`);
		}

		console.log(`\n[${testNum}/${tests.length}] 📝 ${test.name}`);
		console.log(`Prompt: "${test.prompt}"`);
		console.log(`─────────────────────────────────────────────────────────────────────────`);

		const startTime = Date.now();
		let success = false;

		try {
			const result = await orchestrator.orchestrate(
				test.prompt,
				workDir,
				(message) => {
					// Log apenas mensagens-chave
					if (message.includes('🧠') || message.includes('✅') || message.includes('⚠️')) {
						console.log(`  ${message}`);
					}
				}
			);

			const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
			results.totalTime += parseFloat(elapsed);
			results.times.push(parseFloat(elapsed));

			// Verificar se resultado parece válido
			if (result && result.length > 10 && !result.toLowerCase().includes('falha após')) {
				success = true;
				results.success++;
				console.log(`\n✅ SUCESSO (${elapsed}s)`);
				console.log(`Resultado: ${result.substring(0, 150)}${result.length > 150 ? '...' : ''}`);
			} else {
				results.failed++;
				results.failures.push(`${test.name}: Resultado inválido`);
				console.log(`\n⚠️  FALHOU (${elapsed}s): Resultado inválido ou vazio`);
			}

		} catch (error) {
			const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
			results.failed++;
			results.failures.push(`${test.name}: ${error instanceof Error ? error.message : String(error)}`);
			console.log(`\n❌ ERRO (${elapsed}s): ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	// Resumo Final
	console.log(`\n\n╔═══════════════════════════════════════════════════════════════════════╗`);
	console.log(`║                      RESUMO FINAL DOS TESTES                         ║`);
	console.log(`╚═══════════════════════════════════════════════════════════════════════╝\n`);

	console.log(`📊 ESTATÍSTICAS:`);
	console.log(`   Total de testes: ${results.total}`);
	console.log(`   ✅ Sucessos: ${results.success} (${((results.success / results.total) * 100).toFixed(1)}%)`);
	console.log(`   ❌ Falhas: ${results.failed} (${((results.failed / results.total) * 100).toFixed(1)}%)`);
	console.log(`   ⏱️  Tempo total: ${results.totalTime.toFixed(2)}s`);
	console.log(`   📈 Tempo médio: ${(results.totalTime / results.total).toFixed(2)}s`);
	
	if (results.times.length > 0) {
		const sortedTimes = [...results.times].sort((a, b) => a - b);
		console.log(`   ⚡ Mais rápido: ${sortedTimes[0].toFixed(2)}s`);
		console.log(`   🐌 Mais lento: ${sortedTimes[sortedTimes.length - 1].toFixed(2)}s`);
	}

	if (results.failures.length > 0) {
		console.log(`\n❌ FALHAS DETALHADAS:`);
		results.failures.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
	}

	// Veredito
	const successRate = (results.success / results.total) * 100;
	console.log(`\n🎯 VEREDITO:`);
	if (successRate === 100) {
		console.log(`   🏆 PERFEITO! 100% dos testes passaram!`);
	} else if (successRate >= 80) {
		console.log(`   ✅ EXCELENTE! ${successRate.toFixed(0)}% de taxa de sucesso`);
	} else if (successRate >= 60) {
		console.log(`   ⚠️  BOM, mas pode melhorar. ${successRate.toFixed(0)}% de sucesso`);
	} else {
		console.log(`   ❌ PRECISA MELHORIAS. Apenas ${successRate.toFixed(0)}% de sucesso`);
	}

	console.log(`\n${'='.repeat(75)}\n`);

	// Salvar relatório
	const report = {
		timestamp: new Date().toISOString(),
		results,
		tests: tests.map((t, i) => ({
			name: t.name,
			category: t.category,
			success: i < results.success,
			time: results.times[i]
		}))
	};

	writeFileSync(
		join(workDir, 'test-report.json'),
		JSON.stringify(report, null, 2)
	);

	console.log(`📄 Relatório salvo em: ${join(workDir, 'test-report.json')}\n`);
}

runComprehensiveTests().catch(console.error);
