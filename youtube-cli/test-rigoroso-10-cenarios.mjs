#!/usr/bin/env node
/**
 * 🎯 BATERIA DE TESTES RIGOROSA - VALIDAÇÃO NOTA 10/10
 * 
 * 10 Cenários (5 Simples + 5 Complexos) para garantir EXCELÊNCIA TOTAL
 */

import { executeFluiSuperior } from './dist/flui-superior.js';
import { existsSync, readFileSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';

// Cores para output
const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
};

const progressLogs = [];

function progress(msg) {
	progressLogs.push(msg);
}

function testHeader(num, title, complexity) {
	const emoji = complexity === 'simples' ? '⚡' : '🔥';
	console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
	console.log(`${emoji} TESTE #${num}: ${title}`);
	console.log(`${colors.yellow}Complexidade: ${complexity.toUpperCase()}${colors.reset}`);
	console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);
}

function testResult(passed, details, expected, actual) {
	if (passed) {
		console.log(`${colors.green}✅ PASSOU${colors.reset}`);
	} else {
		console.log(`${colors.red}❌ FALHOU${colors.reset}`);
		console.log(`${colors.yellow}Esperado: ${expected}${colors.reset}`);
		console.log(`${colors.red}Obtido: ${actual}${colors.reset}`);
	}
	if (details) console.log(`   ${colors.blue}${details}${colors.reset}`);
}

// ═════════════════════════════════════════════════════════════════
// TESTES SIMPLES (5)
// ═════════════════════════════════════════════════════════════════

async function test1_PerguntaMatematica() {
	testHeader(1, "Pergunta Matemática Simples", "simples");
	
	progressLogs.length = 0;
	const result = await executeFluiSuperior({
		userPrompt: "Quanto é 15 + 27?",
		onProgress: progress,
	});
	
	const passou = result.success && 
		result.mode === 'assistant' && 
		result.executionTime < 5000 && // < 5s
		result.result.includes('42');
	
	testResult(
		passou,
		`Mode: ${result.mode} | Tempo: ${(result.executionTime/1000).toFixed(1)}s`,
		"mode=assistant, resposta=42, tempo<5s",
		`mode=${result.mode}, resposta=${result.result.substring(0,50)}, tempo=${(result.executionTime/1000).toFixed(1)}s`
	);
	
	return passou;
}

async function test2_ExplicacaoConceito() {
	testHeader(2, "Explicação de Conceito", "simples");
	
	progressLogs.length = 0;
	const result = await executeFluiSuperior({
		userPrompt: "O que é recursão em programação?",
		onProgress: progress,
	});
	
	const passou = result.success && 
		result.mode === 'assistant' && 
		result.executionTime < 5000 &&
		result.result.length > 100; // Resposta completa
	
	testResult(
		passou,
		`Mode: ${result.mode} | Tempo: ${(result.executionTime/1000).toFixed(1)}s | Tamanho: ${result.result.length} chars`,
		"mode=assistant, resposta completa, tempo<5s",
		`mode=${result.mode}, tamanho=${result.result.length}`
	);
	
	return passou;
}

async function test3_ComparacaoSimples() {
	testHeader(3, "Comparação (sem ferramentas)", "simples");
	
	progressLogs.length = 0;
	const result = await executeFluiSuperior({
		userPrompt: "Qual a diferença entre let e const em JavaScript?",
		onProgress: progress,
	});
	
	const passou = result.success && 
		result.mode === 'assistant' && 
		(result.result.includes('let') && result.result.includes('const'));
	
	testResult(
		passou,
		`Mode: ${result.mode}`,
		"mode=assistant, menciona let e const",
		`mode=${result.mode}, let=${result.result.includes('let')}, const=${result.result.includes('const')}`
	);
	
	return passou;
}

