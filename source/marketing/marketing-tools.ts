/**
 * MARKETING TOOL DEFINITIONS
 * Ferramentas específicas para criação de campanhas de marketing
 */

import { MarketingCampaignGenerator, CampaignBrief } from './campaign-generator.js';
import { CopyTemplatesLibrary } from './copy-templates.js';
import { MarketingQualityValidator } from './marketing-validator.js';
import OpenAI from 'openai';

export interface MarketingToolContext {
	openai: OpenAI;
	campaignGenerator: MarketingCampaignGenerator;
	copyTemplates: CopyTemplatesLibrary;
	validator: MarketingQualityValidator;
}

let marketingContext: MarketingToolContext | null = null;

export function initializeMarketingTools(openai: OpenAI): MarketingToolContext {
	if (!marketingContext) {
		const campaignGenerator = new MarketingCampaignGenerator(openai);
		const copyTemplates = new CopyTemplatesLibrary();
		const validator = new MarketingQualityValidator(openai);
		
		marketingContext = {
			openai,
			campaignGenerator,
			copyTemplates,
			validator
		};
	}
	return marketingContext;
}

export function getMarketingContext(): MarketingToolContext | null {
	return marketingContext;
}

/**
 * TOOL: generate_marketing_campaign
 * Gera campanha completa multi-formato
 */
export const generateMarketingCampaignTool = {
	type: 'function' as const,
	function: {
		name: 'generate_marketing_campaign',
		description: 'Gera uma campanha de marketing completa multi-formato (vídeo script, anúncio, landing page, e-mail, post social, e-book). Tudo sincronizado e coeso com narrativa unificada.',
		parameters: {
			type: 'object',
			properties: {
				product: {
					type: 'string',
					description: 'Nome do produto ou serviço'
				},
				targetAudience: {
					type: 'string',
					description: 'Descrição do público-alvo (persona)'
				},
				objective: {
					type: 'string',
					enum: ['awareness', 'conversion', 'engagement', 'education'],
					description: 'Objetivo da campanha'
				},
				tone: {
					type: 'string',
					enum: ['professional', 'casual', 'funny', 'inspirational', 'urgent'],
					description: 'Tom da campanha'
				},
				brandVoice: {
					type: 'string',
					description: 'Voz da marca (opcional)'
				},
				keyMessages: {
					type: 'array',
					items: { type: 'string' },
					description: 'Mensagens-chave da campanha'
				},
				cta: {
					type: 'string',
					description: 'Chamada para ação (opcional)'
				}
			},
			required: ['product', 'targetAudience', 'objective', 'tone', 'keyMessages']
		}
	}
};

/**
 * TOOL: get_copy_template
 * Obtém template de copy otimizado
 */
export const getCopyTemplateTool = {
	type: 'function' as const,
	function: {
		name: 'get_copy_template',
		description: 'Obtém um template de copy otimizado para conversão baseado em categoria e objetivo',
		parameters: {
			type: 'object',
			properties: {
				category: {
					type: 'string',
					enum: ['sales', 'engagement', 'education', 'awareness'],
					description: 'Categoria do template'
				},
				objective: {
					type: 'string',
					description: 'Objetivo específico'
				}
			},
			required: ['category', 'objective']
		}
	}
};

/**
 * TOOL: validate_marketing_content
 * Valida qualidade de conteúdo de marketing
 */
export const validateMarketingContentTool = {
	type: 'function' as const,
	function: {
		name: 'validate_marketing_content',
		description: 'Valida qualidade de conteúdo de marketing (copy, vídeo script, landing page) e retorna score e sugestões',
		parameters: {
			type: 'object',
			properties: {
				contentType: {
					type: 'string',
					enum: ['ad_copy', 'video_script', 'landing_page', 'email', 'campaign'],
					description: 'Tipo de conteúdo a validar'
				},
				content: {
					type: 'object',
					description: 'Conteúdo a ser validado (estrutura varia por tipo)'
				}
			},
			required: ['contentType', 'content']
		}
	}
};

/**
 * EXECUTAR FERRAMENTAS DE MARKETING
 */
export async function executeMarketingTool(
	toolName: string,
	args: any,
	workDir: string
): Promise<any> {
	const context = getMarketingContext();
	if (!context) {
		throw new Error('Marketing tools não inicializadas. Chame initializeMarketingTools primeiro.');
	}

	switch (toolName) {
		case 'generate_marketing_campaign': {
			const brief: CampaignBrief = {
				product: args.product,
				targetAudience: args.targetAudience,
				objective: args.objective,
				tone: args.tone,
				brandVoice: args.brandVoice,
				keyMessages: args.keyMessages,
				cta: args.cta
			};
			
			const campaign = await context.campaignGenerator.generateCampaign(brief, workDir);
			return {
				success: true,
				campaign,
				message: `Campanha "${campaign.campaignName}" gerada com sucesso! Score de coesão: ${campaign.cohesionScore}/100`
			};
		}

		case 'get_copy_template': {
			const template = context.copyTemplates.getTemplate(args.category, args.objective);
			if (!template) {
				return {
					success: false,
					message: `Template não encontrado para categoria "${args.category}" e objetivo "${args.objective}"`
				};
			}
			return {
				success: true,
				template,
				message: `Template "${template.name}" encontrado (CTR alvo: ${template.ctrTarget}%)`
			};
		}

		case 'validate_marketing_content': {
			let result;
			switch (args.contentType) {
				case 'ad_copy':
					result = await context.validator.validateAdCopy(args.content);
					break;
				case 'video_script':
					result = await context.validator.validateVideoScript(args.content);
					break;
				case 'landing_page':
					result = await context.validator.validateLandingPage(args.content);
					break;
				case 'campaign':
					result = await context.validator.validateCampaign(args.content);
					break;
				default:
					throw new Error(`Tipo de conteúdo não suportado: ${args.contentType}`);
			}

			return {
				success: true,
				validation: result,
				message: `Validação concluída. Score geral: ${result.overallScore}/100`
			};
		}

		default:
			throw new Error(`Ferramenta de marketing desconhecida: ${toolName}`);
	}
}
