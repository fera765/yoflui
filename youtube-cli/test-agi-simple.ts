/**
 * TESTE SIMPLES - BYPASS decomposição
 */

import { SpecializedAgent } from './source/agi/specialized-agents.js';
import OpenAI from 'openai';
import { getConfig } from './source/llm-config.js';
import { loadQwenCredentials, getValidAccessToken } from './source/qwen-oauth.js';

async function testSimpleAgent() {
	console.log('TESTE DIRETO DO AGENTE (sem orquestrador)\n');

	// Inicializar OpenAI
	const config = getConfig();
	const qwenCreds = loadQwenCredentials();
	let endpoint = config.endpoint;
	let apiKey = config.apiKey || 'not-needed';

	if (qwenCreds?.access_token) {
		const validToken = await getValidAccessToken();
		if (validToken) {
			apiKey = validToken;
			const resourceUrl = qwenCreds.resource_url || 'portal.qwen.ai';
			endpoint = `https://${resourceUrl}/v1`;
		}
	}

	const openai = new OpenAI({ baseURL: endpoint, apiKey });
	const agent = new SpecializedAgent('synthesis', openai);

	console.log('✅ OpenAI e Agente inicializados');
	console.log(`Endpoint: ${endpoint}`);
	console.log(`Model: ${config.model}\n`);

	// Teste direto
	console.log('Pergunta: Qual é a capital do Brasil?\n');
	
	try {
		const start = Date.now();
		const result = await agent.execute(
			'Responda de forma direta e concisa: Qual é a capital do Brasil?',
			[], // Sem tools
			process.cwd()
		);
		const time = ((Date.now() - start) / 1000).toFixed(2);
		
		console.log(`\n✅ SUCESSO (${time}s):`);
		console.log(result);
		console.log('\n🎉 AGENTE FUNCIONOU!');
		
	} catch (error) {
		console.log(`\n❌ ERRO:`);
		console.log(error instanceof Error ? error.message : String(error));
	}
}

testSimpleAgent().catch(console.error);
