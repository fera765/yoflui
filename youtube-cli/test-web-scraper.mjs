import { executeWebScraperTool } from './source/tools/web-scraper.ts';

const testUrls = [
	'https://www.wikipedia.org',
	'https://github.com',
	'https://stackoverflow.com',
	'https://www.reddit.com',
	'https://news.ycombinator.com',
	'https://dev.to',
	'https://www.medium.com',
	'https://css-tricks.com',
];

async function testScraper(url) {
	console.log(`\n${'='.repeat(60)}`);
	console.log(`Testing: ${url}`);
	console.log(`${'='.repeat(60)}\n`);
	
	try {
		const result = await executeWebScraperTool(url);
		
		if (result.startsWith('Error:')) {
			console.log(`? FAILED: ${result}`);
			return false;
		}
		
		const parsed = JSON.parse(result);
		
		console.log(`? SUCCESS`);
		console.log(`   URL: ${parsed.url}`);
		console.log(`   Content Length: ${parsed.contentLength} characters`);
		
		if (!parsed.content || parsed.content.length === 0) {
			console.log(`??  WARNING: Empty content`);
			return false;
		}
		
		// Check for mock/hardcoded data
		const contentLower = parsed.content.toLowerCase();
		if (contentLower.includes('mock') || contentLower.includes('test data') || contentLower.includes('placeholder')) {
			console.log(`??  WARNING: Possible mock/hardcoded data detected`);
			return false;
		}
		
		// Show sample content
		console.log(`\n?? Sample Content (first 200 chars):`);
		console.log(`   ${parsed.content.substring(0, 200).replace(/\n/g, ' ')}...`);
		
		// Check markdown structure
		const hasMarkdown = parsed.content.includes('#') || parsed.content.includes('**') || parsed.content.includes('*') || parsed.content.includes('[');
		if (hasMarkdown) {
			console.log(`? Markdown structure detected`);
		}
		
		return true;
	} catch (error) {
		console.error(`? ERROR: ${error instanceof Error ? error.message : String(error)}`);
		return false;
	}
}

async function runAllTests() {
	console.log('?? Testing Web Scraper on Multiple Sites\n');
	
	const results = {};
	let successCount = 0;
	let failCount = 0;
	
	for (const url of testUrls) {
		const success = await testScraper(url);
		results[url] = success;
		
		if (success) {
			successCount++;
		} else {
			failCount++;
		}
		
		// Delay between tests
		await new Promise(resolve => setTimeout(resolve, 2000));
	}
	
	console.log(`\n${'='.repeat(60)}`);
	console.log('?? FINAL RESULTS');
	console.log(`${'='.repeat(60)}\n`);
	
	console.log(`? Success: ${successCount}/${testUrls.length}`);
	console.log(`? Failed: ${failCount}/${testUrls.length}\n`);
	
	for (const [url, success] of Object.entries(results)) {
		console.log(`${success ? '?' : '?'} ${url}`);
	}
	
	if (successCount === testUrls.length) {
		console.log(`\n? All tests passed!`);
		process.exit(0);
	} else {
		console.log(`\n??  Some tests failed`);
		process.exit(1);
	}
}

runAllTests().catch(console.error);
