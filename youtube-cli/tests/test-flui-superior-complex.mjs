/**
 * TESTE FLUI SUPERIOR - TAREFAS COMPLEXAS
 * 
 * Objetivo: Verificar se o sistema atinge NOTA 10 em tarefas complexas
 * 
 * Execução: node tests/test-flui-superior-complex.mjs
 */

import { executeFluiSuperior } from '../source/flui-superior.ts';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('🧪 TESTE FLUI SUPERIOR - TAREFAS COMPLEXAS\n');
console.log('Objetivo: Nota 10 em tarefas complexas (modo AGI)\n');
console.log('='.repeat(80) + '\n');

const complexTests = [
	{
		id: 'COMPLEX-1',
		name: 'Pesquisa Multi-Etapa',
		prompt: 'Pesquise sobre AGI, resuma em 3 pontos principais, e salve em um arquivo agi-summary.md',
		expectedMode: 'agi',
		criteria: [
			'Deve decompor em sub-tarefas',
			'Usar ferramentas apropriadas',
			'Criar arquivo solicitado',
			'Manter contexto entre etapas',
			'Resultado final completo'
		],
		validation: () => {
			// Verificar se arquivo foi criado
			const filePath = join(process.cwd(), 'agi-summary.md');
			if (existsSync(filePath)) {
				const content = readFileSync(filePath, 'utf-8');
				return {
					success: true,
					message: 'Arquivo criado com sucesso',
					details: `Tamanho: ${content.length} chars`
				};
			}
			return {
				success: false,
				message: 'Arquivo não foi criado'
			};
		}
	},
	{
		id: 'COMPLEX-2',
		name: 'Coordenação Multi-Ferramenta',
		prompt: 'Liste os arquivos TypeScript no diretório source, depois crie um relatório em files-report.txt',
		expectedMode: 'agi',
		criteria: [
			'Usar find_files ou read_folder',
			'Processar resultados',
			'Criar arquivo de relatório',
			'Coordenação perfeita entre etapas',
			'Sem perda de contexto'
		],
		validation: () => {
			const filePath = join(process.cwd(), 'files-report.txt');
			if (existsSync(filePath)) {
				const content = readFileSync(filePath, 'utf-8');
				return {
					success: content.includes('.ts') || content.includes('TypeScript'),
					message: 'Arquivo criado e contém dados relevantes',
					details: `Tamanho: ${content.length} chars`
				};
			}
			return {
				success: false,
				message: 'Arquivo não foi criado ou está vazio'
			};
		}
	},
	{
		id: 'COMPLEX-3',
		name: 'Análise e Síntese',
		prompt: 'Compare as vantagens e desvantagens de React vs Vue, crie uma tabela, e salve em comparison-table.md',
		expectedMode: 'agi',
		criteria: [
			'Análise comparativa completa',
			'Formato de tabela estruturado',
			'Arquivo criado corretamente',
			'Síntese final coerente',
			'Token economy mantida'
		],
		validation: () => {
			const filePath = join(process.cwd(), 'comparison-table.md');
			if (existsSync(filePath)) {
				const content = readFileSync(filePath, 'utf-8');
				const hasTable = content.includes('|') || content.includes('React') && content.includes('Vue');
				return {
					success: hasTable,
					message: 'Arquivo criado com comparação estruturada',
					details: `Tamanho: ${content.length} chars`
				};
			}
			return {
				success: false,
				message: 'Arquivo não foi criado'
			};
		}
	}
];

let passedTests = 0;
let failedTests = 0;

