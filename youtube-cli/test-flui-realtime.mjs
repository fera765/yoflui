#!/usr/bin/env node
/**
 * TESTE REALTIME - FLUI AGI SUPERIOR
 * 
 * Testa o sistema de forma autônoma e dá feedback em tempo real
 */

import { executeFluiSuperior } from './dist/flui-superior.js';
import { existsSync, readFileSync } from 'fs';

console.log('🚀 TESTE AUTÔNOMO - FLUI AGI SUPERIOR\n');
console.log('═'.repeat(80));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Helper para executar teste e dar feedback
 */
async function runTest(testId, testName, prompt, criteria) {
	totalTests++;
	
	console.log(`\n📝 ${testId}: ${testName}`);
	console.log(`Prompt: "${prompt}"\n`);
	
	const startTime = Date.now();
	
	try {
		const result = await executeFluiSuperior({
			userPrompt: prompt,
			workDir: process.cwd(),
			onProgress: (msg) => {
				// Mostrar apenas mensagens importantes
				if (msg.includes('Modo detectado') || 
				    msg.includes('iniciando') ||
				    msg.includes('Validação') ||
				    msg.includes('concluída')) {
					console.log(`  ${msg}`);
				}
			},
			enableValidation: false, // Desabilitar para testes rápidos
		});
		
		const executionTime = (Date.now() - startTime) / 1000;
		
		// Feedback do resultado
		console.log(`\n📊 RESULTADO:`);
		console.log(`  Status: ${result.success ? '✅ Sucesso' : '❌ Falha'}`);
		console.log(`  Tempo: ${executionTime.toFixed(2)}s`);
		console.log(`  Modo: ${result.mode.toUpperCase()}`);
		console.log(`  Output (preview): ${result.result.substring(0, 200)}...`);
		
		// Avaliação baseada em critérios
		let score = 0;
		const maxScore = criteria.length * 25;
		
		console.log(`\n🎯 AVALIAÇÃO:`);
		
		for (const criterion of criteria) {
			const passed = criterion.check(result, executionTime);
			if (passed) {
				console.log(`  ✅ ${criterion.name}`);
				score += 25;
			} else {
				console.log(`  ❌ ${criterion.name}`);
			}
		}
		
		const grade = (score / maxScore) * 10;
		console.log(`\n🎓 NOTA: ${grade.toFixed(1)}/10 ${grade >= 8 ? '🌟' : grade >= 6 ? '✅' : '⚠️'}`);
		
		if (grade >= 7) {
			passedTests++;
			console.log(`✅ ${testId} PASSOU`);
		} else {
			failedTests++;
			console.log(`❌ ${testId} FALHOU`);
		}
		
		return { success: true, grade, result };
		
	} catch (error) {
		console.log(`\n❌ ERRO: ${error.message}`);
		failedTests++;
		return { success: false, grade: 0, error: error.message };
	}
}

// ============================================================================
// TESTE 1: PERGUNTA FACTUAL SIMPLES
// ============================================================================

console.log('\n\n🧪 BATERIA 1: TAREFAS SIMPLES\n');
console.log('─'.repeat(80));

const test1Result = await runTest(
	'TEST-SIMPLE-1',
	'Pergunta Factual Simples',
	'O que é TypeScript?',
	[
		{
			name: 'Resposta não vazia',
			check: (r) => r.success && r.result.length > 50
		},
		{
			name: 'Tempo razoável (< 15s)',
			check: (r, time) => time < 15
		},
		{
			name: 'Sem erros no output',
			check: (r) => !r.result.toLowerCase().includes('error')
		},
		{
			name: 'Output conciso (< 2000 chars)',
			check: (r) => r.result.length < 2000
		}
	]
);

console.log('\n' + '═'.repeat(80));

// ============================================================================
// TESTE 2: COMPARAÇÃO SIMPLES
// ============================================================================

const test2Result = await runTest(
	'TEST-SIMPLE-2',
	'Comparação Simples',
	'Quais as principais diferenças entre Python e JavaScript?',
	[
		{
			name: 'Menciona ambas as linguagens',
			check: (r) => r.result.includes('Python') || r.result.includes('python') &&
			              (r.result.includes('JavaScript') || r.result.includes('javascript'))
		},
		{
			name: 'Tempo razoável (< 20s)',
			check: (r, time) => time < 20
		},
		{
			name: 'Resposta estruturada',
			check: (r) => r.result.includes('-') || r.result.includes('•') || r.result.includes('1')
		},
		{
			name: 'Sem erros',
			check: (r) => r.success && !r.result.toLowerCase().includes('error:')
		}
	]
);

