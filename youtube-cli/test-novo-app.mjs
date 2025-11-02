#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('?? TESTE DO NOVO APP.TSX\n');
console.log('='.repeat(80));

const testDir = join(__dirname, 'test-novo-app-dir');
const proc = spawn('npm', ['run', 'dev'], {
	cwd: __dirname,
	env: { ...process.env, DEBUG_MESSAGES: 'true' },
	stdio: ['pipe', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';
let messageCount = 0;

proc.stdout.on('data', (data) => {
	const text = data.toString();
	stdout += text;
	
	// Contar quantas vezes "teste abc" aparece visualmente
	const matches = text.match(/> teste abc/g);
	if (matches) {
		messageCount += matches.length;
		console.log(`\n?? [VISUAL] "> teste abc" detectado ${matches.length} vezes neste chunk`);
	}
	
	process.stdout.write(text);
});

proc.stderr.on('data', (data) => {
	const text = data.toString();
	stderr += text;
	
	if (text.includes('[DEBUG]') || text.includes('HANDLE_SUBMIT')) {
		console.log('\n?? [LOG]', text.trim());
	}
});

// Aguardar inicializa??o
setTimeout(() => {
	console.log('\n' + '='.repeat(80));
	console.log('?? ENVIANDO: "teste abc"');
	console.log('='.repeat(80) + '\n');
	
	proc.stdin.write('teste abc\n');
	
	// Aguardar e analisar
	setTimeout(() => {
		console.log('\n' + '='.repeat(80));
		console.log('?? AN?LISE FINAL');
		console.log('='.repeat(80) + '\n');
		
		console.log(`Total de vezes que "> teste abc" apareceu visualmente: ${messageCount}`);
		
		if (messageCount === 0) {
			console.log('??  Nenhuma mensagem detectada (pode n?o ter sido processada)');
		} else if (messageCount === 1) {
			console.log('? SUCESSO! Mensagem apareceu APENAS 1 VEZ');
		} else {
			console.log(`? PROBLEMA! Mensagem apareceu ${messageCount} VEZES (multiplica??o detectada)`);
		}
		
		console.log('\n?? Encerrando...');
		proc.kill('SIGTERM');
		
		setTimeout(() => process.exit(messageCount === 1 ? 0 : 1), 500);
	}, 8000);
}, 3000);

// Timeout
setTimeout(() => {
	proc.kill('SIGTERM');
	process.exit(1);
}, 15000);
