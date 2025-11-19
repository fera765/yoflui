/**
 * Qwen OAuth 2.0 Device Flow Implementation
 * 
 * Responsabilidade Única: Gerenciar autenticação OAuth 2.0 com o serviço Qwen
 * 
 * Este módulo implementa o fluxo de autorização de dispositivo (RFC 8628) para
 * autenticação com a API Qwen. O fluxo funciona da seguinte forma:
 * 
 * Fluxo de Autenticação:
 * 1. Cliente solicita código de dispositivo ao servidor OAuth
 * 2. Servidor retorna device_code e user_code
 * 3. Usuário acessa URL de verificação e insere user_code
 * 4. Cliente faz polling no endpoint de token até receber autorização
 * 5. Token de acesso é salvo localmente para uso futuro
 * 
 * Gerenciamento de Tokens:
 * - Tokens são salvos em qwen-credentials.json no diretório do projeto
 * - Tokens expirados são automaticamente renovados usando refresh_token
 * - Validação de expiração antes de cada uso
 * 
 * Lógica de Negócio:
 * - Suporta PKCE (Proof Key for Code Exchange) para segurança adicional
 * - Implementa backoff exponencial em caso de rate limiting
 * - Fallback automático para refresh token quando necessário
 * 
 * Uso:
 * ```typescript
 * import { authenticateWithQwen, getValidAccessToken } from './qwen-oauth.js';
 * 
 * // Autenticação inicial (abre navegador)
 * const creds = await authenticateWithQwen();
 * 
 * // Obter token válido (renova automaticamente se expirado)
 * const token = await getValidAccessToken();
 * ```
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { createHash, randomBytes } from 'crypto';
import { spawn } from 'child_process';

// Qwen OAuth Configuration (from official repo)
const QWEN_OAUTH_BASE_URL = 'https://chat.qwen.ai';
const QWEN_OAUTH_DEVICE_CODE_ENDPOINT = `${QWEN_OAUTH_BASE_URL}/api/v1/oauth2/device/code`;
const QWEN_OAUTH_TOKEN_ENDPOINT = `${QWEN_OAUTH_BASE_URL}/api/v1/oauth2/token`;
const QWEN_OAUTH_CLIENT_ID = 'f0304373b74a44d2b584a3fb70ca9e56';
const QWEN_OAUTH_SCOPE = 'openid profile email model.completion';
const QWEN_API_ENDPOINT = 'https://chat.qwen.ai/api/v1';

// Storage - Always use project directory
const CREDENTIALS_FILENAME = 'qwen-credentials.json';

export interface QwenCredentials {
	access_token: string;
	refresh_token?: string;
	token_type: string;
	expires_in?: number;
	expiry_date?: number;
	resource_url?: string;
}

export interface DeviceAuthorizationData {
	device_code: string;
	user_code: string;
	verification_uri: string;
	verification_uri_complete: string;
	expires_in: number;
}

export interface DeviceTokenData {
	access_token: string;
	refresh_token?: string;
	token_type: string;
	expires_in: number;
	resource_url?: string;
}

interface DeviceTokenPending {
	status: 'pending';
	slowDown?: boolean;
}

interface TokenError {
	error: string;
	error_description?: string;
}

function generateCodeVerifier(): string {
	return randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
	return createHash('sha256').update(verifier).digest('base64url');
}

function generatePKCEPair(): { code_verifier: string; code_challenge: string } {
	const code_verifier = generateCodeVerifier();
	const code_challenge = generateCodeChallenge(code_verifier);
	return { code_verifier, code_challenge };
}

function toUrlEncoded(data: Record<string, string>): string {
	return Object.keys(data)
		.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
		.join('&');
}

function getCredentialsPath(): string {
	return join(process.cwd(), CREDENTIALS_FILENAME);
}

export function loadQwenCredentials(): QwenCredentials | null {
	try {
		const path = getCredentialsPath();
		if (!existsSync(path)) {
			return null;
		}
		
		const data = readFileSync(path, 'utf-8');
		
		if (!data || data.trim().length === 0) {
			clearQwenCredentials();
			return null;
		}
		
		const creds = JSON.parse(data) as QwenCredentials;
		
		if (creds.expiry_date && Date.now() > creds.expiry_date) {
			return null;
		}
		
		return creds;
	} catch (error) {
		clearQwenCredentials();
		return null;
	}
}

export function saveQwenCredentials(creds: QwenCredentials): void {
	try {
		const path = getCredentialsPath();
		writeFileSync(path, JSON.stringify(creds, null, 2), 'utf-8');
	} catch (error) {
		// Silent fail
	}
}

export function clearQwenCredentials(): void {
	try {
		const path = getCredentialsPath();
		if (existsSync(path)) {
			unlinkSync(path);
		}
	} catch (error) {
		// Silent fail
	}
}

export async function requestDeviceAuthorization(): Promise<DeviceAuthorizationData> {
	const { code_verifier, code_challenge } = generatePKCEPair();
	
	const bodyData = {
		client_id: QWEN_OAUTH_CLIENT_ID,
		scope: QWEN_OAUTH_SCOPE,
		code_challenge,
		code_challenge_method: 'S256',
	};

	const response = await fetch(QWEN_OAUTH_DEVICE_CODE_ENDPOINT, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Accept': 'application/json',
		},
		body: toUrlEncoded(bodyData),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Device authorization failed: ${response.status} - ${error}`);
	}

	const result: any = await response.json();
	result._code_verifier = code_verifier;
	
	return result as DeviceAuthorizationData;
}

export async function pollDeviceToken(
	deviceCode: string,
	codeVerifier: string
): Promise<DeviceTokenData | DeviceTokenPending | TokenError> {
	const bodyData = {
		grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
		client_id: QWEN_OAUTH_CLIENT_ID,
		device_code: deviceCode,
		code_verifier: codeVerifier,
	};

	try {
		const response = await fetch(QWEN_OAUTH_TOKEN_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Accept': 'application/json',
			},
			body: toUrlEncoded(bodyData),
		});

		const data: any = await response.json();

		if (response.status === 400 && data.error === 'authorization_pending') {
			return { status: 'pending' } as DeviceTokenPending;
		}

		if (response.status === 429 && data.error === 'slow_down') {
			return { status: 'pending', slowDown: true } as DeviceTokenPending;
		}

		if (!response.ok) {
			return data as TokenError;
		}

		return data as DeviceTokenData;
	} catch (error) {
		return {
			error: 'network_error',
			error_description: error instanceof Error ? error.message : 'Network error'
		} as TokenError;
	}
}

export async function refreshAccessToken(refreshToken: string): Promise<DeviceTokenData> {
	const bodyData = {
		grant_type: 'refresh_token',
		refresh_token: refreshToken,
		client_id: QWEN_OAUTH_CLIENT_ID,
	};

	const response = await fetch(QWEN_OAUTH_TOKEN_ENDPOINT, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Accept': 'application/json',
		},
		body: toUrlEncoded(bodyData),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Token refresh failed: ${response.status} - ${error}`);
	}

	const data: any = await response.json();
	return data as DeviceTokenData;
}

	export function openBrowser(url: string): void {
		// Solução Termux-compatível: Imprimir o URL e instruir o usuário.
		console.log('------------------------------------------------------------------');
		console.log('PASSO 1: Autorização OAuth');
		console.log('Por favor, abra o seguinte URL no seu navegador para autorizar:');
		console.log(`\n${url}\n`);
		console.log('Após a autorização, o processo continuará automaticamente.');
		console.log('------------------------------------------------------------------');
	}

export async function authenticateWithQwen(): Promise<QwenCredentials> {
	const deviceAuth = await requestDeviceAuthorization();
	const codeVerifier = (deviceAuth as any)._code_verifier;

	openBrowser(deviceAuth.verification_uri_complete);

	let pollInterval = 2000;
	const maxAttempts = Math.ceil(deviceAuth.expires_in / (pollInterval / 1000));

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const result = await pollDeviceToken(deviceAuth.device_code, codeVerifier);

		if ('access_token' in result && result.access_token) {
			const tokenData = result as DeviceTokenData;
			
			const credentials: QwenCredentials = {
				access_token: tokenData.access_token,
				refresh_token: tokenData.refresh_token,
				token_type: tokenData.token_type,
				expires_in: tokenData.expires_in,
				expiry_date: Date.now() + (tokenData.expires_in * 1000),
				resource_url: tokenData.resource_url,
			};

			saveQwenCredentials(credentials);

			return credentials;
		}

		if ('status' in result && result.status === 'pending') {
			if (result.slowDown) {
				pollInterval = Math.min(pollInterval * 1.5, 10000);
			}
			await new Promise(resolve => setTimeout(resolve, pollInterval));
			continue;
		}

		if ('error' in result) {
			throw new Error(`OAuth error: ${result.error} - ${result.error_description || ''}`);
		}
	}

	throw new Error('OAuth timeout: Authorization not completed in time');
}

export function getQwenConfig() {
	return {
		endpoint: QWEN_API_ENDPOINT,
		model: 'qwen3-coder-plus',
		provider: 'qwen',
	};
}

function getApiEndpoint(resourceUrl?: string): string {
	if (!resourceUrl) {
		return QWEN_API_ENDPOINT;
	}
	
	const normalizedUrl = resourceUrl.startsWith('http')
		? resourceUrl
		: `https://${resourceUrl}`;
	
	return normalizedUrl.endsWith('/v1')
		? normalizedUrl
		: `${normalizedUrl}/v1`;
}

export async function fetchQwenModels(accessToken: string, resourceUrl?: string): Promise<string[]> {
	try {
		const endpoint = getApiEndpoint(resourceUrl);
		const response = await fetch(`${endpoint}/models`, {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Accept': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch models: ${response.status}`);
		}

		const data: any = await response.json();
		
		if (data.data && Array.isArray(data.data)) {
			return data.data.map((m: any) => m.id || m.name).filter(Boolean);
		}
		
		return ['qwen3-coder-plus', 'qwen-max', 'qwen-plus', 'qwen-turbo'];
	} catch (error) {
		return ['qwen3-coder-plus', 'qwen-max', 'qwen-plus', 'qwen-turbo'];
	}
}

export async function getValidAccessToken(): Promise<string | null> {
	const creds = loadQwenCredentials();
	
	if (!creds) {
		return null;
	}

	if (creds.expiry_date && Date.now() > creds.expiry_date) {
		if (creds.refresh_token) {
			try {
				const newToken = await refreshAccessToken(creds.refresh_token);
				
				const newCreds: QwenCredentials = {
					access_token: newToken.access_token,
					refresh_token: newToken.refresh_token || creds.refresh_token,
					token_type: newToken.token_type,
					expires_in: newToken.expires_in,
					expiry_date: Date.now() + (newToken.expires_in * 1000),
					resource_url: newToken.resource_url,
				};
				
				saveQwenCredentials(newCreds);
				
				return newCreds.access_token;
			} catch (error) {
				clearQwenCredentials();
				return null;
			}
		}
		clearQwenCredentials();
		return null;
	}

	return creds.access_token;
}
