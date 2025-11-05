#!/usr/bin/env node
/**
 * TESTE FINAL - Validação após refinamentos
 */

console.log('🎯 TESTE FINAL - VALIDAÇÃO PÓS-REFINAMENTOS\n');
console.log('═'.repeat(80));

const { executeFluiSuperior } = await import('./dist/flui-superior.js');
const { existsSync, readFileSync, unlinkSync } = await import('fs');

let testsPassed = 0;
let testsFailed = 0;

// ============================================================================
// TESTE 1: Modo ASSISTANT (Pergunta Simples)
// ============================================================================

console.log('\n1️⃣ TESTE: Pergunta Simples (Modo ASSISTANT)');
console.log('   Prompt: "O que é 2+2?"');

const test1 = await executeFluiSuperior({
	userPrompt: 'O que é 2+2?',
	workDir: process.cwd(),
	onProgress: (msg) => { if (msg.includes('Modo detectado')) console.log(`   ${msg}`); }
});

const test1Pass = test1.success && test1.mode === 'assistant' && test1.executionTime < 10000;
console.log(`   Resultado: ${test1.success ? '✅' : '❌'} | Modo: ${test1.mode} | Tempo: ${(test1.executionTime/1000).toFixed(1)}s`);
console.log(`   ${test1Pass ? '✅ PASSOU' : '❌ FALHOU'}`);
if (test1Pass) testsPassed++; else testsFailed++;

// ============================================================================
// TESTE 2: Modo AGI (Criar Arquivo)
// ============================================================================

console.log('\n2️⃣ TESTE: Criar Arquivo (Modo AGI)');
console.log('   Prompt: "Crie um arquivo final-test.txt com o texto SUCCESS"');

// Limpar arquivo se existir
if (existsSync('./final-test.txt')) {
	unlinkSync('./final-test.txt');
}

const test2 = await executeFluiSuperior({
	userPrompt: 'Crie um arquivo final-test.txt com o texto SUCCESS',
	workDir: process.cwd(),
	onProgress: (msg) => { if (msg.includes('Modo detectado')) console.log(`   ${msg}`); }
});

const fileExists = existsSync('./final-test.txt');
const fileContent = fileExists ? readFileSync('./final-test.txt', 'utf-8') : '';
const test2Pass = test2.success && test2.mode === 'agi' && fileExists && fileContent.includes('SUCCESS');

console.log(`   Resultado: ${test2.success ? '✅' : '❌'} | Modo: ${test2.mode}`);
console.log(`   Arquivo criado: ${fileExists ? '✅' : '❌'}`);
console.log(`   Conteúdo correto: ${fileContent.includes('SUCCESS') ? '✅' : '❌'}`);
console.log(`   ${test2Pass ? '✅ PASSOU' : '❌ FALHOU'}`);
if (test2Pass) testsPassed++; else testsFailed++;

// ============================================================================
// TESTE 3: Modo AGI (Listagem com ferramentas)
// ============================================================================

console.log('\n3️⃣ TESTE: Listagem de Arquivos (Modo AGI)');
console.log('   Prompt: "Liste quantos arquivos .md existem aqui"');

const test3 = await executeFluiSuperior({
	userPrompt: 'Liste quantos arquivos .md existem aqui',
	workDir: process.cwd(),
	onProgress: (msg) => { if (msg.includes('Modo detectado')) console.log(`   ${msg}`); }
});

const test3Pass = test3.success && test3.mode === 'agi';
console.log(`   Resultado: ${test3.success ? '✅' : '❌'} | Modo: ${test3.mode}`);
console.log(`   ${test3Pass ? '✅ PASSOU (modo correto)' : '❌ FALHOU (modo incorreto)'}`);
if (test3Pass) testsPassed++; else testsFailed++;

// ============================================================================
// TESTE 4: Modo ASSISTANT (Comparação Simples)
// ============================================================================

console.log('\n4️⃣ TESTE: Comparação Simples (Modo ASSISTANT)');
console.log('   Prompt: "Qual a diferença entre == e === em JavaScript?"');

const test4 = await executeFluiSuperior({
	userPrompt: 'Qual a diferença entre == e === em JavaScript?',
	workDir: process.cwd(),
	onProgress: (msg) => { if (msg.includes('Modo detectado')) console.log(`   ${msg}`); }
});

const test4Pass = test4.success && test4.mode === 'assistant' && test4.result.length > 100;
console.log(`   Resultado: ${test4.success ? '✅' : '❌'} | Modo: ${test4.mode}`);
console.log(`   Resposta completa: ${test4.result.length > 100 ? '✅' : '❌'}`);
console.log(`   ${test4Pass ? '✅ PASSOU' : '❌ FALHOU'}`);
if (test4Pass) testsPassed++; else testsFailed++;

// ============================================================================
// RESUMO
// ============================================================================

const totalTests = testsPassed + testsFailed;
const successRate = (testsPassed / totalTests) * 100;

console.log('\n' + '═'.repeat(80));
console.log('\n📊 RESUMO FINAL\n');
console.log(`Total: ${totalTests} testes`);
console.log(`✅ Passou: ${testsPassed} (${successRate.toFixed(1)}%)`);
console.log(`❌ Falhou: ${testsFailed} (${((testsFailed/totalTests)*100).toFixed(1)}%)`);

console.log(`\n🎯 Taxa de Sucesso: ${successRate.toFixed(1)}%`);

if (successRate >= 90) {
	console.log('\n🌟 EXCELENTE! Meta de 90%+ atingida!');
	console.log('Sistema FLUI AGI SUPERIOR operando com excelência!');
} else if (successRate >= 75) {
	console.log('\n✅ BOM! Sistema funcional.');
	console.log(`Faltam ${(90 - successRate).toFixed(1)}% para atingir meta de 90%.`);
} else {
	console.log('\n⚠️ Sistema precisa de mais refinamentos.');
}

console.log('\n═'.repeat(80));

process.exit(testsFailed > 0 ? 1 : 0);
