#!/usr/bin/env node
/**
 * TESTE SIMPLES E RÁPIDO - Validação básica do FLUI
 */

console.log('🧪 TESTE RÁPIDO - FLUI AGI SUPERIOR\n');

// Teste 1: Verificar se consegue importar
try {
	console.log('1️⃣ Testando imports...');
	const { executeFluiSuperior } = await import('./dist/flui-superior.js');
	console.log('   ✅ Import do flui-superior OK');
	
	// Teste 2: Executar tarefa super simples
	console.log('\n2️⃣ Testando execução simples...');
	console.log('   Prompt: "O que é 2+2?"');
	
	const startTime = Date.now();
	
	const result = await executeFluiSuperior({
		userPrompt: 'O que é 2+2?',
		workDir: process.cwd(),
		onProgress: (msg) => {
			if (msg.includes('Modo detectado') || msg.includes('iniciando')) {
				console.log(`   📍 ${msg}`);
			}
		},
		enableValidation: false
	});
	
	const executionTime = (Date.now() - startTime) / 1000;
	
	console.log('\n📊 RESULTADO:');
	console.log(`   Status: ${result.success ? '✅' : '❌'}`);
	console.log(`   Tempo: ${executionTime.toFixed(2)}s`);
	console.log(`   Modo: ${result.mode}`);
	console.log(`   Output (100 chars): ${result.result.substring(0, 100)}...`);
	
	if (result.success) {
		console.log('\n🎉 SUCESSO! Sistema básico funcionando!');
		process.exit(0);
	} else {
		console.log('\n❌ FALHA! Ver detalhes acima.');
		console.log(`   Erro: ${result.result}`);
		process.exit(1);
	}
	
} catch (error) {
	console.log(`\n❌ ERRO CRÍTICO: ${error.message}`);
	console.log(`   Stack: ${error.stack}`);
	process.exit(1);
}
