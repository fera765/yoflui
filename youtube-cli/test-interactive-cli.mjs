#!/usr/bin/env node

/**
 * Teste Interativo da CLI com Logs em Tempo Real
 * 
 * Este script:
 * 1. Inicia a CLI
 * 2. Envia mensagens via stdin
 * 3. Captura stdout/stderr
 * 4. Analisa duplica??o de mensagens
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('?? TESTE INTERATIVO - Identifica??o de Duplica??o de Mensagens\n');

// Configurar ambiente de teste
const testDir = join(__dirname, 'test-temp-interactive');
const cliPath = join(__dirname, 'dist', 'cli.js');

console.log('?? Diret?rio de teste:', testDir);
console.log('?? CLI Path:', cliPath);
console.log('\n' + '='.repeat(80) + '\n');

// Spawn CLI process
console.log('??  Iniciando CLI...\n');

const cli = spawn('node', [cliPath], {
	cwd: testDir,
	env: {
		...process.env,
		FORCE_COLOR: '0',  // Desabilitar cores para an?lise
		DEBUG_MESSAGES: 'true',  // Ativar logs de debug
	},
	stdio: ['pipe', 'pipe', 'pipe']
});

let outputBuffer = '';
let messageCount = {
	user: 0,
	assistant: 0,
	duplicate: 0
};

let lastUserMessage = null;
let userMessageTimestamps = [];

// Capturar stdout
cli.stdout.on('data', (data) => {
	const output = data.toString();
	outputBuffer += output;
	
	// Imprimir output em tempo real
	process.stdout.write(output);
	
	// Analisar por mensagens do usu?rio
	const userMatches = output.match(/>\s*(.+)/g);
	if (userMatches) {
		userMatches.forEach(match => {
			const msg = match.trim();
			const timestamp = Date.now();
			
			console.log(`\n[LOG] Detectada mensagem do usu?rio: "${msg}"`);
			console.log(`[LOG] Timestamp: ${timestamp}`);
			
			// Verificar duplica??o
			if (lastUserMessage === msg) {
				const timeDiff = timestamp - userMessageTimestamps[userMessageTimestamps.length - 1];
				if (timeDiff < 1000) {  // Menos de 1 segundo = prov?vel duplica??o
					messageCount.duplicate++;
					console.log(`??  [DUPLICA??O DETECTADA] Mesma mensagem em ${timeDiff}ms`);
				}
			}
			
			lastUserMessage = msg;
			userMessageTimestamps.push(timestamp);
			messageCount.user++;
		});
	}
	
	// Detectar respostas do assistente
	if (output.includes('??') || output.includes('assistant')) {
		messageCount.assistant++;
		console.log(`\n[LOG] Resposta do assistente detectada`);
	}
});

// Capturar stderr (logs de debug)
cli.stderr.on('data', (data) => {
	const output = data.toString();
	
	// Filtrar apenas logs relevantes
	if (output.includes('[DEBUG]') || output.includes('setMessages')) {
		console.log('\n?? [STDERR DEBUG]:', output.trim());
	}
});

// Handler de erro
cli.on('error', (error) => {
	console.error('\n? Erro ao executar CLI:', error);
	process.exit(1);
});

// Aguardar CLI iniciar
console.log('? Aguardando CLI iniciar...\n');

setTimeout(() => {
	console.log('\n' + '='.repeat(80));
	console.log('?? ENVIANDO MENSAGEM DE TESTE');
	console.log('='.repeat(80) + '\n');
	
	// Enviar mensagem de teste
	const testMessage = 'Ol?, teste de duplica??o\n';
	console.log(`[A??O] Enviando: "${testMessage.trim()}"`);
	cli.stdin.write(testMessage);
	
	// Aguardar processamento
	setTimeout(() => {
		console.log('\n' + '='.repeat(80));
		console.log('?? AN?LISE DE DUPLICA??O');
		console.log('='.repeat(80) + '\n');
		
		console.log(`Total de mensagens do usu?rio detectadas: ${messageCount.user}`);
		console.log(`Total de respostas do assistente: ${messageCount.assistant}`);
		console.log(`Duplica??es detectadas: ${messageCount.duplicate}`);
		
		if (messageCount.user > 1) {
			console.log('\n??  PROBLEMA CONFIRMADO: Mensagem do usu?rio aparece m?ltiplas vezes!');
			console.log(`   Esperado: 1`);
			console.log(`   Detectado: ${messageCount.user}`);
		} else {
			console.log('\n? Sem duplica??o detectada!');
		}
		
		console.log('\n' + '='.repeat(80));
		console.log('?? OUTPUT COMPLETO CAPTURADO:');
		console.log('='.repeat(80) + '\n');
		console.log(outputBuffer);
		
		// Encerrar
		console.log('\n?? Encerrando teste...\n');
		cli.kill('SIGTERM');
		
		setTimeout(() => {
			process.exit(messageCount.user > 1 ? 1 : 0);
		}, 500);
		
	}, 8000);  // 8 segundos para processar
	
}, 2000);  // 2 segundos para iniciar

// Timeout geral
setTimeout(() => {
	console.log('\n? Timeout - Encerrando teste\n');
	cli.kill('SIGTERM');
	process.exit(1);
}, 15000);  // 15 segundos total
