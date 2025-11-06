#!/usr/bin/env node

/**
 * Teste E2E de Validação Real - FLUI AGI Superior
 * 
 * Este teste valida o funcionamento completo do Flui através de uma
 * tarefa complexa que envolve múltiplas etapas:
 * 1. Criação de arquivo
 * 2. Execução de automação
 * 3. Entrega de resultado estruturado
 * 
 * O teste simula um cenário real de uso onde o sistema precisa:
 * - Analisar uma tarefa complexa
 * - Coordenar múltiplas ferramentas
 * - Gerar resultado final estruturado
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Importar módulos do Flui
const sourcePath = join(__dirname, 'source');
const { runAutonomousAgent } = await import(join(sourcePath, 'autonomous-agent.js'));
const { setConfig } = await import(join(sourcePath, 'llm-config.js'));
const { loadQwenCredentials } = await import(join(sourcePath, 'qwen-oauth.js'));

/**
 * Configura o ambiente de teste
 */
function setupTestEnvironment() {
	console.log('🔧 Configurando ambiente de teste...\n');
	
	// Carregar credenciais Qwen
	const qwenCreds = loadQwenCredentials();
	if (!qwenCreds || !qwenCreds.access_token) {
		throw new Error('❌ Credenciais Qwen não encontradas. Execute a autenticação primeiro.');
	}
	
	// Configurar LLM
	const resourceUrl = qwenCreds.resource_url || 'portal.qwen.ai';
	const endpoint = `https://${resourceUrl}/v1`;
	
	setConfig({
		endpoint,
		apiKey: qwenCreds.access_token,
		model: 'qwen3-coder-plus',
		maxVideos: 5,
		maxCommentsPerVideo: 10,
	});
	
	console.log('✅ Ambiente configurado');
	console.log(`   Endpoint: ${endpoint}`);
	console.log(`   Model: qwen3-coder-plus\n`);
}

/**
 * Executa tarefa complexa de validação
 */
async function executeComplexTask() {
	console.log('📋 Tarefa de Validação:');
	console.log('   "Crie um arquivo chamado resultado-teste.md com uma análise');
	console.log('    comparativa entre TypeScript e JavaScript, incluindo');
	console.log('    vantagens, desvantagens e casos de uso. Depois, leia o');
	console.log('    arquivo criado e confirme que foi criado corretamente."\n');
	
	const workDir = join(process.cwd(), 'work', `test-e2e-${Date.now()}`);
	mkdirSync(workDir, { recursive: true });
	
	console.log('🚀 Executando tarefa...\n');
	
	let kanbanTasks = [];
	let toolExecutions = [];
	let finalResult = '';
	
	try {
		const result = await runAutonomousAgent({
			userMessage: `Crie um arquivo chamado resultado-teste.md com uma análise comparativa entre TypeScript e JavaScript, incluindo vantagens, desvantagens e casos de uso. Depois, leia o arquivo criado e confirme que foi criado corretamente.`,
			workDir,
			onProgress: (message) => {
				console.log(`   📝 ${message}`);
			},
			onKanbanUpdate: (tasks) => {
				kanbanTasks = tasks;
				const todo = tasks.filter(t => t.status === 'todo').length;
				const inProgress = tasks.filter(t => t.status === 'in_progress').length;
				const done = tasks.filter(t => t.status === 'done').length;
				console.log(`\n   📊 Kanban: ${todo} pendentes | ${inProgress} em progresso | ${done} concluídas\n`);
			},
			onToolExecute: (toolName, args) => {
				toolExecutions.push({ name: toolName, args, startTime: Date.now() });
				console.log(`   🔧 Executando: ${toolName}`);
			},
			onToolComplete: (toolName, args, result, error) => {
				const execution = toolExecutions.find(e => e.name === toolName);
				if (execution) {
					execution.endTime = Date.now();
					execution.success = !error;
					execution.result = result?.substring(0, 100);
				}
				console.log(`   ${error ? '❌' : '✅'} ${toolName}: ${error ? 'Erro' : 'Sucesso'}`);
			},
		});
		
		finalResult = result;
		
	} catch (error) {
		console.error('\n❌ Erro durante execução:', error);
		throw error;
	}
	
	return {
		workDir,
		kanbanTasks,
		toolExecutions,
		finalResult,
	};
}

/**
 * Valida resultados do teste
 */
