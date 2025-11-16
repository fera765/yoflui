import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

async function debugGoogleHTML() {
	const query = 'nodejs';
	const encodedQuery = encodeURIComponent(query);
	const url = `https://www.google.com/search?q=${encodedQuery}&hl=en&num=10`;
	
	console.log('🔍 Fetching Google search page...');
	console.log(`URL: ${url}\n`);
	
	const headers = {
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
		'Accept-Language': 'en-US,en;q=0.9',
		'Accept-Encoding': 'gzip, deflate, br',
		'Connection': 'keep-alive',
		'Upgrade-Insecure-Requests': '1',
		'Sec-Fetch-Dest': 'document',
		'Sec-Fetch-Mode': 'navigate',
		'Sec-Fetch-Site': 'none',
		'Sec-Fetch-User': '?1',
		'Cache-Control': 'max-age=0',
		'DNT': '1',
	};
	
	try {
		const response = await fetch(url, {
			method: 'GET',
			headers,
		});
		
		console.log(`Status: ${response.status} ${response.statusText}`);
		console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
		
		const html = await response.text();
		console.log(`\nHTML Length: ${html.length} bytes`);
		
		// Save HTML to file
		writeFileSync('/home/ubuntu/google-response.html', html);
		console.log('✅ HTML saved to /home/ubuntu/google-response.html');
		
		// Check for blocking indicators
		if (html.includes('unusual traffic')) {
			console.log('\n⚠️  CAPTCHA detected: "unusual traffic"');
		}
		if (html.includes('captcha')) {
			console.log('\n⚠️  CAPTCHA keyword found in HTML');
		}
		if (html.includes('blocked')) {
			console.log('\n⚠️  "blocked" keyword found in HTML');
		}
		
		// Parse with cheerio
		const $ = cheerio.load(html);
		
		// Try different selectors
		console.log('\n📊 Testing different selectors:');
		console.log(`   div.g: ${$('div.g').length} elements`);
		console.log(`   h3: ${$('h3').length} elements`);
		console.log(`   a[href]: ${$('a[href]').length} elements`);
		console.log(`   .yuRUbf: ${$('.yuRUbf').length} elements`);
		console.log(`   #search: ${$('#search').length} elements`);
		console.log(`   #rso: ${$('#rso').length} elements`);
		
		// Try to find search results container
		console.log('\n🔎 Analyzing structure:');
		
		// Check for #rso (Results Section)
		const $rso = $('#rso');
		if ($rso.length > 0) {
			console.log('   ✅ Found #rso container');
			console.log(`      Children: ${$rso.children().length}`);
			
			// List first 5 children with their classes
			$rso.children().slice(0, 5).each((idx, el) => {
				const classes = $(el).attr('class') || 'no-class';
				const tag = el.tagName;
				console.log(`      ${idx + 1}. <${tag} class="${classes}">`);
			});
		}
		
		// Try to extract with different methods
		console.log('\n🧪 Extraction attempts:');
		
		// Method 1: div.g
		let count1 = 0;
		$('div.g').each((idx, el) => {
			const $el = $(el);
			const $h3 = $el.find('h3');
			if ($h3.length > 0) {
				count1++;
				if (count1 <= 3) {
					console.log(`   Method 1 (div.g) - Result ${count1}:`);
					console.log(`      Title: ${$h3.text().trim().substring(0, 60)}...`);
					const $link = $h3.closest('a');
					console.log(`      URL: ${$link.attr('href')?.substring(0, 80)}...`);
				}
			}
		});
		console.log(`   Method 1 total: ${count1} results`);
		
		// Method 2: .yuRUbf (newer Google structure)
		let count2 = 0;
		$('.yuRUbf').each((idx, el) => {
			const $el = $(el);
			const $h3 = $el.find('h3');
			if ($h3.length > 0) {
				count2++;
				if (count2 <= 3) {
					console.log(`   Method 2 (.yuRUbf) - Result ${count2}:`);
					console.log(`      Title: ${$h3.text().trim().substring(0, 60)}...`);
					const $link = $el.find('a');
					console.log(`      URL: ${$link.attr('href')?.substring(0, 80)}...`);
				}
			}
		});
		console.log(`   Method 2 total: ${count2} results`);
		
		// Method 3: Direct h3 search
		let count3 = 0;
		$('h3').each((idx, el) => {
			const $h3 = $(el);
			const text = $h3.text().trim();
			if (text.length > 10) {
				count3++;
				if (count3 <= 3) {
					console.log(`   Method 3 (h3) - Result ${count3}:`);
					console.log(`      Title: ${text.substring(0, 60)}...`);
					const $link = $h3.closest('a');
					console.log(`      URL: ${$link.attr('href')?.substring(0, 80)}...`);
				}
			}
		});
		console.log(`   Method 3 total: ${count3} results`);
		
	} catch (error) {
		console.error('❌ Error:', error);
	}
}

debugGoogleHTML();
