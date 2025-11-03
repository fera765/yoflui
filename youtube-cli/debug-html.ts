import * as fs from 'fs';

async function debugHTML() {
	console.log('?? Debugging HTML from Google and DuckDuckGo...\n');
	
	const query = 'python';
	
	// Test DuckDuckGo first (more likely to work)
	console.log('='.repeat(60));
	console.log('Testing DuckDuckGo...');
	console.log('='.repeat(60));
	
	try {
		const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
		const response = await fetch(ddgUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.9',
			},
		});
		
		const html = await response.text();
		console.log(`Status: ${response.status}`);
		console.log(`Content-Type: ${response.headers.get('content-type')}`);
		console.log(`HTML Length: ${html.length}`);
		
		// Save HTML for inspection
		fs.writeFileSync('debug-duckduckgo.html', html);
		console.log('? Saved HTML to debug-duckduckgo.html');
		
		// Check for common selectors
		const hasResult = html.includes('class="result');
		const hasResultA = html.includes('result__a');
		const hasResultSnippet = html.includes('result__snippet');
		console.log(`Has .result: ${hasResult}`);
		console.log(`Has .result__a: ${hasResultA}`);
		console.log(`Has .result__snippet: ${hasResultSnippet}`);
		
		// Show sample of HTML around results
		const resultIndex = html.indexOf('result');
		if (resultIndex > -1) {
			console.log('\nSample HTML around "result":');
			console.log(html.substring(Math.max(0, resultIndex - 100), resultIndex + 500));
		}
		
	} catch (error) {
		console.error(`DuckDuckGo error: ${error}`);
	}
}

debugHTML().catch(console.error);
