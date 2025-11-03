import { executeWebSearchTool } from './source/tools/web-search.js';

console.log('?? Testing Google Search Tool...\n');

const testQueries = [
  'javascript tutorial',
  'python programming',
  'typescript features',
];

async function testGoogleSearch() {
  for (const query of testQueries) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: "${query}"`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const startTime = Date.now();
      const result = await executeWebSearchTool(query, 5);
      const duration = Date.now() - startTime;
      
      console.log(`??  Response time: ${duration}ms`);
      
      // Parse JSON result
      const parsed = JSON.parse(result);
      
      if (parsed.error) {
        console.log(`? ERROR: ${parsed.error}`);
        console.log(`Message: ${parsed.message}`);
        continue;
      }
      
      console.log(`? Success!`);
      console.log(`?? Engine: ${parsed.engine}`);
      console.log(`?? Query: ${parsed.query}`);
      console.log(`?? Total Results: ${parsed.totalResults}`);
      
      if (parsed.results && parsed.results.length > 0) {
        console.log(`\n?? Results:`);
        parsed.results.forEach((r: any, i: number) => {
          console.log(`\n  ${i + 1}. ${r.title || 'NO TITLE'}`);
          console.log(`     URL: ${r.url || 'NO URL'}`);
          console.log(`     Description: ${r.description?.substring(0, 100) || 'NO DESCRIPTION'}...`);
          
          // Validate
          const hasTitle = r.title && r.title.length > 0;
          const hasUrl = r.url && r.url.startsWith('http');
          const hasDescription = r.description && r.description.length > 0;
          
          if (!hasTitle || !hasUrl || !hasDescription) {
            console.log(`     ??  Missing: ${!hasTitle ? 'title ' : ''}${!hasUrl ? 'url ' : ''}${!hasDescription ? 'description' : ''}`);
          }
        });
      } else {
        console.log(`??  WARNING: No results returned!`);
      }
      
    } catch (error) {
      console.log(`? EXCEPTION: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error && error.stack) {
        console.log(`Stack: ${error.stack.substring(0, 300)}...`);
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('? Test completed!');
  console.log(`${'='.repeat(60)}\n`);
}

testGoogleSearch().catch(console.error);
