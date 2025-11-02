#!/usr/bin/env node
/**
 * TEST 3: PRESERVA??O DE CONTEXTO E CONVERSA??O
 * 
 * Testa se o contexto ? mantido entre diferentes intera??es
 * 
 * Valida:
 * - Contexto de automa??o preservado
 * - LLM pode usar tools em conversa??o p?s-automa??o
 * - Refer?ncias a respostas anteriores funcionam
 * - Hist?rico de conversa??o v?lido
 */

import { spawn } from 'child_process';

console.log('\n?????????????????????????????????????????????????????????????');
console.log('?   TEST 3: PRESERVA??O DE CONTEXTO E CONVERSA??O          ?');
console.log('?????????????????????????????????????????????????????????????\n');

let fluiProcess;
let testPassed = false;
let stepsPassed = {
    firstResponse: false,
    contextReference: false,
    toolInConversation: false,
    followUpResponse: false
};

console.log('?? Step 1: Iniciando Flui...');
fluiProcess = spawn('node', ['dist/cli.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let conversationStep = 0;

fluiProcess.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    console.log(text);
    
    // Step 1: First response
    if (conversationStep === 0 && text.includes('TypeScript') && !text.includes('Error')) {
        console.log('\n? Step 1 PASSED: Primeira resposta recebida');
        stepsPassed.firstResponse = true;
        conversationStep = 1;
        
        // Ask follow-up question referencing previous answer
        setTimeout(() => {
            console.log('\n?? Step 2: Pergunta de follow-up com refer?ncia...');
            fluiProcess.stdin.write('Voc? pode explicar melhor o que voc? acabou de mencionar?\n');
        }, 2000);
    }
    
    // Step 2: Context reference
    if (conversationStep === 1 && text.includes('TypeScript') && !text.includes('Error')) {
        console.log('\n? Step 2 PASSED: Contexto referenciado corretamente');
        stepsPassed.contextReference = true;
        conversationStep = 2;
        
        // Request tool usage in conversation
        setTimeout(() => {
            console.log('\n?? Step 3: Solicitando uso de tool na conversa??o...');
            fluiProcess.stdin.write('Crie um arquivo chamado test-context.txt com o resumo do que discutimos\n');
        }, 2000);
    }
    
    // Step 3: Tool in conversation
    if (conversationStep === 2 && (text.includes('write_file') || text.includes('??'))) {
        console.log('\n? Step 3 PASSED: Tool executada na conversa??o');
        stepsPassed.toolInConversation = true;
        conversationStep = 3;
        
        // Final follow-up
        setTimeout(() => {
            console.log('\n?? Step 4: Follow-up final...');
            fluiProcess.stdin.write('Obrigado! Est? tudo certo?\n');
        }, 2000);
    }
    
    // Step 4: Follow-up response
    if (conversationStep === 3 && !text.includes('Error') && 
        (text.includes('sim') || text.includes('certo') || text.includes('perfeito'))) {
        console.log('\n? Step 4 PASSED: Follow-up respondido');
        stepsPassed.followUpResponse = true;
        
        setTimeout(() => {
            printResults();
            fluiProcess.kill();
            process.exit(testPassed ? 0 : 1);
        }, 2000);
    }
});

fluiProcess.stderr.on('data', (data) => {
    const error = data.toString();
    // Ignore tool call errors (they're expected)
    if (!error.includes('tool_calls')) {
        console.error('ERROR:', error);
    }
});

// Start conversation
setTimeout(() => {
    console.log('?? Iniciando conversa sobre TypeScript...');
    fluiProcess.stdin.write('Me explique o que ? TypeScript em 2 frases\n');
}, 2000);

function printResults() {
    console.log('\n?????????????????????????????????????????????????????????????');
    console.log('?                    RESULTADOS DO TESTE                    ?');
    console.log('?????????????????????????????????????????????????????????????\n');
    
    console.log(`${stepsPassed.firstResponse ? '?' : '?'} First Response`);
    console.log(`${stepsPassed.contextReference ? '?' : '?'} Context Reference`);
    console.log(`${stepsPassed.toolInConversation ? '?' : '?'} Tool In Conversation`);
    console.log(`${stepsPassed.followUpResponse ? '?' : '?'} Follow-up Response`);
    
    const passed = Object.values(stepsPassed).filter(Boolean).length;
    const total = Object.keys(stepsPassed).length;
    
    testPassed = passed >= 3; // At least 3/4
    
    console.log(`\n?? Score: ${passed}/${total}`);
    console.log(`\n${testPassed ? '? TESTE PASSOU' : '? TESTE FALHOU'}\n`);
}

setTimeout(() => {
    console.log('\n??  Test timeout');
    printResults();
    fluiProcess.kill();
    process.exit(testPassed ? 0 : 1);
}, 45000);
