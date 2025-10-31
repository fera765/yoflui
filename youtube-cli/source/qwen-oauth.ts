/**
 * Qwen OAuth 2.0 Device Flow Implementation
 * Based on official Qwen Code implementation
 * Uses Device Authorization Grant (RFC 8628)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { createHash, randomBytes } from 'crypto';
import { spawn } from 'child_process';

// Qwen OAuth Configuration (from official repo)
const QWEN_OAUTH_BASE_URL = 'https://chat.qwen.ai';
const QWEN_OAUTH_DEVICE_CODE_ENDPOINT = `${QWEN_OAUTH_BASE_URL}/api/v1/oauth2/device/code`;
const QWEN_OAUTH_TOKEN_ENDPOINT = `${QWEN_OAUTH_BASE_URL}/api/v1/oauth2/token`;
const QWEN_OAUTH_CLIENT_ID = 'f0304373b74a44d2b584a3fb70ca9e56'; // Hardcoded from official repo
const QWEN_OAUTH_SCOPE = 'openid profile email model.completion';
const QWEN_API_ENDPOINT = 'https://chat.qwen.ai/api/v1';

// Storage
const QWEN_DIR = '.qwen-youtube-analyst';
const QWEN_CREDENTIAL_FILENAME = 'oauth_creds.json';

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

/**
 * Generate PKCE code verifier (RFC 7636)
 */
function generateCodeVerifier(): string {
	return randomBytes(32).toString('base64url');
}

/**
 * Generate PKCE code challenge from verifier
 */
function generateCodeChallenge(verifier: string): string {
	return createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Generate PKCE pair
 */
function generatePKCEPair(): { code_verifier: string; code_challenge: string } {
	const code_verifier = generateCodeVerifier();
	const code_challenge = generateCodeChallenge(code_verifier);
	return { code_verifier, code_challenge };
}

/**
 * Convert object to URL-encoded form data
 */
function toUrlEncoded(data: Record<string, string>): string {
	return Object.keys(data)
		.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
		.join('&');
}

/**
 * Get credentials file path
 */
function getCredentialsPath(): string {
	return join(homedir(), QWEN_DIR, QWEN_CREDENTIAL_FILENAME);
}

/**
 * Load saved credentials
 */
export function loadQwenCredentials(): QwenCredentials | null {
	try {
		// First, try to load from local directory (for testing/dev)
		const localPath = join(process.cwd(), 'qwen-credentials.json');
		if (existsSync(localPath)) {
			const data = readFileSync(localPath, 'utf-8');
			const creds = JSON.parse(data) as QwenCredentials;
			
			// Check if token is expired
			if (creds.expiry_date && Date.now() > creds.expiry_date) {
				console.log('??  Token expired, needs refresh or re-auth');
				return null;
			}
			
			return creds;
		}
		
		// Then try the default location
		const path = getCredentialsPath();
		if (!existsSync(path)) {
			return null;
		}
		const data = readFileSync(path, 'utf-8');
		const creds = JSON.parse(data) as QwenCredentials;
		
		// Check if token is expired
		if (creds.expiry_date && Date.now() > creds.expiry_date) {
			console.log('??  Token expired, needs refresh or re-auth');
			return null;
		}
		
		return creds;
	} catch (error) {
		console.error('Error loading credentials:', error);
		return null;
	}
}

/**
 * Save credentials to disk
 */
export function saveQwenCredentials(creds: QwenCredentials): void {
	try {
		const dir = join(homedir(), QWEN_DIR);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		
		const path = getCredentialsPath();
		writeFileSync(path, JSON.stringify(creds, null, 2), 'utf-8');
		console.log('? Credentials saved successfully');
	} catch (error) {
		console.error('Error saving credentials:', error);
	}
}

/**
 * Clear saved credentials
 */
export function clearQwenCredentials(): void {
	try {
		const path = getCredentialsPath();
		if (existsSync(path)) {
			writeFileSync(path, '', 'utf-8');
			console.log('???  Credentials cleared');
		}
	} catch (error) {
		console.error('Error clearing credentials:', error);
	}
}

/**
 * Request device authorization
 */
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
	
	// Store code_verifier for later use
	result._code_verifier = code_verifier;
	
	return result as DeviceAuthorizationData;
}

/**
 * Poll for device token
 */
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

		// Handle pending authorization
		if (response.status === 400 && data.error === 'authorization_pending') {
			return { status: 'pending' } as DeviceTokenPending;
		}

		// Handle slow down request
		if (response.status === 429 && data.error === 'slow_down') {
			return { status: 'pending', slowDown: true } as DeviceTokenPending;
		}

		// Handle errors
		if (!response.ok) {
			return data as TokenError;
		}

		// Success
		return data as DeviceTokenData;
	} catch (error) {
		return {
			error: 'network_error',
			error_description: error instanceof Error ? error.message : 'Network error'
		} as TokenError;
	}
}

