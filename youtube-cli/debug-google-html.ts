import { executeWebSearchTool } from './source/tools/web-search.js';

// Debug: Get raw HTML from Google
async function debugGoogleHTML() {
  const query = 'javascript tutorial';
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.google.com/search?q=${encodedQuery}&num=10&hl=en`;
  
  console.log('?? Fetching Google HTML...\n');
  
  try {
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
    console.log(`HTML length: ${html.length} bytes\n`);
    
    // Check for CAPTCHA
    if (html.includes('captcha') || html.includes('CAPTCHA') || html.includes('Our systems have detected')) {
      console.log('??  CAPTCHA detected!\n');
    }
    
    // Save HTML to file for inspection
    const fs = await import('fs/promises');
    await fs.writeFile('/tmp/google-response.html', html);
    console.log('?? HTML saved to /tmp/google-response.html\n');
    
    // Look for common Google patterns
    console.log('?? Searching for patterns...\n');
    
    const patterns = [
      { name: 'h3 tags', pattern: /<h3[^>]*>/gi },
      { name: 'div.g', pattern: /<div[^>]*class="[^"]*g[^"]*"/gi },
      { name: 'div.tF2Cxc', pattern: /<div[^>]*class="[^"]*tF2Cxc[^"]*"/gi },
      { name: 'data-ved', pattern: /data-ved/gi },
      { name: 'href="/url?q=', pattern: /href="\/url\?q=/gi },
      { name: 'VwiC3b (snippet)', pattern: /VwiC3b/gi },
      { name: 'LC20lb (title)', pattern: /LC20lb/gi },
    ];
    
    patterns.forEach(({ name, pattern }) => {
      const matches = html.match(pattern);
      console.log(`  ${name}: ${matches ? matches.length : 0} matches`);
    });
    
    // Try to find a sample result
    console.log('\n?? Looking for sample result structure...\n');
    
    // Find first h3
    const h3Match = html.match(/<h3[^>]*>[\s\S]{0,500}/i);
    if (h3Match) {
      console.log('First h3 found:');
      console.log(h3Match[0].substring(0, 300));
    }
    
    // Find first div with g class
    const divGMatch = html.match(/<div[^>]*class="[^"]*g[^"]*"[^>]*>[\s\S]{0,1000}/i);
    if (divGMatch) {
      console.log('\nFirst div.g found:');
      console.log(divGMatch[0].substring(0, 500));
    }
    
    // Find first link with /url?q=
    const urlMatch = html.match(/href="\/url\?q=[^"]+"/i);
    if (urlMatch) {
      console.log('\nFirst /url?q= link found:');
      console.log(urlMatch[0]);
    }
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  }
}

debugGoogleHTML().catch(console.error);
