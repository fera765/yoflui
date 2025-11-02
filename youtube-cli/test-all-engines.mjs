import { executeWebSearchTool } from './source/tools/web-search.ts';

async function testEngine(engine, query) {
	console.log(`\n${'='.repeat(60)}`);
	console.log(`Testing ${engine.toUpperCase()} with query: "${query}"`);
	console.log(`${'='.repeat(60)}\n`);
	
	try {
		const result = await executeWebSearchTool(query, engine, 10);
		const parsed = JSON.parse(result);
		
		console.log(`? Engine: ${parsed.engine}`);
		console.log(`?? Total Results: ${parsed.totalResults}`);
		
		if (parsed.totalResults === 0) {
			console.log(`??  WARNING: No results found!`);
			return false;
		}
		
		console.log(`\n?? Sample Results (first 3):`);
		parsed.results.slice(0, 3).forEach((r, i) => {
			console.log(`\n${i + 1}. ${r.title || '(no title)'}`);
			console.log(`   URL: ${r.url || '(no url)'}`);
			console.log(`   Description: ${r.description ? r.description.substring(0, 100) + '...' : '(no description)'}`);
			
			// Validate: ensure no mock/hardcoded data
			if (!r.title || r.title === 'test' || r.title === 'mock' || r.title.length < 5) {
				console.log(`   ? INVALID: Title seems incorrect`);
				return false;
			}
			if (!r.url || !r.url.startsWith('http')) {
				console.log(`   ? INVALID: URL seems incorrect`);
				return false;
			}
		});
		
		// Check for mock/hardcoded data
		const hasValidData = parsed.results.every((r) => 
			r.title && 
			r.title.length > 5 && 
			r.url && 
			r.url.startsWith('http') &&
			!r.title.includes('mock') &&
			!r.title.includes('test') &&
			!r.url.includes('example.com')
		);
		
		if (!hasValidData) {
			console.log(`\n??  WARNING: Some results may contain mock/hardcoded data`);
			return false;
		}
		
		console.log(`\n? All results appear valid!`);
		return true;
	} catch (error) {
		console.error(`? Error: ${error instanceof Error ? error.message : String(error)}`);
		return false;
	}
}

async function runAllTests() {
	console.log('?? Testing all search engines...\n');
	
	const tests = [
		{ engine: 'google', query: 'javascript tutorial' },
		{ engine: 'duckduckgo', query: 'python programming' },
		{ engine: 'bing', query: 'react hooks' },
		{ engine: 'perplexity', query: 'nodejs api' },
	];
	
	const results = {};
	
	for (const test of tests) {
		results[test.engine] = await testEngine(test.engine, test.query);
		// Delay between tests
		await new Promise(resolve => setTimeout(resolve, 2000));
	}
	
	console.log(`\n${'='.repeat(60)}`);
	console.log('?? FINAL RESULTS');
	console.log(`${'='.repeat(60)}\n`);
	
	for (const [engine, success] of Object.entries(results)) {
		console.log(`${success ? '?' : '?'} ${engine}: ${success ? 'PASSED' : 'FAILED'}`);
	}
	
	const allPassed = Object.values(results).every(r => r);
	
	if (allPassed) {
		console.log(`\n? All engines working correctly!`);
		process.exit(0);
	} else {
		console.log(`\n??  Some engines need adjustments`);
		process.exit(1);
	}
}

runAllTests().catch(console.error);
