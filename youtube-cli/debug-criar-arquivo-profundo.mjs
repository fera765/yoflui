#!/usr/bin/env node
/**
 * DEBUG PROFUNDO - Criação de Arquivo
 * 
 * Vamos descobrir EXATAMENTE o que está acontecendo!
 */

import { executeFluiSuperior } from './dist/flui-superior.js';
import { existsSync, readFileSync, unlinkSync } from 'fs';

const filename = `debug-profundo-${Date.now()}.txt`;
const content = `DEBUG_SUCCESS_${Date.now()}`;

console.log(`\n🔍 DEBUG PROFUNDO - Criação de Arquivo\n`);
console.log(`Arquivo: ${filename}`);
console.log(`Conteúdo: ${content}\n`);

// Limpar
if (existsSync(filename)) {
	console.log(`⚠️ Arquivo já existe, removendo...`);
	unlinkSync(filename);
}

console.log(`═══════════════════════════════════════════════════════════\n`);

const allLogs = [];

const result = await executeFluiSuperior({
	userPrompt: `Crie um arquivo chamado ${filename} contendo o texto: ${content}`,
	onProgress: (msg) => {
		console.log(`[PROGRESS] ${msg}`);
		allLogs.push(msg);
	},
	verbosity: 'verbose', // Máximo detalhamento
});

console.log(`\n═══════════════════════════════════════════════════════════\n`);

console.log(`📊 RESULTADO:\n`);
console.log(`Success: ${result.success}`);
console.log(`Mode: ${result.mode}`);
console.log(`Time: ${result.executionTime}ms`);
console.log(`\nResult:\n${result.result}`);

console.log(`\n═══════════════════════════════════════════════════════════\n`);

console.log(`🔍 VERIFICAÇÕES:\n`);

const existe = existsSync(filename);
console.log(`1. Arquivo existe? ${existe ? '✅ SIM' : '❌ NÃO'}`);

if (existe) {
	const conteudo = readFileSync(filename, 'utf-8');
	const correto = conteudo.includes(content);
	console.log(`2. Conteúdo correto? ${correto ? '✅ SIM' : '❌ NÃO'}`);
	console.log(`   Esperado: "${content}"`);
	console.log(`   Obtido: "${conteudo}"`);
}

console.log(`\n═══════════════════════════════════════════════════════════\n`);

console.log(`📋 TODOS OS LOGS:\n`);
allLogs.forEach((log, idx) => {
	console.log(`${idx+1}. ${log}`);
});

console.log(`\n═══════════════════════════════════════════════════════════\n`);

if (existe) {
	console.log(`✅ SUCESSO! Arquivo criado corretamente!`);
	unlinkSync(filename);
} else {
	console.log(`❌ FALHOU! Arquivo NÃO foi criado!`);
	console.log(`\n💡 DIAGNÓSTICO:`);
	console.log(`   - Ferramenta write_file foi chamada?`);
	console.log(`   - Agent type correto (code)?`);
	console.log(`   - Tools array contém "write_file"?`);
	console.log(`\nVERIFIQUE OS LOGS ACIMA!`);
}

console.log();
