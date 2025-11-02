import { executeWebSearchTool } from './source/tools/web-search.js';

async function testSearXNGSearch() {
	console.log('?? Testing SearXNG Search Tool...\n');
	
	const testQueries = [
		'javascript tutorial',
		'python programming',
		'typescript features',
	];
	
	for (const query of testQueries) {
		console.log('='.repeat(60));
		console.log(`Testing: "${query}"`);
		console.log('='.repeat(60));
		
		const startTime = Date.now();
		
		try {
			const result = await executeWebSearchTool(query, 5);
			const responseTime = Date.now() - startTime;
			
			const data = JSON.parse(result);
			
			console.log(`??  Response time: ${responseTime}ms`);
			
			if (data.error) {
				console.log(`? Error: ${data.error}`);
				console.log(`   Message: ${data.message}`);
			} else {
				console.log(`? Success!`);
				console.log(`?? Engine: ${data.engine}`);
				console.log(`?? Query: ${data.query}`);
				console.log(`?? Total Results: ${data.totalResults}`);
				
				if (data.results && data.results.length > 0) {
					console.log(`\n?? Results:`);
					data.results.forEach((result: any, index: number) => {
						console.log(`\n${index + 1}. ${result.title}`);
						console.log(`   URL: ${result.url}`);
						if (result.description) {
							console.log(`   Description: ${result.description.substring(0, 100)}...`);
						}
					});
				} else {
					console.log(`??  WARNING: No results returned!`);
				}
			}
		} catch (error) {
			const responseTime = Date.now() - startTime;
			console.log(`??  Response time: ${responseTime}ms`);
			console.log(`? Exception: ${error instanceof Error ? error.message : String(error)}`);
		}
		
		console.log('\n');
	}
	
	console.log('='.repeat(60));
	console.log('? Test completed!');
	console.log('='.repeat(60));
}

testSearXNGSearch().catch(console.error);