/**
 * Refresh access token
 */
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

/**
 * Open URL in browser
 */
export function openBrowser(url: string): void {
	const platform = process.platform;
	let command: string;

	if (platform === 'darwin') {
		command = 'open';
	} else if (platform === 'win32') {
		command = 'start';
	} else {
		command = 'xdg-open';
	}

	try {
		spawn(command, [url], { detached: true, stdio: 'ignore' }).unref();
	} catch (error) {
		console.error('Failed to open browser:', error);
	}
}

/**
 * Complete OAuth flow
 */
export async function authenticateWithQwen(): Promise<QwenCredentials> {
	console.log('\n?? Starting Qwen OAuth Device Flow...\n');

	// Request device authorization
	const deviceAuth = await requestDeviceAuthorization();
	const codeVerifier = (deviceAuth as any)._code_verifier;

	console.log('?? Please authorize this application:\n');
	console.log(`   ${deviceAuth.verification_uri_complete}\n`);
	console.log('?? Opening browser automatically...\n');

	// Open browser
	openBrowser(deviceAuth.verification_uri_complete);

	console.log('? Waiting for authorization...');
	console.log('   (Complete the authorization in your browser)\n');

	// Poll for token
	let pollInterval = 2000; // 2 seconds
	const maxAttempts = Math.ceil(deviceAuth.expires_in / (pollInterval / 1000));

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const result = await pollDeviceToken(deviceAuth.device_code, codeVerifier);

		// Check if token received
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

			// Save credentials
			saveQwenCredentials(credentials);

			console.log('? Authentication successful!');
			console.log(`   Token expires in: ${Math.floor(tokenData.expires_in / 60)} minutes\n`);

			return credentials;
		}

		// Handle pending
		if ('status' in result && result.status === 'pending') {
			if (result.slowDown) {
				pollInterval = Math.min(pollInterval * 1.5, 10000);
				console.log(`??  Slowing down polling (${pollInterval}ms)...`);
			}
			await new Promise(resolve => setTimeout(resolve, pollInterval));
			continue;
		}

		// Handle errors
		if ('error' in result) {
			throw new Error(`OAuth error: ${result.error} - ${result.error_description || ''}`);
		}
	}

	throw new Error('OAuth timeout: Authorization not completed in time');
}

/**
 * Get Qwen configuration for LLM
 */
export function getQwenConfig() {
	return {
		endpoint: QWEN_API_ENDPOINT,
		model: 'qwen3-coder-plus',
		provider: 'qwen',
	};
}

/**
 * Get proper API endpoint from resource_url
 */
function getApiEndpoint(resourceUrl?: string): string {
	if (!resourceUrl) {
		return QWEN_API_ENDPOINT;
	}
	
	// Normalize URL: add protocol if missing, ensure /v1 suffix
	const normalizedUrl = resourceUrl.startsWith('http')
		? resourceUrl
		: `https://${resourceUrl}`;
	
	return normalizedUrl.endsWith('/v1')
		? normalizedUrl
		: `${normalizedUrl}/v1`;
}

/**
 * Fetch available Qwen models
 */
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
		
		// Parse models from response
		if (data.data && Array.isArray(data.data)) {
			return data.data.map((m: any) => m.id || m.name).filter(Boolean);
		}
		
		// Fallback models (from official Qwen Code)
		return ['qwen3-coder-plus', 'qwen-max', 'qwen-plus', 'qwen-turbo'];
	} catch (error) {
		console.error('Failed to fetch Qwen models:', error);
		// Return default models (from official Qwen Code)
		return ['qwen3-coder-plus', 'qwen-max', 'qwen-plus', 'qwen-turbo'];
	}
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(): Promise<string | null> {
	const creds = loadQwenCredentials();
	
	if (!creds) {
		return null;
	}

	// Check if expired
	if (creds.expiry_date && Date.now() > creds.expiry_date) {
		// Try to refresh
		if (creds.refresh_token) {
			try {
				console.log('?? Refreshing access token...');
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
				console.log('? Token refreshed successfully');
				
				return newCreds.access_token;
			} catch (error) {
				console.error('Failed to refresh token:', error);
				clearQwenCredentials();
				return null;
			}
		}
		clearQwenCredentials();
		return null;
	}

	return creds.access_token;
}
