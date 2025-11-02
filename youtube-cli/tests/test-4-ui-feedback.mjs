#!/usr/bin/env node
/**
 * TEST 4: FEEDBACK VISUAL E UI
 * 
 * Testa se os feedbacks visuais est?o funcionando
 * 
 * Valida:
 * - Mensagens formatadas corretamente
 * - ?cones e emojis presentes
 * - Progress indicators
 * - Tool execution feedback
 */

import { spawn } from 'child_process';

console.log('\n?????????????????????????????????????????????????????????????');
console.log('?        TEST 4: FEEDBACK VISUAL E UI                      ?');
console.log('?????????????????????????????????????????????????????????????\n');

let fluiProcess;
let testPassed = false;
let stepsPassed = {
    startMessage: false,
    toolIcon: false,
    progressIndicator: false,
    completionMessage: false
};

const expectedIcons = ['??', '??', '?', '??', '??', '??', '??', '??'];

console.log('?? Step 1: Iniciando Flui...');
fluiProcess = spawn('node', ['dist/cli.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let iconsFound = [];

fluiProcess.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    console.log(text);
    
    // Check for start message with icon
    if (text.includes('??') && text.includes('Starting')) {
        console.log('\n? Step 1 PASSED: Start message formatada');
        stepsPassed.startMessage = true;
    }
    
    // Collect tool icons
    expectedIcons.forEach(icon => {
        if (text.includes(icon) && !iconsFound.includes(icon)) {
            iconsFound.push(icon);
        }
    });
    
    if (iconsFound.length >= 2) {
        console.log(`\n? Step 2 PASSED: ?cones de tools detectados (${iconsFound.join(', ')})`);
        stepsPassed.toolIcon = true;
    }
    
    // Check for progress indicators
    if (text.includes('Executing') || text.includes('??') || text.includes('Processing')) {
        console.log('\n? Step 3 PASSED: Progress indicator presente');
        stepsPassed.progressIndicator = true;
    }
    
    // Check for completion message
    if (text.includes('?') && (text.includes('completed') || text.includes('success'))) {
        console.log('\n? Step 4 PASSED: Completion message formatada');
        stepsPassed.completionMessage = true;
        
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

// Request something that will execute tools
setTimeout(() => {
    console.log('?? Solicitando cria??o de arquivo...');
    fluiProcess.stdin.write('Crie um arquivo hello.txt com "Hello World!"\n');
}, 2000);

function printResults() {
    console.log('\n?????????????????????????????????????????????????????????????');
    console.log('?                    RESULTADOS DO TESTE                    ?');
    console.log('?????????????????????????????????????????????????????????????\n');
    
    console.log(`${stepsPassed.startMessage ? '?' : '?'} Start Message`);
    console.log(`${stepsPassed.toolIcon ? '?' : '?'} Tool Icons (${iconsFound.length} found)`);
    console.log(`${stepsPassed.progressIndicator ? '?' : '?'} Progress Indicator`);
    console.log(`${stepsPassed.completionMessage ? '?' : '?'} Completion Message`);
    
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
}, 30000);
