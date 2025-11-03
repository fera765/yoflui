import { executeWebSearchTool } from './source/tools/web-search.js';

// Test using google-it library
async function testWithGoogleIt() {
  console.log('?? Testing with google-it library...\n');
  
  try {
    const googleIt = await import('google-it');
    
    const query = 'javascript tutorial';
    console.log(`Searching for: "${query}"\n`);
    
    const results = await googleIt.default({ 
      query,
      options: {
        limit: 5
      }
    });
    
    console.log(`? Found ${results.length} results\n`);
    
    results.forEach((r: any, i: number) => {
      console.log(`${i + 1}. ${r.title || 'NO TITLE'}`);
      console.log(`   URL: ${r.link || 'NO URL'}`);
      console.log(`   Description: ${r.snippet || 'NO DESCRIPTION'}\n`);
    });
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack.substring(0, 300));
    }
  }
}

testWithGoogleIt().catch(console.error);
