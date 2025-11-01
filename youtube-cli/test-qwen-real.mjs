#!/usr/bin/env node

/**
 * TESTE REAL - API Qwen
 * SEM MOCKS - APENAS REAL
 */

import { loadQwenCredentials, getValidAccessToken, refreshAccessToken, saveQwenCredentials } from './dist/qwen-oauth.js';

console.log('????????????????????????????????????????????????????????????');
console.log('?       TESTE REAL - API QWEN (SEM MOCKS)                 ?');
console.log('????????????????????????????????????????????????????????????');
console.log('');

async function testQwenAPI() {
    try {
        // 1. Carregar credenciais
        console.log('?? [1/5] Carregando credenciais...');
        let creds = loadQwenCredentials();
        
        if (!creds) {
            console.log('? Credenciais n?o encontradas!');
            process.exit(1);
        }
        
        console.log('? Credenciais carregadas');
        console.log(`   Token: ${creds.access_token.substring(0, 20)}...`);
        console.log(`   Expira em: ${new Date(creds.expiry_date).toLocaleString()}`);
        console.log(`   Resource URL: ${creds.resource_url}`);
        console.log('');
        
        // 2. Verificar expira??o e fazer refresh se necess?rio
        console.log('? [2/5] Verificando expira??o do token...');
        const now = Date.now();
        const isExpired = creds.expiry_date && now > creds.expiry_date;
        
        if (isExpired) {
            console.log('??  Token EXPIRADO - Fazendo refresh autom?tico...');
            
            if (!creds.refresh_token) {
                console.log('? Sem refresh token dispon?vel');
                process.exit(1);
            }
            
            try {
                const newToken = await refreshAccessToken(creds.refresh_token);
                
                const newCreds = {
                    access_token: newToken.access_token,
                    refresh_token: newToken.refresh_token || creds.refresh_token,
                    token_type: newToken.token_type,
                    expires_in: newToken.expires_in,
                    expiry_date: Date.now() + (newToken.expires_in * 1000),
                    resource_url: newToken.resource_url || creds.resource_url,
                };
                
                saveQwenCredentials(newCreds);
                console.log('? Token atualizado via refresh!');
                creds = newCreds;
            } catch (error) {
                console.log('? Falha no refresh:', error.message);
                process.exit(1);
            }
        } else {
            const minutesLeft = Math.floor((creds.expiry_date - now) / 1000 / 60);
            console.log(`? Token v?lido (expira em ${minutesLeft} minutos)`);
        }
        console.log('');
        
        // 3. Obter token v?lido
        console.log('?? [3/5] Obtendo token v?lido...');
        const validToken = await getValidAccessToken();
        
        if (!validToken) {
            console.log('? Falha ao obter token v?lido');
            process.exit(1);
        }
        
        console.log('? Token v?lido obtido');
        console.log('');
        
        // 4. Construir endpoint
        console.log('?? [4/5] Construindo endpoint API...');
        const endpoint = `https://${creds.resource_url}/v1`;
        console.log(`   Endpoint: ${endpoint}`);
        console.log('');
        
        // 5. Testar chamadas ? LLM com diferentes modelos
        console.log('?? [5/5] Testando chamada REAL ? LLM...');
        
        const modelsToTry = [
            'qwen3-coder-plus',
            'qwen-max',
            'qwen-turbo',
            'qwen2.5-72b-instruct',
            'qwen2.5-coder-32b-instruct',
        ];
        
        let success = false;
        let successModel = null;
        
        for (const model of modelsToTry) {
            console.log(`   Tentando modelo: ${model}...`);
            
            try {
                const chatResponse = await fetch(`${endpoint}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${validToken}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            {
                                role: 'user',
                                content: 'Diga apenas "Sistema funcionando!" se voc? estiver recebendo esta mensagem.',
                            },
                        ],
                        max_tokens: 30,
                    }),
                });
                
                if (!chatResponse.ok) {
                    const errorText = await chatResponse.text();
                    console.log(`      ? Falha (${chatResponse.status})`);
                    continue;
                }
                
                const chatData = await chatResponse.json();
                
                if (chatData.choices && chatData.choices[0] && chatData.choices[0].message) {
                    console.log(`      ? SUCESSO!`);
                    console.log('');
                    console.log('??????????????????????????????????????????????????????????');
                    console.log(`? MODELO: ${model}`);
                    console.log(`? RESPOSTA: ${chatData.choices[0].message.content}`);
                    console.log('??????????????????????????????????????????????????????????');
                    console.log('');
                    console.log(`?? Tokens usados: ${chatData.usage?.total_tokens || 'N/A'}`);
                    console.log(`   - Prompt: ${chatData.usage?.prompt_tokens || 'N/A'}`);
                    console.log(`   - Completion: ${chatData.usage?.completion_tokens || 'N/A'}`);
                    
                    success = true;
                    successModel = model;
                    break;
                }
            } catch (error) {
                console.log(`      ? Erro: ${error.message}`);
                continue;
            }
        }
        
        if (!success) {
            console.log('');
            console.log('? Nenhum modelo funcionou!');
            console.log('   Modelos tentados:', modelsToTry.join(', '));
            process.exit(1);
        }
        
        console.log('');
        console.log('????????????????????????????????????????????????????????????');
        console.log('?                                                          ?');
        console.log('?        ? TESTE COMPLETO - TUDO FUNCIONANDO! ?          ?');
        console.log('?                                                          ?');
        console.log('?  ? Credenciais carregadas ?                             ?');
        console.log('?  ? Token v?lido ou refreshed ?                          ?');
        console.log('?  ? API acess?vel ?                                      ?');
        console.log(`?  ? LLM respondendo (${successModel}) ?                  ?`);
        console.log('?                                                          ?');
        console.log('????????????????????????????????????????????????????????????');
        
        return true;
        
    } catch (error) {
        console.log('');
        console.log('? ERRO DURANTE O TESTE:');
        console.log('   ', error.message);
        console.log('');
        if (error.stack) {
            console.log('Stack trace:');
            console.log(error.stack);
        }
        process.exit(1);
    }
}

testQwenAPI().then(() => {
    console.log('');
    console.log('? Teste finalizado com sucesso!');
    process.exit(0);
}).catch(error => {
    console.log('? Erro fatal:', error);
    process.exit(1);
});
