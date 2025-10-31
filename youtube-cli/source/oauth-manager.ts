/**
 * OAuth Manager for Qwen and other providers
 * Handles OAuth flow, token storage, and refresh
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import OpenAI from 'openai';

export interface OAuthTokens {
	accessToken: string;
	refreshToken?: string;
	expiresAt?: number;
	provider: 'qwen' | 'custom';
}

export interface OAuthConfig {
	provider: 'qwen' | 'custom';
	clientId?: string;
	clientSecret?: string;
	redirectUri?: string;
	authUrl?: string;
	tokenUrl?: string;
	apiEndpoint?: string;
	model?: string;
}

const TOKENS_FILE = join(process.cwd(), '.oauth-tokens.json');

// Qwen OAuth Configuration
const QWEN_CONFIG = {
	authUrl: 'https://oauth.aliyun.com/v2/oauth/authorize',
	tokenUrl: 'https://oauth.aliyun.com/v2/oauth/token',
	apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
	redirectUri: 'http://localhost:3456/callback',
	scopes: ['dashscope:read', 'dashscope:write'],
	model: 'qwen-max',
};

/**
 * Load saved tokens from disk
 */
export function loadTokens(): OAuthTokens | null {
	try {
		if (!existsSync(TOKENS_FILE)) {
			return null;
		}
		const data = readFileSync(TOKENS_FILE, 'utf-8');
		const tokens = JSON.parse(data) as OAuthTokens;
		
		// Check if token is expired
		if (tokens.expiresAt && Date.now() > tokens.expiresAt) {
			console.log('?? Token expired, needs refresh...');
			return null;
		}
		
		return tokens;
	} catch (error) {
		console.error('Error loading tokens:', error);
		return null;
	}
}

/**
 * Save tokens to disk
 */
export function saveTokens(tokens: OAuthTokens): void {
	try {
		writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
		console.log('? Tokens saved successfully');
	} catch (error) {
		console.error('Error saving tokens:', error);
	}
}

/**
 * Clear saved tokens
 */
export function clearTokens(): void {
	try {
		if (existsSync(TOKENS_FILE)) {
			writeFileSync(TOKENS_FILE, '', 'utf-8');
			console.log('???  Tokens cleared');
		}
	} catch (error) {
		console.error('Error clearing tokens:', error);
	}
}

/**
 * Generate Qwen OAuth authorization URL
 */
export function generateQwenAuthUrl(clientId: string): string {
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: QWEN_CONFIG.redirectUri,
		response_type: 'code',
		scope: QWEN_CONFIG.scopes.join(' '),
		state: Math.random().toString(36).substring(7),
	});

	return `${QWEN_CONFIG.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
	code: string,
	clientId: string,
	clientSecret: string
): Promise<OAuthTokens> {
	const params = new URLSearchParams({
		grant_type: 'authorization_code',
		code,
		client_id: clientId,
		client_secret: clientSecret,
		redirect_uri: QWEN_CONFIG.redirectUri,
	});

	const response = await fetch(QWEN_CONFIG.tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: params.toString(),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to exchange code: ${error}`);
	}

	const data: any = await response.json();

	const tokens: OAuthTokens = {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresAt: Date.now() + (data.expires_in * 1000),
		provider: 'qwen',
	};

	saveTokens(tokens);
	return tokens;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
	refreshToken: string,
	clientId: string,
	clientSecret: string
): Promise<OAuthTokens> {
	const params = new URLSearchParams({
		grant_type: 'refresh_token',
		refresh_token: refreshToken,
		client_id: clientId,
		client_secret: clientSecret,
	});

	const response = await fetch(QWEN_CONFIG.tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: params.toString(),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to refresh token: ${error}`);
	}

	const data: any = await response.json();

	const tokens: OAuthTokens = {
		accessToken: data.access_token,
		refreshToken: data.refresh_token || refreshToken,
		expiresAt: Date.now() + (data.expires_in * 1000),
		provider: 'qwen',
	};

	saveTokens(tokens);
	return tokens;
}

/**
 * Start local callback server to receive OAuth code
 */
export async function startCallbackServer(): Promise<string> {
	return new Promise((resolve, reject) => {
		const http = require('http');
		
		const server = http.createServer((req: any, res: any) => {
			const url = new URL(req.url, `http://localhost:3456`);
			
			if (url.pathname === '/callback') {
				const code = url.searchParams.get('code');
				const error = url.searchParams.get('error');

				if (error) {
					res.writeHead(200, { 'Content-Type': 'text/html' });
					res.end(`
						<html>
							<body style="font-family: sans-serif; text-align: center; padding: 50px;">
								<h1 style="color: #ef4444;">? Authorization Failed</h1>
								<p>Error: ${error}</p>
								<p>You can close this window.</p>
							</body>
						</html>
					`);
					server.close();
					reject(new Error(`OAuth error: ${error}`));
					return;
				}

				if (code) {
					res.writeHead(200, { 'Content-Type': 'text/html' });
					res.end(`
						<html>
							<body style="font-family: sans-serif; text-align: center; padding: 50px;">
								<h1 style="color: #10b981;">? Authorization Successful!</h1>
								<p>You can close this window and return to the terminal.</p>
							</body>
						</html>
					`);
					server.close();
					resolve(code);
					return;
				}
			}

			res.writeHead(404);
			res.end('Not found');
		});

		server.listen(3456, () => {
			console.log('?? Callback server started on http://localhost:3456');
		});

		// Timeout after 5 minutes
		setTimeout(() => {
			server.close();
			reject(new Error('OAuth flow timeout'));
		}, 5 * 60 * 1000);
	});
}

/**
 * Open URL in default browser
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

	spawn(command, [url], { detached: true, stdio: 'ignore' }).unref();
}

/**
 * Complete OAuth flow for Qwen
 */
export async function completeQwenOAuth(clientId: string, clientSecret: string): Promise<OAuthTokens> {
	console.log('\n?? Starting Qwen OAuth Flow...\n');

	// Generate auth URL
	const authUrl = generateQwenAuthUrl(clientId);
	
	console.log('?? Authorization URL:');
	console.log(`\n   ${authUrl}\n`);
	console.log('Opening browser...\n');
	
	// Open browser
	openBrowser(authUrl);

	// Start callback server
	console.log('? Waiting for authorization...');
	console.log('   (Please complete authorization in your browser)\n');

	const code = await startCallbackServer();

	console.log('? Authorization code received!');
	console.log('?? Exchanging code for access token...\n');

	// Exchange code for token
	const tokens = await exchangeCodeForToken(code, clientId, clientSecret);

	console.log('? OAuth flow completed successfully!');
	console.log(`   Access token expires in: ${Math.floor((tokens.expiresAt! - Date.now()) / 1000 / 60)} minutes\n`);

	return tokens;
}

/**
 * Get OpenAI client with OAuth token
 */
export function getAuthenticatedClient(tokens: OAuthTokens, model?: string): OpenAI {
	const endpoint = tokens.provider === 'qwen' 
		? QWEN_CONFIG.apiEndpoint 
		: 'https://api.openai.com/v1';

	return new OpenAI({
		baseURL: endpoint,
		apiKey: tokens.accessToken,
		defaultHeaders: {
			'Authorization': `Bearer ${tokens.accessToken}`,
		},
	});
}

/**
 * Get Qwen configuration
 */
export function getQwenConfig() {
	return QWEN_CONFIG;
}
