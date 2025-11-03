import { executeWebSearchTool } from './source/tools/web-search.js';

console.log('?? Testing Web Search Tool...\n');

const testQueries = [
  { query: 'javascript tutorial', engine: 'duckduckgo' as const },
  { query: 'python programming', engine: 'google' as const },
  { query: 'typescript', engine: 'bing' as const },
];

async function testWebSearch() {
  for (const { query, engine } of testQueries) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: "${query}" with ${engine}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const startTime = Date.now();
      const result = await executeWebSearchTool(query, engine, 5);
      const duration = Date.now() - startTime;
      
      console.log(`??  Response time: ${duration}ms`);
      
      // Check if result is error
      if (result.startsWith('Error:')) {
        console.log(`? ERROR: ${result}`);
        continue;
      }
      
      // Parse JSON result
      try {
        const parsed = JSON.parse(result);
        console.log(`? Success!`);
        console.log(`?? Engine: ${parsed.engine}`);
        console.log(`?? Query: ${parsed.query}`);
        console.log(`?? Total Results: ${parsed.totalResults}`);
        
        if (parsed.results && parsed.results.length > 0) {
          console.log(`\n?? First ${Math.min(3, parsed.results.length)} results:`);
          parsed.results.slice(0, 3).forEach((r: any, i: number) => {
            console.log(`\n  ${i + 1}. ${r.title}`);
            console.log(`     URL: ${r.url}`);
            console.log(`     Description: ${r.description?.substring(0, 100) || 'N/A'}...`);
          });
        } else {
          console.log(`??  WARNING: No results returned!`);
        }
      } catch (parseError) {
        console.log(`? Failed to parse JSON result:`);
        console.log(`Result preview: ${result.substring(0, 200)}...`);
        console.log(`Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    } catch (error) {
      console.log(`? EXCEPTION: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error && error.stack) {
        console.log(`Stack: ${error.stack}`);
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('? Test completed!');
  console.log(`${'='.repeat(60)}\n`);
}

testWebSearch().catch(console.error);
