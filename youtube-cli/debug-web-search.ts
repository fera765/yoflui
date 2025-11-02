import { executeWebSearchTool } from './source/tools/web-search.js';

// Let's test the raw HTML fetching to see what's happening
async function debugSearch() {
  console.log('?? Debugging Web Search...\n');
  
  // Test DuckDuckGo directly
  console.log('Testing DuckDuckGo HTML fetch...');
  try {
    const query = 'javascript tutorial';
    const encodedQuery = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    
    console.log(`Status: ${response.status}`);
    const html = await response.text();
    console.log(`HTML length: ${html.length} bytes`);
    console.log(`\nFirst 1000 chars of HTML:`);
    console.log(html.substring(0, 1000));
    
    // Check for result patterns
    const resultPatterns = [
      /<div[^>]*class="[^"]*result[^"]*"/gi,
      /<div[^>]*class="[^"]*web-result[^"]*"/gi,
      /result__a/gi,
      /result__url/gi,
    ];
    
    console.log('\n?? Pattern matches:');
    resultPatterns.forEach(pattern => {
      const matches = html.match(pattern);
      console.log(`  ${pattern.source}: ${matches ? matches.length : 0} matches`);
    });
    
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\nTesting Google HTML fetch...');
  try {
    const query = 'python programming';
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.google.com/search?q=${encodedQuery}&num=10&hl=en`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
      }
    });
    
    console.log(`Status: ${response.status}`);
    const html = await response.text();
    console.log(`HTML length: ${html.length} bytes`);
    
    if (response.status === 200) {
      console.log(`\nFirst 1000 chars of HTML:`);
      console.log(html.substring(0, 1000));
      
      // Check for common Google patterns
      const googlePatterns = [
        /<div[^>]*class="[^"]*g[^"]*"/gi,
        /<div[^>]*class="[^"]*tF2Cxc[^"]*"/gi,
        /<h3[^>]*>/gi,
        /data-ved/gi,
      ];
      
      console.log('\n?? Google pattern matches:');
      googlePatterns.forEach(pattern => {
        const matches = html.match(pattern);
        console.log(`  ${pattern.source}: ${matches ? matches.length : 0} matches`);
      });
      
      // Check if it's a CAPTCHA page
      if (html.includes('captcha') || html.includes('CAPTCHA') || html.includes('Our systems have detected')) {
        console.log('\n??  CAPTCHA detected in Google response!');
      }
    }
    
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

debugSearch().catch(console.error);
