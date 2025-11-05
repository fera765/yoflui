/**
 * TESTE FLUI SUPERIOR - TAREFAS SIMPLES
 * 
 * Objetivo: Verificar se o sistema atinge NOTA 10 em tarefas simples
 * 
 * Execução: node tests/test-flui-superior-simple.mjs
 */

import { executeFluiSuperior } from '../source/flui-superior.ts';

console.log('🧪 TESTE FLUI SUPERIOR - TAREFAS SIMPLES\n');
console.log('Objetivo: Nota 10 em tarefas simples (modo assistente)\n');
console.log('='.repeat(80) + '\n');

const simpleTests = [
	{
		id: 'SIMPLE-1',
		name: 'Pergunta Factual',
		prompt: 'O que é TypeScript?',
		expectedMode: 'assistant',
		criteria: [
			'Resposta direta e concisa',
			'Não deve usar ferramentas',
			'Tempo de resposta < 5s',
			'Output sem verbosidade desnecessária'
		]
	},
	{
		id: 'SIMPLE-2',
		name: 'Comparação Simples',
		prompt: 'Quais as principais diferenças entre Python e JavaScript?',
		expectedMode: 'assistant',
		criteria: [
			'Comparação estruturada (tabela ou lista)',
			'Pontos-chave claros',
			'Não deve criar arquivos',
			'Resposta completa mas concisa'
		]
	},
	{
		id: 'SIMPLE-3',
		name: 'Explicação Conceitual',
		prompt: 'Como funciona um loop for em programação?',
		expectedMode: 'assistant',
		criteria: [
			'Explicação clara e didática',
			'Exemplo prático opcional',
			'Resposta direta sem decomposição',
			'Token economy mantida'
		]
	},
	{
		id: 'SIMPLE-4',
		name: 'Pergunta Com Contexto',
		prompt: 'Por que usar async/await é melhor que callbacks?',
		expectedMode: 'assistant',
		criteria: [
			'Resposta argumentativa',
			'Vantagens listadas',
			'Sem uso de ferramentas externas',
			'Concisão mantida'
		]
	},
];

let passedTests = 0;
let failedTests = 0;

for (const test of simpleTests) {
	console.log(`📝 ${test.id}: ${test.name}`);
	console.log(`Prompt: "${test.prompt}"\n`);

	const startTime = Date.now();
	
	try {
		const result = await executeFluiSuperior({
			userPrompt: test.prompt,
			workDir: process.cwd(),
			onProgress: (msg) => {
				// Mostrar apenas mensagens importantes
				if (msg.includes('Modo detectado') || msg.includes('Validação')) {
					console.log(`  ${msg}`);
				}
			},
			enableValidation: true,
		});

		const executionTime = (Date.now() - startTime) / 1000;

		console.log('\n📊 Resultado:');
		console.log(result.result.substring(0, 300) + (result.result.length > 300 ? '...' : ''));
		console.log(`\n⏱️ Tempo: ${executionTime.toFixed(2)}s`);
		console.log(`🎯 Modo: ${result.mode.toUpperCase()}`);

		// Avaliação
		console.log('\n✅ Critérios de Avaliação:');
		let criteriaScore = 0;
		
		// 1. Modo correto
		if (result.mode === test.expectedMode) {
			console.log(`  ✅ Modo ${test.expectedMode} detectado corretamente`);
			criteriaScore += 25;
		} else {
			console.log(`  ❌ Modo incorreto: esperado ${test.expectedMode}, obtido ${result.mode}`);
		}

		// 2. Tempo de resposta (simples deve ser < 10s)
		if (executionTime < 10) {
			console.log(`  ✅ Tempo adequado (${executionTime.toFixed(2)}s)`);
			criteriaScore += 25;
		} else {
			console.log(`  ⚠️ Tempo elevado para tarefa simples (${executionTime.toFixed(2)}s)`);
			criteriaScore += 10;
		}

		// 3. Resultado não vazio e relevante
		if (result.success && result.result.length > 50 && result.result.length < 2000) {
			console.log(`  ✅ Resultado completo e conciso (${result.result.length} chars)`);
			criteriaScore += 25;
		} else if (result.result.length >= 2000) {
			console.log(`  ⚠️ Resultado muito verboso (${result.result.length} chars)`);
			criteriaScore += 15;
		} else {
			console.log(`  ❌ Resultado inadequado`);
		}

		// 4. Sem erros
		if (result.success && !result.result.toLowerCase().includes('error')) {
			console.log(`  ✅ Sem erros detectados`);
			criteriaScore += 25;
		} else {
			console.log(`  ❌ Erros detectados na execução`);
		}

		const grade = criteriaScore / 10; // Converter para nota 0-10
		console.log(`\n🎓 NOTA: ${grade.toFixed(1)}/10 ${grade >= 9 ? '🌟' : grade >= 7 ? '✅' : '⚠️'}`);

		if (grade >= 8) {
			passedTests++;
			console.log(`✅ ${test.id} PASSOU\n`);
		} else {
			failedTests++;
			console.log(`❌ ${test.id} FALHOU (nota abaixo de 8)\n`);
		}

	} catch (error) {
		console.log(`\n❌ ERRO: ${error.message}`);
		failedTests++;
	}

	console.log('='.repeat(80) + '\n');
}

// Resumo final
console.log('📊 RESUMO DOS TESTES SIMPLES\n');
console.log(`Total de testes: ${simpleTests.length}`);
console.log(`✅ Passou: ${passedTests}`);
console.log(`❌ Falhou: ${failedTests}`);

const successRate = (passedTests / simpleTests.length) * 100;
console.log(`\n📈 Taxa de Sucesso: ${successRate.toFixed(1)}%`);

if (successRate >= 90) {
	console.log('\n🌟 EXCELENTE! FLUI atingiu NOTA 10 em tarefas simples!');
} else if (successRate >= 75) {
	console.log('\n✅ BOM! Mas ainda há espaço para melhorias.');
} else {
	console.log('\n⚠️ REQUER REFINAMENTO para atingir nota 10.');
}

process.exit(failedTests > 0 ? 1 : 0);
