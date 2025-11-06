#!/usr/bin/env node

/**
 * Teste de Tarefa Simples - FLUI AGI Superior
 * Valida funcionamento básico do sistema
 */

import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourcePath = join(__dirname, 'source');
const { runAutonomousAgent } = await import(`file://${join(sourcePath, 'autonomous-agent.ts')}`);
const { setConfig } = await import(`file://${join(sourcePath, 'llm-config.ts')}`);
const { loadQwenCredentials } = await import(`file://${join(sourcePath, 'qwen-oauth.ts')}`);

function setupTest() {
	console.log('🔧 Configurando ambiente...\n');
	
	const qwenCreds = loadQwenCredentials();
	if (!qwenCreds || !qwenCreds.access_token) {
		throw new Error('❌ Credenciais Qwen não encontradas');
	}
	
	const resourceUrl = qwenCreds.resource_url || 'portal.qwen.ai';
	const endpoint = `https://${resourceUrl}/v1`;
	
	setConfig({
		endpoint,
		apiKey: qwenCreds.access_token,
		model: 'qwen3-coder-plus',
		maxVideos: 5,
		maxCommentsPerVideo: 10,
	});
	
	console.log('✅ Ambiente configurado\n');
}

async function testSimpleTask() {
	console.log('═══════════════════════════════════════════════════════════');
	console.log('🧪 TESTE DE TAREFA SIMPLES');
	console.log('═══════════════════════════════════════════════════════════\n');
	
	const task = 'Crie um arquivo chamado teste-simples.txt com o texto "Flui funcionando corretamente!"';
	console.log(`📋 Tarefa: ${task}\n`);
	
	const workDir = join(process.cwd(), 'work', `test-simple-${Date.now()}`);
	mkdirSync(workDir, { recursive: true });
	
	const startTime = Date.now();
	let success = false;
	let error = null;
	let result = '';
	
	try {
		result = await runAutonomousAgent({
			userMessage: task,
			workDir,
			onProgress: (message) => {
				console.log(`   📝 ${message}`);
			},
			onKanbanUpdate: (tasks) => {
				const done = tasks.filter(t => t.status === 'done').length;
				const total = tasks.length;
				console.log(`   📊 Kanban: ${done}/${total} concluídas`);
			},
			onToolExecute: (toolName) => {
				console.log(`   🔧 Executando: ${toolName}`);
			},
			onToolComplete: (toolName, args, result, hasError) => {
				console.log(`   ${hasError ? '❌' : '✅'} ${toolName}: ${hasError ? 'Erro' : 'Sucesso'}`);
			},
		});
		
		// Verificar se arquivo foi criado
		const expectedFile = join(workDir, 'teste-simples.txt');
		success = existsSync(expectedFile);
		
		if (success) {
			const content = readFileSync(expectedFile, 'utf-8');
			console.log(`\n✅ Arquivo criado: ${expectedFile}`);
			console.log(`📄 Conteúdo: ${content}`);
		}
		
	} catch (err) {
		error = err;
		success = false;
	}
	
	const duration = Date.now() - startTime;
	
	console.log('\n═══════════════════════════════════════════════════════════');
	console.log(success ? '✅ TESTE SIMPLES: SUCESSO' : '❌ TESTE SIMPLES: FALHOU');
	console.log('═══════════════════════════════════════════════════════════\n');
	console.log(`⏱️  Tempo de execução: ${duration}ms`);
	console.log(`📊 Resultado: ${success ? 'PASSOU' : 'FALHOU'}`);
	if (error) {
		console.log(`❌ Erro: ${error.message}`);
	}
	console.log(`\n💬 Resposta do Flui:\n${result.substring(0, 500)}...\n`);
	
	return { success, duration, error, result };
}

async function runTest() {
	try {
		setupTest();
		const result = await testSimpleTask();
		process.exit(result.success ? 0 : 1);
	} catch (error) {
		console.error('\n❌ Erro:', error.message);
		process.exit(1);
	}
}

runTest();
