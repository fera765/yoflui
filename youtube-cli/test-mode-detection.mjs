#!/usr/bin/env node
/**
 * TESTE ESPECÍFICO - Detecção de Modo
 */

console.log('🔍 TESTE DETECÇÃO DE MODO\n');

const { executeFluiSuperior } = await import('./dist/flui-superior.js');

// Teste Assistant Mode
console.log('1️⃣ Testando MODO ASSISTANT:');
console.log('   Prompt: "O que é 2+2?"');

const result1 = await executeFluiSuperior({
	userPrompt: 'O que é 2+2?',
	workDir: process.cwd(),
	onProgress: (msg) => console.log(`   📍 ${msg}`),
	enableValidation: false
});

console.log(`\n📊 Resultado:`)
console.log(`   success: ${result1.success}`);
console.log(`   mode: ${result1.mode}`);
console.log(`   executionTime: ${result1.executionTime}ms`);
console.log(`   result (first 150): ${result1.result.substring(0, 150)}`);

console.log(`\n${result1.mode === 'assistant' ? '✅' : '❌'} Modo ${result1.mode === 'assistant' ? 'CORRETO (assistant)' : 'INCORRETO (esperava assistant, obteve ' + result1.mode + ')'}`);

console.log('\n' + '─'.repeat(80) + '\n');

// Teste AGI Mode
console.log('2️⃣ Testando MODO AGI:');
console.log('   Prompt: "Crie um arquivo teste.txt com o texto Hello World"');

const result2 = await executeFluiSuperior({
	userPrompt: 'Crie um arquivo teste.txt com o texto Hello World',
	workDir: process.cwd(),
	onProgress: (msg) => {
		if (msg.includes('Modo detectado') || msg.includes('etapa') || msg.includes('Concluído')) {
			console.log(`   📍 ${msg}`);
		}
	},
	enableValidation: false
});

console.log(`\n📊 Resultado:`);
console.log(`   success: ${result2.success}`);
console.log(`   mode: ${result2.mode}`);
console.log(`   executionTime: ${result2.executionTime}ms`);
console.log(`   result (first 150): ${result2.result.substring(0, 150)}`);

console.log(`\n${result2.mode === 'agi' ? '✅' : '❌'} Modo ${result2.mode === 'agi' ? 'CORRETO (agi)' : 'INCORRETO (esperava agi, obteve ' + result2.mode + ')'}`);

console.log('\n' + '═'.repeat(80));
console.log('\n✅ Teste de detecção de modo concluído!');
