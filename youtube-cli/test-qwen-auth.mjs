#!/usr/bin/env node

import { readFileSync } from 'fs';

console.log('?? TESTE DE AUTENTICA??O QWEN\n');

// Carregar credenciais
const creds = JSON.parse(readFileSync('./qwen-credentials.json', 'utf-8'));

console.log('?? Credenciais carregadas:');
console.log('  Token:', creds.access_token.substring(0, 20) + '...');
console.log('  Expiry:', new Date(creds.expiry_date).toLocaleString());
console.log('  Resource:', creds.resource_url);

// Verificar se token est? expirado
const now = Date.now();
const isExpired = creds.expiry_date < now;
const timeLeft = Math.floor((creds.expiry_date - now) / 1000 / 60);

console.log('\n? Status do Token:');
if (isExpired) {
    console.log('  ? EXPIRADO');
} else {
    console.log(`  ? V?LIDO (${timeLeft} minutos restantes)`);
}

// Testar chamada ? API
console.log('\n?? Testando chamada ? API...\n');

const endpoint = `https://${creds.resource_url}/v1/chat/completions`;

try {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${creds.access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'qwen3-coder-plus',
            messages: [
                { role: 'user', content: 'Responda apenas: OK' }
            ]
        })
    });
    
    console.log('?? Status da resposta:', response.status, response.statusText);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.log('\n? ERRO:');
        console.log(errorText);
        
        if (response.status === 401) {
            console.log('\n?? DIAGN?STICO:');
            console.log('  - Token pode estar inv?lido');
            console.log('  - Endpoint pode estar incorreto');
            console.log('  - Refresh token necess?rio');
        }
        process.exit(1);
    }
    
    const data = await response.json();
    console.log('\n? SUCESSO!');
    console.log('Resposta:', data.choices[0].message.content);
    console.log('\nTokens usados:', data.usage);
    
} catch (error) {
    console.log('\n? ERRO NA CHAMADA:');
    console.log(error.message);
    process.exit(1);
}
