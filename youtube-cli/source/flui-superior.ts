/**
 * FLUI SUPERIOR - Ponto de Entrada Principal
 * 
 * Sistema AGI de excelência que integra:
 * ✅ Memória Perfeita (Context Manager V2)
 * ✅ Detecção Proativa de Erros
 * ✅ Modo Duplo (Assistant vs AGI)
 * ✅ Otimização de Output (Token Economy)
 * ✅ Auto-Validação
 * ✅ Coordenação Cirúrgica
 */

import { CentralOrchestratorV2 } from './agi/orchestrator-v2.js';
import { SelfValidationSystem } from './agi/self-validation.js';
import { loadQwenCredentials, getValidAccessToken } from './qwen-oauth.js';
import { getConfig } from './llm-config.js';
import OpenAI from 'openai';

export interface FluiSuperiorOptions {
	userPrompt: string;
	workDir?: string;
	onProgress?: (message: string, data?: any) => void;
	enableValidation?: boolean;
	validationReport?: boolean;
}

export interface FluiSuperiorResult {
	success: boolean;
	result: string;
	validationReport?: string;
	executionTime: number;
	mode: 'assistant' | 'agi';
}

/**
 * FLUI SUPERIOR - Interface Simplificada
 * 
 * Uso:
 * ```typescript
 * const result = await executeFluiSuperior({
 *   userPrompt: "Compare React vs Vue",
 *   workDir: process.cwd()
 * });
 * 
 * console.log(result.result);
 * ```
 */
export async function executeFluiSuperior(
	options: FluiSuperiorOptions
): Promise<FluiSuperiorResult> {
	const startTime = Date.now();
	const workDir = options.workDir || process.cwd();

	try {
		// Inicializar orquestrador V2
		const orchestrator = new CentralOrchestratorV2();

		options.onProgress?.('🚀 FLUI AGI SUPERIOR iniciando...');

		// Executar orquestração
		const orchestratorResult = await orchestrator.orchestrate(
			options.userPrompt,
			workDir,
			options.onProgress
		);

		const result = orchestratorResult.result;
		const detectedMode = orchestratorResult.mode;

		// Auto-validação (opcional)
		let validationReport: string | undefined;
		
		if (options.enableValidation) {
			options.onProgress?.('🔍 Executando auto-validação...');
			
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
			const validator = new SelfValidationSystem(openai);

			const validation = await validator.validateFinalResult(
				options.userPrompt,
				['Resposta completa e precisa'],
				result,
				[]
			);

			if (options.validationReport) {
				validationReport = validator.generateQualityReport(validation);
			}

			if (!validation.isValid) {
				options.onProgress?.(`⚠️ Validação: ${validation.qualityScore}/100 - Algumas melhorias sugeridas`);
			} else {
				options.onProgress?.(`✅ Validação: ${validation.qualityScore}/100 - Qualidade aprovada`);
			}
		}

		const executionTime = Date.now() - startTime;

		return {
			success: true,
			result,
			validationReport,
			executionTime,
			mode: detectedMode, // Detectado automaticamente pelo orchestrator
		};

	} catch (error) {
		const executionTime = Date.now() - startTime;
		const errorMsg = error instanceof Error ? error.message : String(error);

		return {
			success: false,
			result: `❌ Erro: ${errorMsg}`,
			executionTime,
			mode: 'agi',
		};
	}
}

/**
 * EXEMPLO DE USO - Para testes rápidos
 */
export async function testFluiSuperior() {
	console.log('🧪 Testando FLUI AGI SUPERIOR...\n');

	// Teste 1: Tarefa Simples (Modo Assistant)
	console.log('📝 Teste 1: Tarefa Simples');
	const result1 = await executeFluiSuperior({
		userPrompt: 'O que é inteligência artificial?',
		onProgress: (msg) => console.log(`  ${msg}`),
		enableValidation: true,
		validationReport: true,
	});
	
	console.log('\n✅ Resultado:');
	console.log(result1.result);
	console.log(`\n⏱️ Tempo: ${result1.executionTime}ms`);
	console.log(`🎯 Modo: ${result1.mode.toUpperCase()}`);
	
	if (result1.validationReport) {
		console.log('\n📊 Validação:');
		console.log(result1.validationReport);
	}

	console.log('\n' + '='.repeat(80) + '\n');

	// Teste 2: Tarefa Complexa (Modo AGI)
	console.log('📝 Teste 2: Tarefa Complexa');
	const result2 = await executeFluiSuperior({
		userPrompt: 'Compare React e Vue, depois crie um arquivo comparison.md com os resultados',
		onProgress: (msg) => console.log(`  ${msg}`),
		enableValidation: true,
	});
	
	console.log('\n✅ Resultado:');
	console.log(result2.result);
	console.log(`\n⏱️ Tempo: ${result2.executionTime}ms`);
	console.log(`🎯 Modo: ${result2.mode.toUpperCase()}`);

	console.log('\n🎉 Testes concluídos!');
}

// Exportar para uso em CLI
export default executeFluiSuperior;
