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
	render(<App />);
}
