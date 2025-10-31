/**
 * E2E Test Suite - AI YouTube Analyst
 * 
 * Tests the complete flow:
 * 1. YouTube scraping (tool)
 * 2. LLM integration
 * 3. Tool calling
 * 4. Response generation
 */

import { scrapeYouTubeData } from './source/scraper.js';
import { executeYouTubeTool } from './source/youtube-tool.js';
import { sendMessage } from './source/llm-service.js';
import { setConfig } from './source/llm-config.js';

// Test colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

interface TestResult {
	name: string;
	passed: boolean;
	duration: number;
	error?: string;
	details?: any;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>): Promise<void> {
	const start = Date.now();
	console.log(`${CYAN}? ${name}${RESET}`);
	
	try {
		await fn();
		const duration = Date.now() - start;
		results.push({ name, passed: true, duration });
		console.log(`${GREEN}  ? Passed${RESET} (${duration}ms)\n`);
	} catch (error) {
		const duration = Date.now() - start;
		const errorMsg = error instanceof Error ? error.message : String(error);
		results.push({ name, passed: false, duration, error: errorMsg });
		console.log(`${RED}  ? Failed${RESET} (${duration}ms)`);
		console.log(`${RED}  Error: ${errorMsg}${RESET}\n`);
	}
}

async function runTests() {
	console.log('\n????????????????????????????????????????????');
	console.log('?   E2E TEST SUITE - AI YOUTUBE ANALYST   ?');
	console.log('????????????????????????????????????????????\n');

	// Configure LLM
	setConfig({
		endpoint: 'https://api.llm7.io/v1',
		apiKey: '',
		model: 'gpt-4.1-nano-2025-04-14',
	});

	// Test 1: YouTube Scraper
	await test('Test 1: YouTube Video Search', async () => {
		const result = await scrapeYouTubeData('javascript tutorial');
		
		if (!result) {
			throw new Error('No result returned');
		}
		
		if (!result.videos || result.videos.length === 0) {
			throw new Error('No videos found');
		}
		
		if (result.videos.length > 10) {
			throw new Error(`Too many videos: ${result.videos.length}`);
		}
		
		console.log(`    Found ${result.videos.length} videos`);
	});

	// Test 2: Comment Extraction
	await test('Test 2: Comment Extraction', async () => {
		const result = await scrapeYouTubeData('python programming');
		
		const totalComments = result.videos.reduce((sum, v) => sum + v.comments.length, 0);
		
		if (totalComments === 0) {
			throw new Error('No comments extracted');
		}
		
		console.log(`    Extracted ${totalComments} comments from ${result.videos.length} videos`);
		
		// Check comment structure
		const firstComment = result.videos[0].comments[0];
		if (!firstComment.author || !firstComment.text) {
			throw new Error('Invalid comment structure');
		}
		
		console.log(`    Comment structure validated`);
	});

	// Test 3: YouTube Tool
	await test('Test 3: YouTube Tool Execution', async () => {
		const result = await executeYouTubeTool('react hooks');
		
		if (!result.success) {
			throw new Error(`Tool failed: ${result.error}`);
		}
		
		if (result.totalVideos === 0) {
			throw new Error('Tool returned no videos');
		}
		
		if (result.totalComments === 0) {
			throw new Error('Tool returned no comments');
		}
		
		if (result.comments.length === 0) {
			throw new Error('Tool returned empty comments array');
		}
		
		console.log(`    Tool returned ${result.totalVideos} videos and ${result.totalComments} comments`);
		console.log(`    Comments array has ${result.comments.length} items`);
		
		// Validate comment structure from tool
		const firstComment = result.comments[0];
		if (!firstComment.videoTitle || !firstComment.comment) {
			throw new Error('Invalid tool comment structure');
		}
		
		console.log(`    Tool data structure validated`);
	});

	// Test 4: LLM Integration (without tool)
	await test('Test 4: LLM Basic Response', async () => {
		let toolCalled = false;
		
		const response = await sendMessage(
			'Say hello in one sentence',
			() => { toolCalled = true; },
			() => {}
		);
		
		if (!response) {
			throw new Error('LLM returned empty response');
		}
		
		if (response.length < 5) {
			throw new Error('LLM response too short');
		}
		
		console.log(`    LLM response length: ${response.length} chars`);
		console.log(`    Tool called: ${toolCalled ? 'Yes' : 'No'}`);
	});

	// Test 5: LLM with Tool Calling
	await test('Test 5: LLM Tool Calling', async () => {
		let toolCalled = false;
		let toolName = '';
		let toolQuery = '';
		let toolResult: any = null;
		
		const response = await sendMessage(
			'Search YouTube for videos about TypeScript and tell me what people are saying',
			(name, query) => {
				toolCalled = true;
				toolName = name;
				toolQuery = query;
				console.log(`    Tool called: ${name}`);
				console.log(`    Query: ${query}`);
			},
			(result) => {
				toolResult = result;
				console.log(`    Tool completed: ${result.totalVideos} videos, ${result.totalComments} comments`);
			}
		);
		
		if (!toolCalled) {
			throw new Error('LLM did not call the tool');
		}
		
		if (toolName !== 'YouTube Search') {
			throw new Error(`Wrong tool called: ${toolName}`);
		}
		
		if (!toolQuery || toolQuery.length === 0) {
			throw new Error('Tool query is empty');
		}
		
		if (!toolResult) {
			throw new Error('Tool result is null');
		}
		
		if (toolResult.totalVideos === 0) {
			throw new Error('Tool returned no videos');
		}
		
		if (toolResult.totalComments === 0) {
			throw new Error('Tool returned no comments');
		}
		
		if (!response || response.length < 50) {
			throw new Error('LLM response too short after tool call');
		}
		
		console.log(`    LLM generated ${response.length} chars response`);
		console.log(`    Response includes analysis: ${response.includes('comment') || response.includes('video') ? 'Yes' : 'No'}`);
	});

	// Test 6: End-to-End Flow
	await test('Test 6: Complete E2E Flow', async () => {
		console.log(`    Simulating real user query...`);
		
		let toolExecuted = false;
		let videosProcessed = 0;
		let commentsProcessed = 0;
		
		const userQuery = 'What are the main pain points in the weight loss niche according to YouTube comments?';
		
		const response = await sendMessage(
			userQuery,
			(name, query) => {
				console.log(`    ? Tool triggered: ${name}`);
				console.log(`    ? Generated query: ${query}`);
			},
			(result) => {
				toolExecuted = true;
				videosProcessed = result.totalVideos;
				commentsProcessed = result.totalComments;
				console.log(`    ? Data collected: ${videosProcessed} videos, ${commentsProcessed} comments`);
			}
		);
		
		// Validations
		if (!toolExecuted) {
			throw new Error('Tool was not executed in E2E flow');
		}
		
		if (videosProcessed === 0) {
			throw new Error('No videos processed');
		}
		
		if (commentsProcessed === 0) {
			throw new Error('No comments processed');
		}
		
		if (!response) {
			throw new Error('No response generated');
		}
		
		if (response.length < 100) {
			throw new Error('Response too short for analysis');
		}
		
		// Check if response contains analysis keywords
		const hasAnalysis = 
			response.toLowerCase().includes('pain') ||
			response.toLowerCase().includes('comment') ||
			response.toLowerCase().includes('people') ||
			response.toLowerCase().includes('user');
		
		if (!hasAnalysis) {
			console.log(`    Warning: Response might not contain proper analysis`);
		}
		
		console.log(`    ? Final response: ${response.length} chars`);
		console.log(`    ? Contains analysis keywords: ${hasAnalysis ? 'Yes' : 'No'}`);
		console.log(`    ? Complete E2E flow successful`);
	});

	// Print Summary
	console.log('\n????????????????????????????????????????????');
	console.log('?            TEST SUMMARY                  ?');
	console.log('????????????????????????????????????????????\n');

	const passed = results.filter(r => r.passed).length;
	const failed = results.filter(r => r.failed).length;
	const total = results.length;
	const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

	console.log(`Total Tests: ${total}`);
	console.log(`${GREEN}Passed: ${passed}${RESET}`);
	console.log(`${RED}Failed: ${failed}${RESET}`);
	console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s\n`);

	if (failed > 0) {
		console.log(`${RED}FAILED TESTS:${RESET}`);
		results.filter(r => !r.passed).forEach(r => {
			console.log(`  ${RED}? ${r.name}${RESET}`);
			console.log(`    ${r.error}\n`);
		});
	}

	// Final result
	if (failed === 0) {
		console.log(`${GREEN}????????????????????????????????????????????${RESET}`);
		console.log(`${GREEN}?   ? ALL TESTS PASSED - 100% SUCCESS    ?${RESET}`);
		console.log(`${GREEN}????????????????????????????????????????????${RESET}\n`);
		process.exit(0);
	} else {
		console.log(`${RED}????????????????????????????????????????????${RESET}`);
		console.log(`${RED}?   ? SOME TESTS FAILED                   ?${RESET}`);
		console.log(`${RED}????????????????????????????????????????????${RESET}\n`);
		process.exit(1);
	}
}

// Run tests
runTests().catch((error) => {
	console.error(`${RED}Fatal error:${RESET}`, error);
	process.exit(1);
});
