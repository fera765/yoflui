import { executeWebSearchTool } from './source/tools/web-search.js';

// Test DuckDuckGo parsing - find actual result structure
async function findResultStructure() {
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
  
  // Look for result containers - try different patterns
  console.log('?? Searching for result structures...\n');
  
  // Try to find divs with links that have uddg parameter
  const uddgLinks = html.match(/<a[^>]*href="([^"]*uddg=[^"]+)"[^>]*>(.*?)<\/a>/gs);
  console.log(`Found ${uddgLinks?.length || 0} links with uddg parameter\n`);
  
  if (uddgLinks && uddgLinks.length > 0) {
    console.log('Sample uddg links:');
    uddgLinks.slice(0, 3).forEach((link, i) => {
      const urlMatch = link.match(/href="([^"]+)"/);
      const textMatch = link.match(/>([^<]+)</);
      const url = urlMatch ? urlMatch[1] : 'N/A';
      // Decode uddg URL
      if (url.includes('uddg=')) {
        const uddgMatch = url.match(/uddg=([^&]+)/);
        if (uddgMatch) {
          try {
            const decoded = decodeURIComponent(uddgMatch[1]);
            console.log(`\n${i + 1}. Title: ${textMatch ? textMatch[1].trim() : 'N/A'}`);
            console.log(`   Decoded URL: ${decoded}`);
          } catch (e) {
            console.log(`\n${i + 1}. URL: ${url.substring(0, 100)}...`);
          }
        }
      }
    });
  }
  
  // Find the parent containers of these links
  console.log('\n\n?? Finding parent containers...');
  const linkWithContext = html.match(/<div[^>]*>[\s\S]{0,500}<a[^>]*href="[^"]*uddg=[^"]+"[^>]*>[\s\S]{0,200}/gi);
  if (linkWithContext && linkWithContext.length > 0) {
    console.log(`Found ${linkWithContext.length} links with context`);
    console.log('\nSample result structure (first 800 chars):');
    console.log(linkWithContext[0].substring(0, 800));
  }
}

findResultStructure().catch(console.error);