for (const test of complexTests) {
	console.log(`📝 ${test.id}: ${test.name}`);
	console.log(`Prompt: "${test.prompt}"\n`);

	const startTime = Date.now();
	
	try {
		const result = await executeFluiSuperior({
			userPrompt: test.prompt,
			workDir: process.cwd(),
			onProgress: (msg) => {
				console.log(`  ${msg}`);
			},
			enableValidation: true,
			validationReport: true,
		});

		const executionTime = (Date.now() - startTime) / 1000;

		console.log('\n📊 Resultado:');
		console.log(result.result.substring(0, 500) + (result.result.length > 500 ? '...' : ''));
		console.log(`\n⏱️ Tempo: ${executionTime.toFixed(2)}s`);
		console.log(`🎯 Modo: ${result.mode.toUpperCase()}`);

		// Avaliação
		console.log('\n✅ Critérios de Avaliação:');
		let criteriaScore = 0;
		
		// 1. Modo AGI detectado
		if (result.mode === test.expectedMode) {
			console.log(`  ✅ Modo ${test.expectedMode} detectado corretamente`);
			criteriaScore += 20;
		} else {
			console.log(`  ❌ Modo incorreto: esperado ${test.expectedMode}, obtido ${result.mode}`);
		}

		// 2. Sucesso na execução
		if (result.success) {
			console.log(`  ✅ Execução bem-sucedida`);
			criteriaScore += 20;
		} else {
			console.log(`  ❌ Falha na execução`);
		}

		// 3. Validação customizada (arquivo criado, etc.)
		if (test.validation) {
			const validationResult = test.validation();
			if (validationResult.success) {
				console.log(`  ✅ ${validationResult.message}`);
				if (validationResult.details) {
					console.log(`     ${validationResult.details}`);
				}
				criteriaScore += 20;
			} else {
				console.log(`  ❌ ${validationResult.message}`);
			}
		} else {
			criteriaScore += 20; // Skip se não houver validação customizada
		}

		// 4. Resultado completo
		if (result.result.length > 100) {
			console.log(`  ✅ Resultado completo (${result.result.length} chars)`);
			criteriaScore += 20;
		} else {
			console.log(`  ⚠️ Resultado muito curto`);
			criteriaScore += 10;
		}

		// 5. Sem erros críticos
		if (!result.result.toLowerCase().includes('error:') && 
		    !result.result.toLowerCase().includes('failed')) {
			console.log(`  ✅ Sem erros críticos`);
			criteriaScore += 20;
		} else {
			console.log(`  ⚠️ Erros detectados no output`);
			criteriaScore += 5;
		}

		const grade = criteriaScore / 10; // Converter para nota 0-10
		console.log(`\n🎓 NOTA: ${grade.toFixed(1)}/10 ${grade >= 9 ? '🌟' : grade >= 7 ? '✅' : '⚠️'}`);

		if (result.validationReport) {
			console.log('\n📊 Relatório de Validação:');
			console.log(result.validationReport);
		}

		if (grade >= 8) {
			passedTests++;
			console.log(`\n✅ ${test.id} PASSOU\n`);
		} else {
			failedTests++;
			console.log(`\n❌ ${test.id} FALHOU (nota abaixo de 8)\n`);
		}

	} catch (error) {
		console.log(`\n❌ ERRO: ${error.message}`);
		console.log(error.stack);
		failedTests++;
	}

	console.log('='.repeat(80) + '\n');
}

// Resumo final
console.log('📊 RESUMO DOS TESTES COMPLEXOS\n');
console.log(`Total de testes: ${complexTests.length}`);
console.log(`✅ Passou: ${passedTests}`);
console.log(`❌ Falhou: ${failedTests}`);

const successRate = (passedTests / complexTests.length) * 100;
console.log(`\n📈 Taxa de Sucesso: ${successRate.toFixed(1)}%`);

if (successRate >= 90) {
	console.log('\n🌟 EXCELENTE! FLUI atingiu NOTA 10 em tarefas complexas!');
	console.log('Sistema AGI está operando com excelência superior.');
} else if (successRate >= 75) {
	console.log('\n✅ BOM! Sistema funcional mas com espaço para otimizações.');
} else {
	console.log('\n⚠️ REQUER REFINAMENTO para atingir padrão de excelência.');
}

console.log('\n🎯 Próximos passos:');
console.log('  1. Analisar logs de execução');
console.log('  2. Otimizar etapas que falharam');
console.log('  3. Ajustar prompts de sistema');
console.log('  4. Melhorar detecção de modo');

process.exit(failedTests > 0 ? 1 : 0);
