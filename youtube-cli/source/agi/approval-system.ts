/**
 * SISTEMA DE APROVAÇÕES GRANULARES - Inspirado no Cline
 * 
 * Permite controle total do usuário sobre ações do AGI:
 * - Aprovar/Rejeitar cada ação
 * - Configurar níveis de auto-aprovação
 * - Pausar/Resumir execução
 * - Override de decisões
 * 
 * Torna o Flui 10/10 em CONTROLE GRANULAR
 */

export type ApprovalLevel = 'manual' | 'auto_read' | 'auto_write' | 'auto_execute' | 'full_auto';

export interface ApprovalConfig {
	level: ApprovalLevel;
	autoApproveRead: boolean;
	autoApproveWrite: boolean;
	autoApproveExecute: boolean;
	autoApproveWebRequest: boolean;
	requireConfirmForDeletion: boolean;
	requireConfirmForSensitiveOps: boolean;
}

export interface ApprovalRequest {
	id: string;
	type: 'read' | 'write' | 'execute' | 'web_request' | 'deletion' | 'sensitive';
	tool: string;
	args: Record<string, any>;
	description: string;
	reasoning: string;
	impact: 'low' | 'medium' | 'high';
	timestamp: number;
	context?: string;
}

export interface ApprovalResponse {
	approved: boolean;
	reason?: string;
	modifications?: Record<string, any>; // Usuário pode modificar args
	skipFutureForThis?: boolean; // "Não perguntar novamente para esta ação"
}

export class ApprovalSystem {
	private config: ApprovalConfig;
	private pendingApprovals: Map<string, ApprovalRequest> = new Map();
	private approvalHistory: Array<{ request: ApprovalRequest; response: ApprovalResponse }> = [];
	private autoApprovePatterns: Map<string, RegExp[]> = new Map();
	private isPaused: boolean = false;
	private onApprovalNeeded?: (request: ApprovalRequest) => Promise<ApprovalResponse>;

	constructor(level: ApprovalLevel = 'manual') {
		this.config = this.getLevelConfig(level);
	}

	/**
	 * Configurar callback para quando aprovação for necessária
	 */
	setApprovalCallback(callback: (request: ApprovalRequest) => Promise<ApprovalResponse>) {
		this.onApprovalNeeded = callback;
	}

	/**
	 * Obter configuração para um nível de aprovação
	 */
	private getLevelConfig(level: ApprovalLevel): ApprovalConfig {
		switch (level) {
			case 'manual':
				return {
					level: 'manual',
					autoApproveRead: false,
					autoApproveWrite: false,
					autoApproveExecute: false,
					autoApproveWebRequest: false,
					requireConfirmForDeletion: true,
					requireConfirmForSensitiveOps: true,
				};
			case 'auto_read':
				return {
					level: 'auto_read',
					autoApproveRead: true,
					autoApproveWrite: false,
					autoApproveExecute: false,
					autoApproveWebRequest: false,
					requireConfirmForDeletion: true,
					requireConfirmForSensitiveOps: true,
				};
			case 'auto_write':
				return {
					level: 'auto_write',
					autoApproveRead: true,
					autoApproveWrite: true,
					autoApproveExecute: false,
					autoApproveWebRequest: true,
					requireConfirmForDeletion: true,
					requireConfirmForSensitiveOps: true,
				};
			case 'auto_execute':
				return {
					level: 'auto_execute',
					autoApproveRead: true,
					autoApproveWrite: true,
					autoApproveExecute: true,
					autoApproveWebRequest: true,
					requireConfirmForDeletion: true,
					requireConfirmForSensitiveOps: true,
				};
			case 'full_auto':
				return {
					level: 'full_auto',
					autoApproveRead: true,
					autoApproveWrite: true,
					autoApproveExecute: true,
					autoApproveWebRequest: true,
					requireConfirmForDeletion: false,
					requireConfirmForSensitiveOps: false,
				};
		}
	}

	/**
	 * Mudar nível de aprovação em runtime
	 */
	setApprovalLevel(level: ApprovalLevel) {
		this.config = this.getLevelConfig(level);
	}