function validateResults(results) {
	console.log('\n🔍 Validando resultados...\n');
	
	const { workDir, kanbanTasks, toolExecutions, finalResult } = results;
	
	// Validação 1: Arquivo foi criado
	const expectedFile = join(workDir, 'resultado-teste.md');
	const fileExists = existsSync(expectedFile);
	
	console.log(`   ✅ Arquivo criado: ${fileExists ? 'SIM' : 'NÃO'}`);
	if (!fileExists) {
		throw new Error('❌ Arquivo resultado-teste.md não foi criado');
	}
	
	// Validação 2: Arquivo tem conteúdo válido
	const fileContent = readFileSync(expectedFile, 'utf-8');
	const hasTypeScript = fileContent.toLowerCase().includes('typescript');
	const hasJavaScript = fileContent.toLowerCase().includes('javascript');
	const hasComparison = fileContent.toLowerCase().includes('compar') || 
	                     fileContent.toLowerCase().includes('vantagem') ||
	                     fileContent.toLowerCase().includes('desvantagem');
	
	console.log(`   ✅ Conteúdo válido: ${hasTypeScript && hasJavaScript && hasComparison ? 'SIM' : 'NÃO'}`);
	if (!hasTypeScript || !hasJavaScript || !hasComparison) {
		throw new Error('❌ Arquivo não contém análise comparativa completa');
	}
	
	// Validação 3: Ferramentas foram executadas
	const writeFileExecuted = toolExecutions.some(e => e.name === 'write_file');
	const readFileExecuted = toolExecutions.some(e => e.name === 'read_file');
	
	console.log(`   ✅ write_file executado: ${writeFileExecuted ? 'SIM' : 'NÃO'}`);
	console.log(`   ✅ read_file executado: ${readFileExecuted ? 'SIM' : 'NÃO'}`);
	
	if (!writeFileExecuted || !readFileExecuted) {
		throw new Error('❌ Ferramentas necessárias não foram executadas');
	}
	
	// Validação 4: Kanban foi atualizado
	const hasKanbanTasks = kanbanTasks.length > 0;
	const allTasksDone = kanbanTasks.every(t => t.status === 'done');
	
	console.log(`   ✅ Kanban atualizado: ${hasKanbanTasks ? 'SIM' : 'NÃO'}`);
	console.log(`   ✅ Todas tarefas concluídas: ${allTasksDone ? 'SIM' : 'NÃO'}`);
	
	// Validação 5: Resultado final foi gerado
	const hasFinalResult = finalResult && finalResult.trim().length > 0;
	console.log(`   ✅ Resultado final gerado: ${hasFinalResult ? 'SIM' : 'NÃO'}`);
	
	if (!hasFinalResult) {
		throw new Error('❌ Resultado final não foi gerado');
	}
	
	return {
		fileExists,
		fileContent,
		toolExecutions: toolExecutions.length,
		kanbanTasks: kanbanTasks.length,
		allTasksDone,
	};
}

/**
 * Função principal do teste
 */
async function runE2ETest() {
	console.log('═══════════════════════════════════════════════════════════');
	console.log('🧪 TESTE E2E DE VALIDAÇÃO - FLUI AGI SUPERIOR');
	console.log('═══════════════════════════════════════════════════════════\n');
	
	try {
		// Setup
		setupTestEnvironment();
		
		// Executar tarefa
		const results = await executeComplexTask();
		
		// Validar resultados
		const validation = validateResults(results);
		
		// Relatório final
		console.log('\n═══════════════════════════════════════════════════════════');
		console.log('✅ TESTE CONCLUÍDO COM SUCESSO');
		console.log('═══════════════════════════════════════════════════════════\n');
		
		console.log('📊 Estatísticas:');
		console.log(`   • Arquivo criado: ${validation.fileExists}`);
		console.log(`   • Tamanho do arquivo: ${validation.fileContent.length} caracteres`);
		console.log(`   • Ferramentas executadas: ${validation.toolExecutions}`);
		console.log(`   • Tarefas Kanban: ${validation.kanbanTasks}`);
		console.log(`   • Todas tarefas concluídas: ${validation.allTasksDone}`);
		console.log(`   • Diretório de trabalho: ${results.workDir}\n`);
		
		console.log('🎉 O Flui está funcionando corretamente e pronto para uso!\n');
		
		process.exit(0);
		
	} catch (error) {
		console.error('\n═══════════════════════════════════════════════════════════');
		console.error('❌ TESTE FALHOU');
		console.error('═══════════════════════════════════════════════════════════\n');
		console.error('Erro:', error.message);
		console.error('\n');
		process.exit(1);
	}
}

// Executar teste
runE2ETest();
