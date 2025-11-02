#!/usr/bin/env node

/**
 * Teste com entrada simulada de teclado
 * Envia mensagem via stdin e captura todos os logs
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

console.log('?? TESTE COM npm run dev + stdin\n');
console.log('='.repeat(80));

// Executar npm run dev
const proc = spawn('npm', ['run', 'dev'], {
    cwd: '/workspace/youtube-cli',
    env: {
        ...process.env,
        DEBUG_MESSAGES: 'true',
        FORCE_COLOR: '1',
    },
    stdio: ['pipe', 'pipe', 'pipe']
});

let allStdout = '';
let allStderr = '';

// Capturar stdout (output visual)
proc.stdout.on('data', (data) => {
    const text = data.toString();
    allStdout += text;
    process.stdout.write(text);
});

// Capturar stderr (logs de debug)
proc.stderr.on('data', (data) => {
    const text = data.toString();
    allStderr += text;
    
    // Mostrar logs importantes em tempo real
    if (text.includes('[HANDLE_SUBMIT') || 
        text.includes('[DEBUG]') || 
        text.includes('BLOQUEADO')) {
        console.log('\n?? [LOG]', text.trim());
    }
});

proc.on('error', (err) => {
    console.error('\n? Erro:', err);
    process.exit(1);
});

// Aguardar inicializa??o
await setTimeout(3000);

console.log('\n' + '='.repeat(80));
console.log('?? ENVIANDO MENSAGEM: "teste mensagem duplicada"');
console.log('='.repeat(80) + '\n');

// Enviar mensagem simulando teclado
proc.stdin.write('teste mensagem duplicada\n');

// Aguardar processamento
await setTimeout(12000);

console.log('\n' + '='.repeat(80));
console.log('?? AN?LISE DOS LOGS');
console.log('='.repeat(80) + '\n');

// Analisar stderr (logs de debug)
const handleSubmitCalls = (allStderr.match(/\[HANDLE_SUBMIT CALLED\]/g) || []).length;
const setMessagesUserCalls = (allStderr.match(/setMessages \(user\)/g) || []).length;
const messagesArrayChanges = (allStderr.match(/Messages array changed/g) || []).length;
const blockedCalls = (allStderr.match(/BLOQUEADO/g) || []).length;

console.log('Estat?sticas:');
console.log(`  handleSubmit chamado: ${handleSubmitCalls} vezes`);
console.log(`  setMessages(user) chamado: ${setMessagesUserCalls} vezes`);
console.log(`  Array de messages mudou: ${messagesArrayChanges} vezes`);
console.log(`  Chamadas bloqueadas: ${blockedCalls} vezes`);

console.log('\n' + '-'.repeat(80));

// Verificar duplica??o
if (handleSubmitCalls === 0) {
    console.log('??  ATEN??O: Nenhuma chamada de handleSubmit detectada!');
    console.log('   Poss?vel causa: Mensagem n?o foi processada ou logs n?o capturados');
} else if (handleSubmitCalls === 1) {
    console.log('? CORRETO: handleSubmit foi chamado apenas 1 vez');
    
    if (setMessagesUserCalls === 1) {
        console.log('? CORRETO: setMessages(user) foi chamado apenas 1 vez');
    } else if (setMessagesUserCalls > 1) {
        console.log(`? PROBLEMA: setMessages(user) foi chamado ${setMessagesUserCalls} vezes!`);
        console.log('   Causa: setState est? sendo chamado m?ltiplas vezes');
    }
} else {
    console.log(`? PROBLEMA: handleSubmit foi chamado ${handleSubmitCalls} vezes!`);
    console.log('   Causa: onSubmit do TextInput est? sendo disparado m?ltiplas vezes');
    
    if (blockedCalls > 0) {
        console.log(`? Prote??o ativa: ${blockedCalls} chamadas foram bloqueadas`);
    } else {
        console.log('? Prote??o N?O funcionou: Nenhuma chamada foi bloqueada');
    }
}

// Analisar stdout (visual)
console.log('\n' + '-'.repeat(80));
console.log('An?lise Visual (stdout):');

const visualMatches = (allStdout.match(/teste mensagem duplicada/g) || []).length;
console.log(`  Mensagem "teste mensagem duplicada" aparece ${visualMatches} vezes no output`);

if (visualMatches === 0) {
    console.log('  ??  Mensagem n?o apareceu (talvez n?o tenha sido processada)');
} else if (visualMatches === 1) {
    console.log('  ? Aparece apenas 1 vez (correto)');
} else {
    console.log(`  ? Aparece ${visualMatches} vezes (DUPLICA??O VISUAL CONFIRMADA!)`);
}

// Mostrar logs relevantes
console.log('\n' + '='.repeat(80));
console.log('?? LOGS RELEVANTES (stderr):');
console.log('='.repeat(80) + '\n');

const relevantLogs = allStderr.split('\n').filter(line => 
    line.includes('[HANDLE_SUBMIT') || 
    line.includes('setMessages (user)') ||
    line.includes('BLOQUEADO') ||
    line.includes('Messages array changed')
);

if (relevantLogs.length > 0) {
    relevantLogs.forEach(log => console.log(log));
} else {
    console.log('(Nenhum log relevante encontrado)');
}

// Salvar logs completos
console.log('\n' + '='.repeat(80));
console.log('?? Logs completos salvos em:');
console.log('  - test-stdout.log (output visual)');
console.log('  - test-stderr.log (logs de debug)');
console.log('='.repeat(80));

// Salvar logs
import { writeFileSync } from 'fs';
writeFileSync('/workspace/youtube-cli/test-stdout.log', allStdout);
writeFileSync('/workspace/youtube-cli/test-stderr.log', allStderr);

// Encerrar
console.log('\n?? Encerrando processo...\n');
proc.kill('SIGTERM');

setTimeout(async () => {
    // Exit code baseado no resultado
    const hasProblem = handleSubmitCalls > 1 || setMessagesUserCalls > 1 || visualMatches > 1;
    process.exit(hasProblem ? 1 : 0);
}, 1000);