console.log('\n' + '═'.repeat(80));

// ============================================================================
// TESTE 3: TAREFA COMPLEXA - CRIAR ARQUIVO
// ============================================================================

console.log('\n\n🧪 BATERIA 2: TAREFAS COMPLEXAS\n');
console.log('─'.repeat(80));

const test3Result = await runTest(
	'TEST-COMPLEX-1',
	'Criação de Arquivo',
	'Crie um arquivo chamado test-output.txt com o texto "FLUI AGI Superior funcionando!"',
	[
		{
			name: 'Execução sem erros',
			check: (r) => r.success
		},
		{
			name: 'Arquivo foi criado',
			check: (r) => {
				const exists = existsSync('./test-output.txt');
				if (exists) {
					console.log('    ℹ️  Arquivo test-output.txt encontrado');
				}
				return exists;
			}
		},
		{
			name: 'Conteúdo correto',
			check: (r) => {
				if (existsSync('./test-output.txt')) {
					const content = readFileSync('./test-output.txt', 'utf-8');
					return content.includes('FLUI AGI Superior');
				}
				return false;
			}
		},
		{
			name: 'Confirmação no output',
			check: (r) => r.result.toLowerCase().includes('criado') || 
			              r.result.toLowerCase().includes('arquivo')
		}
	]
);

console.log('\n' + '═'.repeat(80));

// ============================================================================
// TESTE 4: LISTA DE ARQUIVOS
// ============================================================================

const test4Result = await runTest(
	'TEST-COMPLEX-2',
	'Listagem e Análise',
	'Liste quantos arquivos .md existem no diretório atual',
	[
		{
			name: 'Execução sem erros',
			check: (r) => r.success
		},
		{
			name: 'Menciona arquivos .md',
			check: (r) => r.result.includes('.md') || r.result.includes('markdown')
		},
		{
			name: 'Fornece um número',
			check: (r) => /\d+/.test(r.result)
		},
		{
			name: 'Resposta completa',
			check: (r) => r.result.length > 50
		}
	]
);

console.log('\n' + '═'.repeat(80));

// ============================================================================
// RESUMO FINAL
// ============================================================================

console.log('\n\n📊 RESUMO DOS TESTES\n');
console.log('═'.repeat(80));
console.log(`\nTotal de testes: ${totalTests}`);
console.log(`✅ Passou: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
console.log(`❌ Falhou: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);

const successRate = (passedTests / totalTests) * 100;

console.log(`\n📈 Taxa de Sucesso: ${successRate.toFixed(1)}%\n`);

if (successRate >= 90) {
	console.log('🌟 EXCELENTE! Sistema atingindo meta de 90%+ de sucesso!');
} else if (successRate >= 75) {
	console.log('✅ BOM! Sistema funcional, mas há espaço para melhorias.');
} else if (successRate >= 50) {
	console.log('⚠️ ATENÇÃO! Sistema precisa de refinamentos.');
} else {
	console.log('❌ CRÍTICO! Sistema precisa de revisão urgente.');
}

// Feedback específico
console.log('\n💡 FEEDBACK E PRÓXIMAS AÇÕES:\n');

if (test1Result.grade < 8) {
	console.log('⚠️ Tarefas simples precisam melhorar:');
	console.log('   - Verificar detecção de modo assistente');
	console.log('   - Otimizar tempo de resposta');
	console.log('   - Melhorar concisão do output');
}

if (test3Result && !test3Result.result?.result?.includes('criado')) {
	console.log('⚠️ Criação de arquivos precisa melhorar:');
	console.log('   - Verificar se ferramentas estão sendo chamadas');
	console.log('   - Checar permissões de escrita');
	console.log('   - Validar contexto entre etapas');
}

console.log('\n✅ Teste autônomo concluído!');
console.log('═'.repeat(80));

process.exit(failedTests > 0 ? 1 : 0);