async function test4_PerguntaFactual() {
	testHeader(4, "Pergunta Factual", "simples");
	
	progressLogs.length = 0;
	const result = await executeFluiSuperior({
		userPrompt: "Quantos planetas tem no sistema solar?",
		onProgress: progress,
	});
	
	const passou = result.success && 
		result.mode === 'assistant' && 
		(result.result.includes('8') || result.result.includes('oito'));
	
	testResult(
		passou,
		`Mode: ${result.mode}`,
		"mode=assistant, resposta=8",
		`mode=${result.mode}, resposta=${result.result.substring(0,50)}`
	);
	
	return passou;
}

async function test5_CalculoSimples() {
	testHeader(5, "Cálculo Simples", "simples");
	
	progressLogs.length = 0;
	const result = await executeFluiSuperior({
		userPrompt: "Se eu tenho 100 reais e gasto 35%, quanto sobra?",
		onProgress: progress,
	});
	
	const passou = result.success && 
		result.mode === 'assistant' && 
		(result.result.includes('65') || result.result.includes('sessenta e cinco'));
	
	testResult(
		passou,
		`Mode: ${result.mode}`,
		"mode=assistant, resposta=65",
		`mode=${result.mode}, resposta=${result.result.substring(0,80)}`
	);
	
	return passou;
}

// ═════════════════════════════════════════════════════════════════
// TESTES COMPLEXOS (5)
// ═════════════════════════════════════════════════════════════════

async function test6_CriarArquivo() {
	testHeader(6, "Criar Arquivo (Tool Use)", "complexa");
	
	const filename = `test-rigoroso-${Date.now()}.txt`;
	const content = `TESTE_RIGOROSO_${Date.now()}`;
	
	// Limpar arquivo se existe
	if (existsSync(filename)) unlinkSync(filename);
	
	progressLogs.length = 0;
	const result = await executeFluiSuperior({
		userPrompt: `Crie um arquivo chamado ${filename} contendo o texto: ${content}`,
		onProgress: progress,
	});
	
	const arquivoExiste = existsSync(filename);
	const conteudoCorreto = arquivoExiste && readFileSync(filename, 'utf-8').includes(content);
	
	const passou = result.success && 
		result.mode === 'agi' && 
		arquivoExiste && 
		conteudoCorreto;
	
	testResult(
		passou,
		`Mode: ${result.mode} | Arquivo: ${arquivoExiste ? '✓' : '✗'} | Conteúdo: ${conteudoCorreto ? '✓' : '✗'}`,
		"mode=agi, arquivo criado, conteúdo correto",
		`mode=${result.mode}, arquivo=${arquivoExiste}, conteúdo=${conteudoCorreto}`
	);
	
	// Limpar
	if (arquivoExiste) unlinkSync(filename);
	
	return passou;
}

async function test7_ListarArquivos() {
	testHeader(7, "Listar Arquivos (Tool Use)", "complexa");
	
	progressLogs.length = 0;
	const result = await executeFluiSuperior({
		userPrompt: "Liste quantos arquivos .json existem aqui",
		onProgress: progress,
	});
	
	// Verificar quantos .json realmente existem
	const files = readdirSync('.');
	const jsonFiles = files.filter(f => f.endsWith('.json'));
	const quantidade = jsonFiles.length;
	
	const passou = result.success && 
		result.mode === 'agi' && 
		result.result.includes(quantidade.toString());
	
	testResult(
		passou,
		`Mode: ${result.mode} | Quantidade real: ${quantidade}`,
		`mode=agi, menciona ${quantidade} arquivos`,
		`mode=${result.mode}, resultado=${result.result.substring(0,100)}`
	);
	
	return passou;
}

