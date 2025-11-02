#!/usr/bin/env node

/**
 * Teste Direto de Envio de Mensagem
 * Simula entrada do usu?rio e captura o que aparece na tela
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('?? TESTE DIRETO - An?lise de Mensagens Duplicadas\n');

const testDir = join(__dirname, 'test-temp-direct');
mkdirSync(testDir, { recursive: true });

const cliPath = join(__dirname, 'dist', 'cli.js');

console.log('?? Diret?rio:', testDir);
console.log('?? CLI:', cliPath);
console.log('\n' + '='.repeat(80) + '\n');

// Iniciar CLI
const cli = spawn('node', [cliPath], {
	cwd: testDir,
	env: {
		...process.env,
		DEBUG_MESSAGES: 'true',
		FORCE_COLOR: '0',
	},
	stdio: ['pipe', 'pipe', 'pipe']
});

let fullOutput = '';
let debugLogs = [];

cli.stdout.on('data', (data) => {
	const text = data.toString();
	fullOutput += text;
	process.stdout.write(text);
});

cli.stderr.on('data', (data) => {
	const text = data.toString();
	debugLogs.push(text);
	
	// S? mostrar logs de debug importantes
	if (text.includes('[DEBUG]')) {
		console.log('\n??', text.trim());
	}
});

// Aguardar inicializa??o
setTimeout(() => {
	console.log('\n' + '='.repeat(80));
	console.log('?? ENVIANDO: "teste mensagem"');
	console.log('='.repeat(80) + '\n');
	
	// Enviar mensagem
	cli.stdin.write('teste mensagem\n');
	
	// Aguardar processamento e an?lise
	setTimeout(() => {
		console.log('\n' + '='.repeat(80));
		console.log('?? AN?LISE DOS LOGS DE DEBUG');
		console.log('='.repeat(80) + '\n');
		
		// Contar quantas vezes "teste mensagem" aparece nos logs
		const userMessageLogs = debugLogs.filter(log => 
			log.includes('[DEBUG]') && log.includes('user') && log.includes('teste mensagem')
		);
		
		console.log(`Logs de mensagem do usu?rio encontrados: ${userMessageLogs.length}`);
		userMessageLogs.forEach((log, idx) => {
			console.log(`  [${idx + 1}] ${log.trim()}`);
		});
		
		// Contar setMessages calls
		const setMessagesUserCalls = debugLogs.filter(log => 
			log.includes('setMessages (user)')
		);
		
		console.log(`\nChamadas setMessages(user): ${setMessagesUserCalls.length}`);
		setMessagesUserCalls.forEach((log, idx) => {
			console.log(`  [${idx + 1}] ${log.trim()}`);
		});
		
		// Analisar array changes
		const arrayChanges = debugLogs.filter(log => 
			log.includes('Messages array changed')
		);
		
		console.log(`\nMudan?as no array de messages: ${arrayChanges.length}`);
		
		// An?lise final
		console.log('\n' + '='.repeat(80));
		console.log('?? RESULTADO DA AN?LISE');
		console.log('='.repeat(80) + '\n');
		
		if (setMessagesUserCalls.length > 1) {
			console.log('? PROBLEMA: setMessages(user) foi chamado M?LTIPLAS vezes!');
			console.log(`   Esperado: 1 chamada`);
			console.log(`   Encontrado: ${setMessagesUserCalls.length} chamadas`);
		} else {
			console.log('? setMessages(user) foi chamado apenas 1 vez');
		}
		
		// Procurar por "teste mensagem" m?ltiplas vezes no output visual
		const userMsgMatches = (fullOutput.match(/teste mensagem/g) || []);
		console.log(`\nMensagem "teste mensagem" aparece ${userMsgMatches.length} vezes no output visual`);
		
		if (userMsgMatches.length > 1) {
			console.log('??  DUPLICA??O VISUAL DETECTADA!');
		}
		
		console.log('\n?? Encerrando...\n');
		cli.kill('SIGTERM');
		
		setTimeout(() => {
			process.exit(setMessagesUserCalls.length > 1 ? 1 : 0);
		}, 500);
		
	}, 10000);  // 10 segundos para processar
	
}, 3000);  // 3 segundos para iniciar

// Timeout geral
setTimeout(() => {
	console.log('\n? Timeout geral');
	cli.kill('SIGTERM');
	process.exit(1);
}, 20000);
