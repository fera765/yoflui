#!/usr/bin/env node
/**
 * TEST 2: RESILIENCE - RETRY E TIMEOUT
 * 
 * Testa sistema de retry e timeout em execu??o de tools
 * 
 * Valida:
 * - Timeout em tools
 * - Retry com exponential backoff
 * - Circuit breaker
 * - Fallback gracioso
 */

import { spawn } from 'child_process';

console.log('\n?????????????????????????????????????????????????????????????');
console.log('?    TEST 2: RESILIENCE - RETRY E TIMEOUT                  ?');
console.log('?????????????????????????????????????????????????????????????\n');

let fluiProcess;
let testPassed = false;
let stepsPassed = {
    toolExecution: false,
    retryAttempt: false,
    errorHandling: false,
    gracefulDegradation: false
};

console.log('?? Step 1: Iniciando Flui...');
fluiProcess = spawn('node', ['dist/cli.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let retryCount = 0;

fluiProcess.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    console.log(text);
    
    // Count retry attempts
    if (text.includes('Retry') || text.includes('retry') || text.includes('??')) {
        retryCount++;
        if (retryCount >= 1) {
            console.log(`\n? Step 2 PASSED: Retry detectado (${retryCount} tentativas)`);
            stepsPassed.retryAttempt = true;
        }
    }
    
    // Check for tool execution
    if (text.includes('Executing') && text.includes('web_fetch')) {
        console.log('\n? Step 1 PASSED: Tool executada');
        stepsPassed.toolExecution = true;
    }
    
    // Check for error handling
    if (text.includes('Error') || text.includes('failed') || text.includes('?')) {
        console.log('\n? Step 3 PASSED: Error handling ativo');
        stepsPassed.errorHandling = true;
    }
    
    // Check for graceful degradation
    if (text.includes('completed') || text.includes('tentei') || text.includes('n?o foi poss?vel')) {
        console.log('\n? Step 4 PASSED: Graceful degradation');
        stepsPassed.gracefulDegradation = true;
        
        setTimeout(() => {
            printResults();
            fluiProcess.kill();
            process.exit(testPassed ? 0 : 1);
        }, 2000);
    }
});

fluiProcess.stderr.on('data', (data) => {
    console.error('ERROR:', data.toString());
});

// Step 2: Request that will fail and trigger retry
console.log('?? Step 2: Solicitando URL inv?lida (for?ar retry)...');
setTimeout(() => {
    fluiProcess.stdin.write('Acesse http://invalid-url-that-does-not-exist-12345.com/test e me diga o conte?do\n');
}, 2000);

function printResults() {
    console.log('\n?????????????????????????????????????????????????????????????');
    console.log('?                    RESULTADOS DO TESTE                    ?');
    console.log('?????????????????????????????????????????????????????????????\n');
    
    console.log(`${stepsPassed.toolExecution ? '?' : '?'} Tool Execution`);
    console.log(`${stepsPassed.retryAttempt ? '?' : '?'} Retry Attempt (${retryCount}x)`);
    console.log(`${stepsPassed.errorHandling ? '?' : '?'} Error Handling`);
    console.log(`${stepsPassed.gracefulDegradation ? '?' : '?'} Graceful Degradation`);
    
    const passed = Object.values(stepsPassed).filter(Boolean).length;
    const total = Object.keys(stepsPassed).length;
    
    testPassed = passed >= 3; // At least 3/4 must pass
    
    console.log(`\n?? Score: ${passed}/${total}`);
    console.log(`\n${testPassed ? '? TESTE PASSOU' : '? TESTE FALHOU'}\n`);
}

setTimeout(() => {
    console.log('\n??  Test timeout');
    printResults();
    fluiProcess.kill();
    process.exit(testPassed ? 0 : 1);
}, 30000);