async function test8_MultiEtapa_CriarELer() {
	testHeader(8, "Multi-Etapa: Criar + Ler Arquivo", "complexa");
	
	const filename = `test-multipart-${Date.now()}.txt`;
	const content = `MULTI_ETAPA_${Date.now()}`;
	
	// Limpar
	if (existsSync(filename)) unlinkSync(filename);
	
	progressLogs.length = 0;
	const result = await executeFluiSuperior({
		userPrompt: `Primeiro crie um arquivo chamado ${filename} com o texto "${content}". Depois leia esse arquivo e me confirme o conteúdo.`,
		onProgress: progress,
	});
	
	const arquivoExiste = existsSync(filename);
	const conteudoCorreto = arquivoExiste && readFileSync(filename, 'utf-8').includes(content);
	const resultadoMencionaConteudo = result.result.includes(content);
	
	const passou = result.success && 
		result.mode === 'agi' && 
		arquivoExiste && 
		conteudoCorreto &&
		resultadoMencionaConteudo;
	
	testResult(
		passou,
		`Mode: ${result.mode} | Criado: ${arquivoExiste ? '✓' : '✗'} | Lido: ${resultadoMencionaConteudo ? '✓' : '✗'}`,
		"mode=agi, arquivo criado, conteúdo lido e confirmado",
		`mode=${result.mode}, criado=${arquivoExiste}, mencionado=${resultadoMencionaConteudo}`
	);
	
	// Limpar
	if (arquivoExiste) unlinkSync(filename);
	
	return passou;
}

async function test9_AnaliseDados() {
	testHeader(9, "Análise de Dados (package.json)", "complexa");
	
	progressLogs.length = 0;
	const result = await executeFluiSuperior({
		userPrompt: "Leia o package.json e me diga quantas dependências de produção existem",
		onProgress: progress,
	});
	
	// Contar deps reais
	const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
	const depCount = Object.keys(pkg.dependencies || {}).length;
	
	const passou = result.success && 
		result.mode === 'agi' && 
		result.result.includes(depCount.toString());
	
	testResult(
		passou,
		`Mode: ${result.mode} | Deps reais: ${depCount}`,
		`mode=agi, menciona ${depCount} dependências`,
		`mode=${result.mode}, resultado=${result.result.substring(0,150)}`
	);
	
	return passou;
}

async function test10_CriarMultiplosArquivos() {
	testHeader(10, "Multi-Recurso: Criar 3 Arquivos", "complexa");
	
	const files = [
		{ name: `test-a-${Date.now()}.txt`, content: 'FILE_A' },
		{ name: `test-b-${Date.now()}.txt`, content: 'FILE_B' },
		{ name: `test-c-${Date.now()}.txt`, content: 'FILE_C' },
	];
	
	// Limpar
	files.forEach(f => {
		if (existsSync(f.name)) unlinkSync(f.name);
	});
	
	progressLogs.length = 0;
	const result = await executeFluiSuperior({
		userPrompt: `Crie 3 arquivos: ${files[0].name} contendo "${files[0].content}", ${files[1].name} contendo "${files[1].content}", e ${files[2].name} contendo "${files[2].content}"`,
		onProgress: progress,
	});
	
	const todosExistem = files.every(f => existsSync(f.name));
	const todosCorretos = files.every(f => {
		if (!existsSync(f.name)) return false;
		return readFileSync(f.name, 'utf-8').includes(f.content);
	});
	
	const passou = result.success && 
		result.mode === 'agi' && 
		todosExistem && 
		todosCorretos;
	
	testResult(
		passou,
		`Mode: ${result.mode} | Criados: ${todosExistem ? '3/3 ✓' : '✗'} | Corretos: ${todosCorretos ? '✓' : '✗'}`,
		"mode=agi, 3 arquivos criados com conteúdo correto",
		`mode=${result.mode}, criados=${todosExistem}, corretos=${todosCorretos}`
	);
	
	// Limpar
	files.forEach(f => {
		if (existsSync(f.name)) unlinkSync(f.name);
	});
	
	return passou;
}

// ═════════════════════════════════════════════════════════════════
// EXECUTOR PRINCIPAL
// ═════════════════════════════════════════════════════════════════

