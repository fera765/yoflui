#!/usr/bin/env node

/**
 * Teste de Tarefa Complexa - FLUI AGI Superior
 * Valida funcionamento avançado com múltiplas etapas
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

async function testComplexTask() {
	console.log('═══════════════════════════════════════════════════════════');
	console.log('🧪 TESTE DE TAREFA COMPLEXA');
	console.log('═══════════════════════════════════════════════════════════\n');
	
	const task = `Crie uma estrutura de projeto web simples:
1. Crie um arquivo index.html com estrutura HTML5 básica
2. Crie um arquivo style.css com estilos básicos
3. Crie um arquivo script.js com uma função que exibe "Hello Flui"
4. Crie um arquivo README.md explicando o projeto
5. Leia todos os arquivos criados e confirme que foram criados corretamente`;
	
	console.log(`📋 Tarefa Complexa:\n${task}\n`);
	
	const workDir = join(process.cwd(), 'work', `test-complex-${Date.now()}`);
	mkdirSync(workDir, { recursive: true });
	
	const startTime = Date.now();
	let success = false;
	let error = null;
	let result = '';
	let filesCreated = [];
	let toolsExecuted = [];
	
	try {
		result = await runAutonomousAgent({
			userMessage: task,
			workDir,
			onProgress: (message) => {
				console.log(`   📝 ${message}`);
			},
			onKanbanUpdate: (tasks) => {
				const todo = tasks.filter(t => t.status === 'todo').length;
				const inProgress = tasks.filter(t => t.status === 'in_progress').length;
				const done = tasks.filter(t => t.status === 'done').length;
				console.log(`\n   📊 Kanban: ${todo} pendentes | ${inProgress} em progresso | ${done} concluídas\n`);
			},
			onToolExecute: (toolName, args) => {
				toolsExecuted.push(toolName);
				console.log(`   🔧 Executando: ${toolName}`);
				if (toolName === 'write_file' && args.file_path) {
					console.log(`      📄 Criando: ${args.file_path}`);
				}
			},
			onToolComplete: (toolName, args, toolResult, hasError) => {
				console.log(`   ${hasError ? '❌' : '✅'} ${toolName}: ${hasError ? 'Erro' : 'Sucesso'}`);
				if (toolName === 'write_file' && !hasError) {
					filesCreated.push(args.file_path);
				}
			},
		});
		
		// Verificar arquivos criados
		const expectedFiles = [
			'index.html',
			'style.css',
			'script.js',
			'README.md'
		];
		
		const filesFound = expectedFiles.filter(file => {
			const filePath = join(workDir, file);
			return existsSync(filePath);
		});
		
		success = filesFound.length === expectedFiles.length;
		
		console.log(`\n📁 Arquivos verificados:`);
		expectedFiles.forEach(file => {
			const exists = filesFound.includes(file);
			console.log(`   ${exists ? '✅' : '❌'} ${file}`);
		});
		
		if (success) {
			console.log(`\n📄 Conteúdo dos arquivos:`);
			expectedFiles.forEach(file => {
				const filePath = join(workDir, file);
				const content = readFileSync(filePath, 'utf-8');
				console.log(`\n   ${file}:`);
				console.log(`   ${content.substring(0, 200).split('\n').join('\n   ')}...`);
			});
		}
		
	} catch (err) {
		error = err;
		success = false;
	}
	
	const duration = Date.now() - startTime;
	
	console.log('\n═══════════════════════════════════════════════════════════');
	console.log(success ? '✅ TESTE COMPLEXO: SUCESSO' : '❌ TESTE COMPLEXO: FALHOU');
	console.log('═══════════════════════════════════════════════════════════\n');
	console.log(`⏱️  Tempo de execução: ${duration}ms`);
	console.log(`📊 Resultado: ${success ? 'PASSOU' : 'FALHOU'}`);
	console.log(`🔧 Ferramentas executadas: ${toolsExecuted.length} (${[...new Set(toolsExecuted)].join(', ')})`);
	console.log(`📁 Arquivos criados: ${filesCreated.length}`);
	if (error) {
		console.log(`❌ Erro: ${error.message}`);
	}
	console.log(`\n💬 Resposta do Flui:\n${result.substring(0, 500)}...\n`);
	
	return { success, duration, error, result, toolsExecuted, filesCreated };
}

async function runTest() {
	try {
		setupTest();
		const result = await testComplexTask();
		process.exit(result.success ? 0 : 1);
	} catch (error) {
		console.error('\n❌ Erro:', error.message);
		process.exit(1);
	}
}

runTest();
