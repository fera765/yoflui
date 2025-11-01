#!/usr/bin/env node

/**
 * TESTE REAL - API Qwen
 * Testa chamadas reais ? API do Qwen
 * SEM MOCKS - APENAS REAL
 */

const { loadQwenCredentials, getValidAccessToken, refreshAccessToken, saveQwenCredentials } = require('./dist/qwen-oauth.js');

console.log('????????????????????????????????????????????????????????????');
console.log('?       TESTE REAL - API QWEN (SEM MOCKS)                 ?');
console.log('????????????????????????????????????????????????????????????');
console.log('');

async function testQwenAPI() {
    try {
        // 1. Carregar credenciais
        console.log('?? [1/5] Carregando credenciais...');
        const creds = loadQwenCredentials();
        
        if (!creds) {
            console.log('? Credenciais n?o encontradas!');
            process.exit(1);
        }
        
        console.log('? Credenciais carregadas');
        console.log(`   Token: ${creds.access_token.substring(0, 20)}...`);
        console.log(`   Expira em: ${new Date(creds.expiry_date).toLocaleString()}`);
        console.log(`   Resource URL: ${creds.resource_url}`);
        console.log('');
        
        // 2. Verificar expira??o
        console.log('? [2/5] Verificando expira??o do token...');
        const now = Date.now();
        const isExpired = creds.expiry_date && now > creds.expiry_date;
        
        if (isExpired) {
            console.log('??  Token EXPIRADO!');
            console.log('   Expirou em:', new Date(creds.expiry_date).toLocaleString());
            console.log('   Agora:', new Date(now).toLocaleString());
            
            if (creds.refresh_token) {
                console.log('?? Tentando refresh autom?tico...');
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
                    console.log(`   Novo token: ${newToken.access_token.substring(0, 20)}...`);
                    console.log(`   Expira em: ${new Date(newCreds.expiry_date).toLocaleString()}`);
                } catch (error) {
                    console.log('? Falha no refresh:', error.message);
                    console.log('?? Voc? precisa fazer novo login OAuth');
                    process.exit(1);
                }
            } else {
                console.log('? Sem refresh token dispon?vel');
                console.log('?? Voc? precisa fazer novo login OAuth');
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
        
        // 4. Listar modelos dispon?veis
        console.log('?? [4/5] Listando modelos dispon?veis...');
        const endpoint = `https://${creds.resource_url}/v1`;
        
        const modelsResponse = await fetch(`${endpoint}/models`, {
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Accept': 'application/json',
            },
        });
        
        if (!modelsResponse.ok) {
            console.log(`? Falha ao listar modelos: ${modelsResponse.status}`);
            const errorText = await modelsResponse.text();
            console.log('   Erro:', errorText);
            process.exit(1);
        }
        
        const modelsData = await modelsResponse.json();
        console.log('? Modelos dispon?veis:');
        
        if (modelsData.data && Array.isArray(modelsData.data)) {
            modelsData.data.slice(0, 5).forEach(model => {
                console.log(`   - ${model.id || model.name}`);
            });
            if (modelsData.data.length > 5) {
                console.log(`   ... e mais ${modelsData.data.length - 5} modelos`);
            }
        } else {
            console.log('   (formato inesperado)');
        }
        console.log('');
        
        // 5. Testar chamada real ? LLM
        console.log('?? [5/5] Testando chamada REAL ? LLM...');
        console.log('   Modelo: qwen-coder-plus');
        console.log('   Mensagem: "Ol?! Voc? consegue me responder?"');
        console.log('');
        
        const chatResponse = await fetch(`${endpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                model: 'qwen-coder-plus',
                messages: [
                    {
                        role: 'user',
                        content: 'Ol?! Voc? consegue me responder? Responda apenas "Sim, estou funcionando!" se estiver recebendo esta mensagem.',
                    },
                ],
                max_tokens: 50,
            }),
        });
        
        if (!chatResponse.ok) {
            console.log(`? Falha na chamada ? LLM: ${chatResponse.status}`);
            const errorText = await chatResponse.text();
            console.log('   Erro:', errorText);
            process.exit(1);
        }
        
        const chatData = await chatResponse.json();
        
        if (chatData.choices && chatData.choices[0] && chatData.choices[0].message) {
            console.log('? RESPOSTA DA LLM:');
            console.log('??????????????????????????????????????????????????????????');
            console.log(`? ${chatData.choices[0].message.content}`);
            console.log('??????????????????????????????????????????????????????????');
            console.log('');
            console.log(`?? Tokens usados: ${chatData.usage?.total_tokens || 'N/A'}`);
        } else {
            console.log('??  Resposta recebida mas formato inesperado');
            console.log(JSON.stringify(chatData, null, 2));
        }
        
        console.log('');
        console.log('????????????????????????????????????????????????????????????');
        console.log('?                                                          ?');
        console.log('?        ? TESTE COMPLETO - TUDO FUNCIONANDO! ?          ?');
        console.log('?                                                          ?');
        console.log('????????????????????????????????????????????????????????????');
        
        return true;
        
    } catch (error) {
        console.log('');
        console.log('? ERRO DURANTE O TESTE:');
        console.log('   ', error.message);
        console.log('');
        console.log('Stack trace:');
        console.log(error.stack);
        process.exit(1);
    }
}

// Executar teste
testQwenAPI().then(() => {
    process.exit(0);
}).catch(error => {
    console.log('? Erro fatal:', error);
    process.exit(1);
});
