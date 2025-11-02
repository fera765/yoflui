#!/usr/bin/env node
/**
 * TEST 1: AUTOMATION COM WEBHOOK TRIGGER
 * 
 * Teste completo do sistema de automa??o acionado por webhook
 * 
 * Valida:
 * - Setup de webhook
 * - Espera de trigger
 * - Execu??o coordenada pela LLM
 * - Tool execution (YouTube search)
 * - Context preservation ap?s automa??o
 */

import { spawn } from 'child_process';
import http from 'http';

console.log('\n?????????????????????????????????????????????????????????????');
console.log('?    TEST 1: AUTOMA??O COM WEBHOOK TRIGGER                 ?');
console.log('?????????????????????????????????????????????????????????????\n');

let fluiProcess;
let apiKey = '';
let webhookUrl = '';
let testPassed = false;
let stepsPassed = {
    webhookSetup: false,
    webhookTrigger: false,
    toolExecution: false,
    contextPreservation: false
};

// Step 1: Start Flui
console.log('?? Step 1: Iniciando Flui...');
fluiProcess = spawn('node', ['dist/cli.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let setupComplete = false;

fluiProcess.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    console.log(text);
    
    // Check for webhook setup
    if (text.includes('Webhook configured') && text.includes('http://127.0.0.1:8080/webhook')) {
        const urlMatch = text.match(/http:\/\/127\.0\.0\.1:8080\/webhook\/[a-zA-Z0-9-]+/);
        const keyMatch = text.match(/Bearer ([a-zA-Z0-9-]+)/);
        
        if (urlMatch) webhookUrl = urlMatch[0];
        if (keyMatch) apiKey = keyMatch[1];
        
        if (webhookUrl) {
            console.log('\n? Step 1 PASSED: Webhook configurado');
            console.log(`   ?? URL: ${webhookUrl}`);
            console.log(`   ?? Key: ${apiKey || 'Not required'}`);
            stepsPassed.webhookSetup = true;
            setupComplete = true;
            
            // Trigger webhook after 2 seconds
            setTimeout(triggerWebhook, 2000);
        }
    }
    
    // Check for tool execution
    if (text.includes('Executing') && (text.includes('youtube') || text.includes('search'))) {
        console.log('\n? Step 3 PASSED: Tool executada');
        stepsPassed.toolExecution = true;
    }
    
    // Check for automation complete
    if (text.includes('Automation completed') || text.includes('completed in')) {
        console.log('\n? Step 2 PASSED: Automa??o completada');
        
        // Test context preservation
        setTimeout(() => {
            console.log('\n?? Step 4: Testando preserva??o de contexto...');
            fluiProcess.stdin.write('Mostre os 3 melhores coment?rios\n');
        }, 1000);
    }
    
    // Check for context preservation (LLM should use previous results)
    if (setupComplete && text.includes('coment?rios') && !text.includes('Error')) {
        console.log('\n? Step 4 PASSED: Contexto preservado');
        stepsPassed.contextPreservation = true;
        
        // All tests passed
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

// Step 2: Select automation
console.log('?? Step 2: Selecionando automa??o...');
setTimeout(() => {
    fluiProcess.stdin.write('@YouTube Webhook Analysis\n');
}, 1000);

// Function to trigger webhook
async function triggerWebhook() {
    if (!webhookUrl) {
        console.log('? Webhook URL not found');
        return;
    }
    
    console.log('\n?? Step 3: Acionando webhook...');
    
    const payload = JSON.stringify({
        searchTopic: 'artificial intelligence',
        maxVideos: 3
    });
    
    const url = new URL(webhookUrl);
    const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length,
            ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
        }
    };
    
    const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('? Webhook triggered successfully');
                stepsPassed.webhookTrigger = true;
            } else {
                console.log(`? Webhook failed: ${res.statusCode}`);
            }
        });
    });
    
    req.on('error', (e) => {
        console.error(`? Webhook request error: ${e.message}`);
    });
    
    req.write(payload);
    req.end();
}

function printResults() {
    console.log('\n?????????????????????????????????????????????????????????????');
    console.log('?                    RESULTADOS DO TESTE                    ?');
    console.log('?????????????????????????????????????????????????????????????\n');
    
    console.log(`${stepsPassed.webhookSetup ? '?' : '?'} Webhook Setup`);
    console.log(`${stepsPassed.webhookTrigger ? '?' : '?'} Webhook Trigger`);
    console.log(`${stepsPassed.toolExecution ? '?' : '?'} Tool Execution`);
    console.log(`${stepsPassed.contextPreservation ? '?' : '?'} Context Preservation`);
    
    const passed = Object.values(stepsPassed).filter(Boolean).length;
    const total = Object.keys(stepsPassed).length;
    
    testPassed = passed === total;
    
    console.log(`\n?? Score: ${passed}/${total}`);
    console.log(`\n${testPassed ? '? TESTE PASSOU' : '? TESTE FALHOU'}\n`);
}

// Timeout after 60 seconds
setTimeout(() => {
    console.log('\n? Test timeout');
    printResults();
    fluiProcess.kill();
    process.exit(1);
}, 60000);
