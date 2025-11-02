import { executeWebSearchTool } from './source/tools/web-search.js';

// Test DuckDuckGo parsing specifically
async function testDuckDuckGoParsing() {
  console.log('?? Testing DuckDuckGo HTML Parsing...\n');
  
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
    
    const html = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`HTML length: ${html.length} bytes\n`);
    
    // Save full HTML to see structure
    console.log('Full HTML (first 2000 chars):');
    console.log(html.substring(0, 2000));
    console.log('\n...\n');
    console.log('Last 500 chars:');
    console.log(html.substring(html.length - 500));
    
    // Look for any links
    const links = html.match(/<a[^>]*href="([^"]+)"[^>]*>/gi);
    console.log(`\n?? Found ${links?.length || 0} links in HTML`);
    if (links && links.length > 0) {
      console.log('\nFirst 10 links:');
      links.slice(0, 10).forEach((link, i) => {
        const hrefMatch = link.match(/href="([^"]+)"/i);
        if (hrefMatch) {
          console.log(`  ${i + 1}. ${hrefMatch[1]}`);
        }
      });
    }
    
    // Look for result-like structures
    console.log('\n?? Searching for result-like patterns...');
    const patterns = [
      /class="[^"]*result/gi,
      /class="[^"]*web/gi,
      /class="[^"]*link/gi,
      /class="[^"]*title/gi,
    ];
    
    patterns.forEach(pattern => {
      const matches = html.match(pattern);
      console.log(`  ${pattern.source}: ${matches ? matches.length : 0} matches`);
    });
    
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.error(`Stack: ${error.stack}`);
    }
  }
}

testDuckDuckGoParsing().catch(console.error);
