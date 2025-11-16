import { executeWebSearchTool } from './source/tools/web-search.js';

console.log('🧪 Testing Google Web Search Implementation\n');
console.log('='.repeat(60));

async function testSearch(query: string, maxResults: number = 5) {
	console.log(`\n📍 Testing query: "${query}" (max ${maxResults} results)`);
	console.log('-'.repeat(60));
	
	try {
		const startTime = Date.now();
		const result = await executeWebSearchTool(query, maxResults);
		const endTime = Date.now();
		const duration = ((endTime - startTime) / 1000).toFixed(2);
		
		const parsed = JSON.parse(result);
		
		if (parsed.error) {
			console.log(`❌ Error: ${parsed.message}`);
			return false;
		}
		
		console.log(`✅ Success! Found ${parsed.totalResults} results in ${duration}s`);
		console.log(`   Engine: ${parsed.engine}`);
		console.log(`   Query: ${parsed.query}\n`);
		
		if (parsed.results && parsed.results.length > 0) {
			console.log('   Results:');
			parsed.results.forEach((r: any, idx: number) => {
				console.log(`   ${idx + 1}. ${r.title}`);
				console.log(`      URL: ${r.url}`);
				console.log(`      Description: ${r.description.substring(0, 100)}${r.description.length > 100 ? '...' : ''}`);
				console.log('');
			});
		} else {
			console.log('   ⚠️  No results found');
		}
		
		return true;
	} catch (error) {
		console.log(`❌ Exception: ${error instanceof Error ? error.message : String(error)}`);
		return false;
	}
}

async function runTests() {
	const tests = [
		{ query: 'typescript web scraping', maxResults: 5 },
		{ query: 'nodejs best practices', maxResults: 3 },
	];
	
	let passed = 0;
	let failed = 0;
	
	for (const test of tests) {
		const success = await testSearch(test.query, test.maxResults);
		if (success) {
			passed++;
		} else {
			failed++;
		}
		
		// Wait between tests to avoid rate limiting
		if (tests.indexOf(test) < tests.length - 1) {
			console.log('\n⏳ Waiting 5 seconds before next test...');
			await new Promise(resolve => setTimeout(resolve, 5000));
		}
	}
	
	console.log('\n' + '='.repeat(60));
	console.log(`\n📊 Test Summary:`);
	console.log(`   ✅ Passed: ${passed}`);
	console.log(`   ❌ Failed: ${failed}`);
	console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
	
	if (failed === 0) {
		console.log('\n🎉 All tests passed! Google search implementation is working correctly.');
	} else {
		console.log('\n⚠️  Some tests failed. This may be due to:');
		console.log('   - Rate limiting from Google');
		console.log('   - Proxy connectivity issues');
		console.log('   - Network problems');
		console.log('   - Google blocking detection');
	}
}

runTests().catch(error => {
	console.error('\n💥 Fatal error:', error);
	process.exit(1);
});