async function main() {
	console.log(`${colors.magenta}
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   🎯 BATERIA DE TESTES RIGOROSA - VALIDAÇÃO NOTA 10/10           ║
║                                                                   ║
║   10 Cenários para garantir EXCELÊNCIA TOTAL                     ║
║   5 Simples + 5 Complexas                                        ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

	const results = {
		simples: [],
		complexas: [],
	};
	
	console.log(`${colors.cyan}▶ INICIANDO TESTES SIMPLES (1-5)...${colors.reset}\n`);
	
	try {
		results.simples.push(await test1_PerguntaMatematica());
		results.simples.push(await test2_ExplicacaoConceito());
		results.simples.push(await test3_ComparacaoSimples());
		results.simples.push(await test4_PerguntaFactual());
		results.simples.push(await test5_CalculoSimples());
	} catch (error) {
		console.error(`${colors.red}Erro nos testes simples: ${error.message}${colors.reset}`);
	}
	
	console.log(`\n${colors.cyan}▶ INICIANDO TESTES COMPLEXOS (6-10)...${colors.reset}\n`);
	
	try {
		results.complexas.push(await test6_CriarArquivo());
		results.complexas.push(await test7_ListarArquivos());
		results.complexas.push(await test8_MultiEtapa_CriarELer());
		results.complexas.push(await test9_AnaliseDados());
		results.complexas.push(await test10_CriarMultiplosArquivos());
	} catch (error) {
		console.error(`${colors.red}Erro nos testes complexos: ${error.message}${colors.reset}`);
	}
	
	// RELATÓRIO FINAL
	console.log(`\n${colors.magenta}═══════════════════════════════════════════════════════════${colors.reset}`);
	console.log(`${colors.magenta}📊 RELATÓRIO FINAL${colors.reset}`);
	console.log(`${colors.magenta}═══════════════════════════════════════════════════════════${colors.reset}\n`);
	
	const simplesPassaram = results.simples.filter(r => r).length;
	const complexasPassaram = results.complexas.filter(r => r).length;
	const total = simplesPassaram + complexasPassaram;
	const percentage = ((total / 10) * 100).toFixed(1);
	
	console.log(`${colors.cyan}TESTES SIMPLES:${colors.reset}`);
	console.log(`  ✅ Passou: ${simplesPassaram}/5 (${((simplesPassaram/5)*100).toFixed(1)}%)`);
	console.log(`  ❌ Falhou: ${5-simplesPassaram}/5\n`);
	
	console.log(`${colors.cyan}TESTES COMPLEXOS:${colors.reset}`);
	console.log(`  ✅ Passou: ${complexasPassaram}/5 (${((complexasPassaram/5)*100).toFixed(1)}%)`);
	console.log(`  ❌ Falhou: ${5-complexasPassaram}/5\n`);
	
	console.log(`${colors.magenta}═══════════════════════════════════════════════════════════${colors.reset}`);
	console.log(`${colors.cyan}TOTAL GERAL:${colors.reset}`);
	console.log(`  ✅ Passou: ${total}/10`);
	console.log(`  ❌ Falhou: ${10-total}/10`);
	console.log(`  🎯 Taxa de Sucesso: ${percentage}%`);
	console.log(`${colors.magenta}═══════════════════════════════════════════════════════════${colors.reset}\n`);
	
	// AVALIAÇÃO FINAL
	if (percentage >= 95) {
		console.log(`${colors.green}🌟 EXCELENTE! Nota 10/10 - Sistema PRONTO PARA PRODUÇÃO!${colors.reset}`);
	} else if (percentage >= 90) {
		console.log(`${colors.green}✅ MUITO BOM! Nota 9/10 - Quase perfeito!${colors.reset}`);
	} else if (percentage >= 80) {
		console.log(`${colors.yellow}⚠️ BOM! Nota 8/10 - Precisa ajustes menores${colors.reset}`);
	} else {
		console.log(`${colors.red}❌ INSUFICIENTE! Nota < 8/10 - Requer refinamento crítico${colors.reset}`);
	}
	
	console.log();
	
	process.exit(percentage >= 90 ? 0 : 1);
}

main().catch(error => {
	console.error(`${colors.red}❌ Erro fatal: ${error.message}${colors.reset}`);
	process.exit(1);
});
