import { executeWebSearchTool } from './source/tools/web-search.js';

// Test with session/cookies approach
async function testWithSession() {
  console.log('?? Testing Google Search with session approach...\n');
  
  // First, make a request to Google homepage to get cookies
  try {
    console.log('Step 1: Getting Google homepage cookies...');
    const homeResponse = await fetch('https://www.google.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    
    const cookies = homeResponse.headers.get('set-cookie') || '';
    console.log(`Cookies received: ${cookies ? 'Yes' : 'No'}\n`);
    
    // Now try search with cookies
    console.log('Step 2: Trying search with cookies...');
    const query = 'javascript tutorial';
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.google.com/search?q=${encodedQuery}&num=10&hl=en`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        'Cookie': cookies,
      }
    });
    
    const html = await searchResponse.text();
    console.log(`Status: ${searchResponse.status}`);
    console.log(`HTML length: ${html.length} bytes\n`);
    
    // Check for h3 tags
    const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;
    console.log(`Found ${h3Count} h3 tags`);
    
    // Check for result patterns
    const patterns = {
      'h3 tags': /<h3[^>]*>/gi,
      '/url?q=': /href="\/url\?q=/gi,
      'VwiC3b': /VwiC3b/gi,
    };
    
    console.log('\nPattern matches:');
    Object.entries(patterns).forEach(([name, pattern]) => {
      const matches = html.match(pattern);
      console.log(`  ${name}: ${matches ? matches.length : 0}`);
    });
    
    // Try to extract one result manually
    const firstH3 = html.match(/<h3[^>]*>.*?<\/h3>/i);
    if (firstH3) {
      console.log('\nFirst h3 found:');
      console.log(firstH3[0].substring(0, 200));
    }
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  }
}

testWithSession().catch(console.error);
