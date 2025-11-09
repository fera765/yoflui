#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import App from './app.js';
import { runNonInteractive } from './non-interactive.js';
import { setConfig } from './llm-config.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const promptIndex = args.indexOf('--prompt');

// Check if --prompt flag exists
if (promptIndex !== -1 && args[promptIndex + 1]) {
	const prompt = args[promptIndex + 1];
	runNonInteractive(prompt);
} else {
	// Clear terminal before starting interactive mode
	console.clear();
	
	// Interactive mode - load config.json if exists
	try {
		const configPath = join(process.cwd(), 'config.json');
		const configData = readFileSync(configPath, 'utf-8');
		const config = JSON.parse(configData);
		setConfig({
			endpoint: config.endpoint || 'https://api.llm7.io/v1',
			apiKey: config.apiKey || '',
			model: config.model || 'gpt-4.1-nano-2025-04-14',
			maxVideos: config.maxVideos || 10,
			maxCommentsPerVideo: config.maxCommentsPerVideo || 100,
		});
	} catch (error) {
		// Config file doesn't exist, use defaults
	}

	// Render interactive CLI
	const { clear, unmount } = render(<App />);
	
	// Handle graceful shutdown on Ctrl+C and other signals
	const cleanup = () => {
		try {
			unmount();
			clear();
		} catch (error) {
			// Ignore errors during cleanup
		}
		process.exit(0);
	};
	
	// Handle SIGINT (Ctrl+C)
	process.on('SIGINT', cleanup);
	
	// Handle SIGTERM
	process.on('SIGTERM', cleanup);
	
	// Handle uncaught exceptions during exit
	process.on('uncaughtException', (error) => {
		const nodeError = error as any;
		if (nodeError.code === 'EIO' || nodeError.syscall === 'read') {
			// Ignore EIO errors during terminal cleanup
			cleanup();
		} else {
			console.error('Uncaught exception:', error);
			cleanup();
		}
	});
	
	// Handle stdin errors (like EIO when terminal closes)
	if (process.stdin) {
		process.stdin.on('error', (error: any) => {
			if (error.code === 'EIO' || error.syscall === 'read') {
				// Ignore EIO errors during terminal cleanup
				cleanup();
			}
		});
	}
}
