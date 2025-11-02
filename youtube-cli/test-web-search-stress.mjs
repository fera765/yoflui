import { executeWebSearchTool } from './source/tools/web-search.ts';

const TOTAL_REQUESTS = 400;
const CONCURRENT_REQUESTS = 50;

const testQueries = [
	'javascript tutorial',
	'python programming',
	'react hooks',
	'nodejs api',
	'typescript types',
	'web development',
	'machine learning',
	'artificial intelligence',
	'cloud computing',
	'devops practices',
];

let blockedCount = 0;
let successCount = 0;
let errorCount = 0;
const results = [];

async function runSingleSearch(query, engine) {
	const startTime = Date.now();
	
	try {
		const result = await executeWebSearchTool(query, engine, 10);
		
		// Check if result is error
		if (result.startsWith('Error:')) {
			const isBlocked = result.includes('403') || result.includes('429') || result.includes('blocked') || result.includes('rate limit');
			return {
				success: false,
				status: isBlocked ? 'blocked' : 'error',
				query,
				engine,
				resultsCount: 0,
				error: result,
				responseTime: Date.now() - startTime,
			};
		}
		
		// Parse JSON result
		const parsed = JSON.parse(result);
		const resultsCount = parsed.totalResults || 0;
		
		return {
			success: true,
			status: 'success',
			query,
			engine,
			resultsCount,
			responseTime: Date.now() - startTime,
		};
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		const isBlocked = errorMsg.includes('403') || errorMsg.includes('429') || errorMsg.includes('blocked') || errorMsg.includes('rate limit');
		
		return {
			success: false,
			status: isBlocked ? 'blocked' : 'error',
			query,
			engine,
			resultsCount: 0,
			error: errorMsg,
			responseTime: Date.now() - startTime,
		};
	}
}

async function runStressTest() {
	console.log(`?? Starting stress test with ${TOTAL_REQUESTS} requests...`);
	console.log(`?? Concurrent requests: ${CONCURRENT_REQUESTS}`);
	console.log(`?? Testing both Google and DuckDuckGo\n`);
	
	const startTime = Date.now();
	
	// Generate queries (repeat test queries to reach TOTAL_REQUESTS)
	const queries = [];
	for (let i = 0; i < TOTAL_REQUESTS; i++) {
		const query = testQueries[i % testQueries.length];
		const engine = i % 2 === 0 ? 'duckduckgo' : 'google';
		queries.push({ query: `${query} ${i}`, engine });
	}
	
	// Process in batches
	let processed = 0;
	const batchSize = CONCURRENT_REQUESTS;
	
	for (let i = 0; i < queries.length; i += batchSize) {
		const batch = queries.slice(i, i + batchSize);
		
		const batchPromises = batch.map(async ({ query, engine }) => {
			const result = await runSingleSearch(query, engine);
			results.push(result);
			
			if (result.status === 'blocked') {
				blockedCount++;
				console.log(`? BLOCKED: ${engine} - "${query}"`);
			} else if (result.status === 'success') {
				successCount++;
				if (successCount % 10 === 0) {
					console.log(`? Success: ${successCount} requests completed`);
				}
			} else {
				errorCount++;
				console.log(`??  ERROR: ${engine} - "${query}": ${result.error}`);
			}
			
			processed++;
			if (processed % 50 === 0) {
				console.log(`?? Progress: ${processed}/${TOTAL_REQUESTS} (${Math.round((processed / TOTAL_REQUESTS) * 100)}%)`);
			}
		});
		
		await Promise.all(batchPromises);
		
		// Small delay between batches
		if (i + batchSize < queries.length) {
			await new Promise(resolve => setTimeout(resolve, 500));
		}
	}
	
	const totalTime = Date.now() - startTime;
	
	// Analyze results
	console.log(`\n${'='.repeat(60)}`);
	console.log('?? STRESS TEST RESULTS');
	console.log(`${'='.repeat(60)}\n`);
	
	console.log(`Total Requests: ${TOTAL_REQUESTS}`);
	console.log(`Total Time: ${(totalTime / 1000).toFixed(2)}s`);
	console.log(`Average Time per Request: ${(totalTime / TOTAL_REQUESTS).toFixed(2)}ms\n`);
	
	console.log(`? Success: ${successCount} (${((successCount / TOTAL_REQUESTS) * 100).toFixed(1)}%)`);
	console.log(`? Blocked: ${blockedCount} (${((blockedCount / TOTAL_REQUESTS) * 100).toFixed(1)}%)`);
	console.log(`??  Errors: ${errorCount} (${((errorCount / TOTAL_REQUESTS) * 100).toFixed(1)}%)\n`);
	
	// Analyze by engine
	const googleResults = results.filter(r => r.engine === 'google');
	const duckduckgoResults = results.filter(r => r.engine === 'duckduckgo');
	
	console.log('?? BY ENGINE:');
	console.log(`Google:`);
	console.log(`  Success: ${googleResults.filter(r => r.status === 'success').length}`);
	console.log(`  Blocked: ${googleResults.filter(r => r.status === 'blocked').length}`);
	console.log(`  Errors: ${googleResults.filter(r => r.status === 'error').length}`);
	console.log(`\nDuckDuckGo:`);
	console.log(`  Success: ${duckduckgoResults.filter(r => r.status === 'success').length}`);
	console.log(`  Blocked: ${duckduckgoResults.filter(r => r.status === 'blocked').length}`);
	console.log(`  Errors: ${duckduckgoResults.filter(r => r.status === 'error').length}\n`);
	
	// Average results per successful request
	const successfulResults = results.filter(r => r.status === 'success');
	if (successfulResults.length > 0) {
		const avgResults = successfulResults.reduce((sum, r) => sum + r.resultsCount, 0) / successfulResults.length;
		console.log(`Average results per successful request: ${avgResults.toFixed(1)}\n`);
	}
	
	// Check for blocking patterns
	if (blockedCount > 0) {
		console.log(`\n??  BLOCKING DETECTED: ${blockedCount} requests were blocked`);
		console.log(`?? Need to adjust anti-detection strategies\n`);
		
		// Show blocking patterns
		const blockedByEngine = {
			google: googleResults.filter(r => r.status === 'blocked').length,
			duckduckgo: duckduckgoResults.filter(r => r.status === 'blocked').length,
		};
		
		console.log('Blocking by engine:');
		console.log(`  Google: ${blockedByEngine.google}`);
		console.log(`  DuckDuckGo: ${blockedByEngine.duckduckgo}\n`);
		
		return false;
	} else {
		console.log(`\n? NO BLOCKING DETECTED! All requests successful.\n`);
		return true;
	}
}

// Run test
runStressTest()
	.then((noBlocking) => {
		if (noBlocking) {
			console.log('? Test passed - no blocking detected');
			process.exit(0);
		} else {
			console.log('? Test failed - blocking detected');
			process.exit(1);
		}
	})
	.catch((error) => {
		console.error('Test error:', error);
		process.exit(1);
	});