	/**
	 * Configurar aprovações customizadas
	 */
	setCustomConfig(config: Partial<ApprovalConfig>) {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Adicionar padrão de auto-aprovação
	 * Ex: Auto-aprovar leitura de arquivos .md
	 */
	addAutoApprovePattern(type: string, pattern: RegExp) {
		if (!this.autoApprovePatterns.has(type)) {
			this.autoApprovePatterns.set(type, []);
		}
		this.autoApprovePatterns.get(type)!.push(pattern);
	}

	/**
	 * Verificar se ação deve ser auto-aprovada
	 */
	private shouldAutoApprove(request: ApprovalRequest): boolean {
		// Se pausado, nunca auto-aprovar
		if (this.isPaused) {
			return false;
		}

		// Verificar padrões de auto-aprovação customizados
		const patterns = this.autoApprovePatterns.get(request.type);
		if (patterns) {
			const description = `${request.tool} ${JSON.stringify(request.args)}`;
			if (patterns.some(pattern => pattern.test(description))) {
				return true;
			}
		}

		// Verificar configuração de nível
		switch (request.type) {
			case 'read':
				return this.config.autoApproveRead;
			case 'write':
				// Nunca auto-aprovar deleções
				if (request.impact === 'high' || request.tool.includes('delete')) {
					return false;
				}
				return this.config.autoApproveWrite;
			case 'execute':
				// Nunca auto-aprovar comandos perigosos
				const dangerousPatterns = [/rm\s+-rf/, /sudo/, /chmod/, /chown/, /mkfs/, /dd\s+if/];
				const command = JSON.stringify(request.args);
				if (dangerousPatterns.some(p => p.test(command))) {
					return false;
				}
				return this.config.autoApproveExecute;
			case 'web_request':
				return this.config.autoApproveWebRequest;
			case 'deletion':
				return !this.config.requireConfirmForDeletion;
			case 'sensitive':
				return !this.config.requireConfirmForSensitiveOps;
			default:
				return false;
		}
	}

	/**
	 * Solicitar aprovação para uma ação
	 */
	async requestApproval(request: ApprovalRequest): Promise<ApprovalResponse> {
		// Verificar auto-aprovação
		if (this.shouldAutoApprove(request)) {
			const response: ApprovalResponse = { approved: true, reason: 'Auto-aprovado' };
			this.approvalHistory.push({ request, response });
			return response;
		}

		// Adicionar à fila de pendentes
		this.pendingApprovals.set(request.id, request);

		// Aguardar resposta do usuário
		if (!this.onApprovalNeeded) {
			throw new Error('Callback de aprovação não configurado');
		}

		const response = await this.onApprovalNeeded(request);

		// Remover da fila
		this.pendingApprovals.delete(request.id);

		// Adicionar ao histórico
		this.approvalHistory.push({ request, response });

		// Se usuário pediu para skip futuros, adicionar padrão
		if (response.skipFutureForThis) {
			const pattern = new RegExp(`^${request.tool}$`);
			this.addAutoApprovePattern(request.type, pattern);
		}

		return response;
	}

	/**
	 * Criar uma requisição de aprovação
	 */
	createApprovalRequest(
		tool: string,
		args: Record<string, any>,
		description: string,
		reasoning: string
	): ApprovalRequest {
		// Determinar tipo baseado na tool
		let type: ApprovalRequest['type'] = 'sensitive';
		let impact: ApprovalRequest['impact'] = 'medium';

		if (tool.includes('read') || tool.includes('search') || tool.includes('find')) {
			type = 'read';
			impact = 'low';
		} else if (tool.includes('write') || tool.includes('edit') || tool.includes('create')) {
			type = 'write';
			impact = 'medium';
		} else if (tool.includes('execute') || tool.includes('shell') || tool.includes('run')) {
			type = 'execute';
			impact = 'high';
		} else if (tool.includes('delete') || tool.includes('remove')) {
			type = 'deletion';
			impact = 'high';
		} else if (tool.includes('web') || tool.includes('scrape') || tool.includes('http')) {
			type = 'web_request';
			impact = 'low';
		}

		// Ajustar impacto baseado em args
		if (args.recursive || args.force || args.all) {
			impact = 'high';
		}

		return {
			id: `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			type,
			tool,
			args,
			description,
			reasoning,
			impact,
			timestamp: Date.now(),
		};
	}

	/**
	 * Pausar execução (todas ações futuras requerem aprovação)
	 */
	pause() {
		this.isPaused = true;
	}

	/**
	 * Resumir execução
	 */
	resume() {
		this.isPaused = false;
	}

	/**
	 * Verificar se está pausado
	 */
	isPausedState(): boolean {
		return this.isPaused;
	}

	/**
	 * Obter aprovações pendentes
	 */
	getPendingApprovals(): ApprovalRequest[] {
		return Array.from(this.pendingApprovals.values());
	}

	/**
	 * Obter histórico de aprovações
	 */
	getApprovalHistory(): Array<{ request: ApprovalRequest; response: ApprovalResponse }> {
		return this.approvalHistory;
	}

	/**
	 * Limpar histórico
	 */
	clearHistory() {
		this.approvalHistory = [];
	}

	/**
	 * Obter estatísticas
	 */
	getStats() {
		const total = this.approvalHistory.length;
		const approved = this.approvalHistory.filter(h => h.response.approved).length;
		const rejected = total - approved;
		const autoApproved = this.approvalHistory.filter(
			h => h.response.approved && h.response.reason === 'Auto-aprovado'
		).length;

		const byType: Record<string, { approved: number; rejected: number }> = {};
		for (const { request, response } of this.approvalHistory) {
			if (!byType[request.type]) {
				byType[request.type] = { approved: 0, rejected: 0 };
			}
			if (response.approved) {
				byType[request.type].approved++;
			} else {
				byType[request.type].rejected++;
			}
		}

		return {
			total,
			approved,
			rejected,
			autoApproved,
			manuallyApproved: approved - autoApproved,
			byType,
			currentLevel: this.config.level,
			isPaused: this.isPaused,
		};
	}
}

/**
 * Instância global do sistema de aprovações
 */
let globalApprovalSystem: ApprovalSystem | null = null;

export function getApprovalSystem(level?: ApprovalLevel): ApprovalSystem {
	if (!globalApprovalSystem) {
		globalApprovalSystem = new ApprovalSystem(level || 'auto_write');
	}
	return globalApprovalSystem;
}

export function resetApprovalSystem() {
	globalApprovalSystem = null;
}
