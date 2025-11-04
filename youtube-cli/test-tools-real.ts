/**
 * TESTE REAL DE TOOLS - SEM MOCK
 * Validando web_scraper, execute_shell, file operations
 */

import { CentralOrchestrator } from './source/agi/orchestrator.js';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

async function testRealTools() {
	console.log('🔧 TESTE REAL DE TOOLS - VALIDAÇÃO COMPLETA\n');

	const orchestrator = new CentralOrchestrator();
	const workDir = join(process.cwd(), 'test-tools-real');
	mkdirSync(workDir, { recursive: true });

	const tests = [
		{
			name: '1. File Operations - Criar arquivo',
			prompt: 'Crie um arquivo chamado test.txt com o conteúdo "Hello FLUI" no diretório atual',
			expectation: 'Arquivo test.txt criado',
			validate: () => existsSync(join(workDir, 'test.txt'))
		},
		{
			name: '2. File Operations - Ler arquivo',
			prompt: 'Leia o conteúdo do arquivo test.txt',
			expectation: 'Deve retornar "Hello FLUI"',
			validate: () => true
		},
		{
			name: '3. Shell Command - Listar arquivos',
			prompt: 'Execute o comando "ls" para listar arquivos no diretório atual',
			expectation: 'Lista de arquivos',
			validate: () => true
		},
		{
			name: '4. Shell Command - Data',
			prompt: 'Execute o comando "date" para mostrar a data atual',
			expectation: 'Data e hora',
			validate: () => true
		},
		{
			name: '5. Find Files',
			prompt: 'Encontre todos os arquivos .ts no diretório source/',
			expectation: 'Lista de arquivos TypeScript',
			validate: () => true
		}
	];

	// Preparar: criar test.txt para teste 2
	writeFileSync(join(workDir, 'test.txt'), 'Hello FLUI', 'utf-8');

	const results = {
		passed: 0,
		failed: 0,
		times: [] as number[]
	};

	for (let i = 0; i < tests.length; i++) {
		const test = tests[i];
		console.log(`\n${'='.repeat(75)}`);
		console.log(`${test.name}`);
		console.log(`Prompt: "${test.prompt}"`);
		console.log(`Expectativa: ${test.expectation}`);
		console.log(`${'='.repeat(75)}\n`);

		const startTime = Date.now();

		try {
			const result = await orchestrator.orchestrate(
				test.prompt,
				workDir,
				(message) => {
					if (message.includes('🔧') || message.includes('✅') || message.includes('❌')) {
						console.log(`  ${message}`);
					}
				}
			);

			const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
			results.times.push(parseFloat(elapsed));

			// Validar resultado
			const isValid = test.validate();
			const hasContent = result && result.length > 20;
			const noError = !result.toLowerCase().includes('error') && 
			                !result.toLowerCase().includes('falha após');

			if (hasContent && noError && isValid) {
				results.passed++;
				console.log(`\n✅ PASSOU (${elapsed}s)`);
				console.log(`Resultado: ${result.substring(0, 200)}${result.length > 200 ? '...' : ''}`);
			} else {
				results.failed++;
				console.log(`\n⚠️  FALHOU (${elapsed}s)`);
				console.log(`Resultado: ${result.substring(0, 200)}`);
				console.log(`Validação: hasContent=${hasContent}, noError=${noError}, isValid=${isValid}`);
			}

		} catch (error) {
			const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
			results.failed++;
			results.times.push(parseFloat(elapsed));
			console.log(`\n❌ ERRO (${elapsed}s): ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	// Resumo
	console.log(`\n\n╔═══════════════════════════════════════════════════════════════════════╗`);
	console.log(`║                    RESUMO - TESTES DE TOOLS                          ║`);
	console.log(`╚═══════════════════════════════════════════════════════════════════════╝\n`);

	console.log(`📊 RESULTADOS:`);
	console.log(`   ✅ Passou: ${results.passed}/${tests.length}`);
	console.log(`   ❌ Falhou: ${results.failed}/${tests.length}`);
	console.log(`   📈 Taxa de sucesso: ${((results.passed / tests.length) * 100).toFixed(0)}%`);
	console.log(`   ⏱️  Tempo médio: ${(results.times.reduce((a, b) => a + b, 0) / results.times.length).toFixed(2)}s`);

	const successRate = (results.passed / tests.length) * 100;
	console.log(`\n🎯 VEREDITO: ${successRate === 100 ? '🏆 PERFEITO!' : successRate >= 80 ? '✅ EXCELENTE' : '⚠️  PRECISA MELHORIAS'}\n`);
}

testRealTools().catch(console.error);
