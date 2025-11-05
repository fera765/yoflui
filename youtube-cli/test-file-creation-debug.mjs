#!/usr/bin/env node
/**
 * DEBUG: Por que arquivos não são criados?
 */

console.log('🔍 DEBUG - Criação de Arquivos\n');

const { executeFluiSuperior } = await import('./dist/flui-superior.js');
const { existsSync } = await import('fs');

console.log('Testando criação de arquivo com logs verbosos...\n');

const result = await executeFluiSuperior({
	userPrompt: 'Crie um arquivo debug-test.txt com o texto DEBUG_SUCCESS',
	workDir: process.cwd(),
	onProgress: (msg) => {
		// Mostrar TODOS os logs
		console.log(`[PROGRESS] ${msg}`);
	}
});

console.log('\n' + '═'.repeat(80));
console.log('\n📊 RESULTADO COMPLETO:\n');
console.log(`Success: ${result.success}`);
console.log(`Mode: ${result.mode}`);
console.log(`Time: ${result.executionTime}ms`);
console.log(`\nFull Result:\n${result.result}`);

console.log('\n' + '═'.repeat(80));
console.log('\n🔍 VERIFICANDO ARQUIVO:\n');

const fileExists = existsSync('./debug-test.txt');
console.log(`Arquivo existe: ${fileExists ? '✅ SIM' : '❌ NÃO'}`);

if (!fileExists) {
	console.log('\n⚠️ DIAGNÓSTICO:');
	console.log('- Modo AGI detectado: ✅');
	console.log('- Execução sem erros: ' + (result.success ? '✅' : '❌'));
	console.log('- Arquivo NÃO criado: ❌');
	console.log('\nPossíveis causas:');
	console.log('1. Ferramentas não estão sendo chamadas');
	console.log('2. Decomposição está criando subtarefa vazia');
	console.log('3. Agente specialist não está executando write_file');
	console.log('4. Erro silencioso na execução de ferramenta');
}

console.log('\n═'.repeat(80));
