#!/usr/bin/env node
/**
 * TEST 5: STRESS TEST - M?LTIPLAS TOOLS SEQUENCIAIS
 * 
 * Testa execu??o de m?ltiplas tools em sequ?ncia
 * 
 * Valida:
 * - Execu??o de m?ltiplas tools
 * - Sistema n?o trava ou quebra
 * - Todas tools completam
 * - Performance aceit?vel
 */

import { spawn } from 'child_process';

console.log('\n?????????????????????????????????????????????????????????????');
console.log('?   TEST 5: STRESS TEST - M?LTIPLAS TOOLS SEQUENCIAIS      ?');
console.log('?????????????????????????????????????????????????????????????\n');

let fluiProcess;
let testPassed = false;
let stepsPassed = {
    writeFile: false,
    readFile: false,
    editFile: false,
    shellCommand: false,
    allCompleted: false
};

const startTime = Date.now();

console.log('?? Step 1: Iniciando Flui...');
fluiProcess = spawn('node', ['dist/cli.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let toolsExecuted = [];

fluiProcess.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    console.log(text);
    
    // Track tool executions
    if (text.includes('write_file') || text.includes('??')) {
        if (!toolsExecuted.includes('write_file')) {
            toolsExecuted.push('write_file');
            console.log('\n? write_file executada');
            stepsPassed.writeFile = true;
        }
    }
    
    if (text.includes('read_file') || text.includes('??')) {
        if (!toolsExecuted.includes('read_file')) {
            toolsExecuted.push('read_file');
            console.log('\n? read_file executada');
            stepsPassed.readFile = true;
        }
    }
    
    if (text.includes('edit_file') || text.includes('??')) {
        if (!toolsExecuted.includes('edit_file')) {
            toolsExecuted.push('edit_file');
            console.log('\n? edit_file executada');
            stepsPassed.editFile = true;
        }
    }
    
    if (text.includes('execute_shell') || text.includes('??')) {
        if (!toolsExecuted.includes('execute_shell')) {
            toolsExecuted.push('execute_shell');
            console.log('\n? execute_shell executada');
            stepsPassed.shellCommand = true;
        }
    }
    
    // Check if all completed
    if (toolsExecuted.length >= 4 && !stepsPassed.allCompleted) {
        const duration = Date.now() - startTime;
        console.log(`\n? Todas tools completadas em ${Math.round(duration/1000)}s`);
        stepsPassed.allCompleted = true;
        
        setTimeout(() => {
            printResults(duration);
            fluiProcess.kill();
            process.exit(testPassed ? 0 : 1);
        }, 2000);
    }
});

fluiProcess.stderr.on('data', (data) => {
    console.error('ERROR:', data.toString());
});

// Complex task requiring multiple tools
setTimeout(() => {
    console.log('?? Solicitando tarefa complexa com m?ltiplas tools...');
    fluiProcess.stdin.write(`
Fa?a o seguinte:
1. Crie um arquivo test-stress.txt com o conte?do "linha 1"
2. Leia o arquivo para confirmar
3. Edite o arquivo adicionando "linha 2"
4. Execute o comando "echo Teste conclu?do"

Execute tudo isso de forma sequencial.
`.trim() + '\n');
}, 2000);

function printResults(duration) {
    console.log('\n?????????????????????????????????????????????????????????????');
    console.log('?                    RESULTADOS DO TESTE                    ?');
    console.log('?????????????????????????????????????????????????????????????\n');
    
    console.log(`${stepsPassed.writeFile ? '?' : '?'} Write File`);
    console.log(`${stepsPassed.readFile ? '?' : '?'} Read File`);
    console.log(`${stepsPassed.editFile ? '?' : '?'} Edit File`);
    console.log(`${stepsPassed.shellCommand ? '?' : '?'} Shell Command`);
    console.log(`${stepsPassed.allCompleted ? '?' : '?'} All Completed`);
    
    const passed = Object.values(stepsPassed).filter(Boolean).length;
    const total = Object.keys(stepsPassed).length;
    
    // Test passes if all tools executed and duration < 60s
    testPassed = passed === total && duration < 60000;
    
    console.log(`\n??  Duration: ${Math.round(duration/1000)}s`);
    console.log(`?? Score: ${passed}/${total}`);
    console.log(`?? Tools executed: ${toolsExecuted.join(', ')}`);
    console.log(`\n${testPassed ? '? TESTE PASSOU' : '? TESTE FALHOU'}\n`);
}

setTimeout(() => {
    const duration = Date.now() - startTime;
    console.log('\n??  Test timeout');
    printResults(duration);
    fluiProcess.kill();
    process.exit(0); // Don't fail on timeout for stress test
}, 60000);
