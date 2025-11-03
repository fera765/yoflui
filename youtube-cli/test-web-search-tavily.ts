import { executeWebSearchTool } from './source/tools/web-search.js';

console.log('?? Testing Web Search Tool with Tavily API...\n');

const testQueries = [
  'javascript tutorial',
  'python programming',
  'typescript features',
];

async function testWebSearch() {
  // Check if API key is configured
  if (!process.env.TAVILY_API_KEY) {
    console.log('??  TAVILY_API_KEY not configured');
    console.log('?? To test, set TAVILY_API_KEY environment variable');
    console.log('   Example: export TAVILY_API_KEY=your_api_key_here\n');
    
    // Test error handling
    console.log('Testing error handling (no API key)...');
    const result = await executeWebSearchTool('test query');
    const parsed = JSON.parse(result);
    console.log('? Error handling works:', parsed.error ? 'Yes' : 'No');
    console.log('Message:', parsed.message?.substring(0, 100) + '...\n');
    return;
  }

  console.log('? TAVILY_API_KEY is configured\n');

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
      console.log(`?? Query: ${parsed.query}`);
      console.log(`?? Total Results: ${parsed.totalResults}`);
      
      if (parsed.answer) {
        console.log(`\n?? Answer (first 200 chars):`);
        console.log(parsed.answer.substring(0, 200) + '...');
      }
      
      if (parsed.results && parsed.results.length > 0) {
        console.log(`\n?? Results:`);
        parsed.results.slice(0, 3).forEach((r: any, i: number) => {
          console.log(`\n  ${i + 1}. ${r.title}`);
          console.log(`     URL: ${r.url}`);
          if (r.description) {
            console.log(`     Description: ${r.description.substring(0, 100)}...`);
          }
          if (r.score) {
            console.log(`     Score: ${r.score}`);
          }
        });
      } else {
        console.log(`??  WARNING: No results returned!`);
      }
      
      if (parsed.sources && parsed.sources.length > 0) {
        console.log(`\n?? Sources (${parsed.sources.length}):`);
        parsed.sources.slice(0, 3).forEach((s: any, i: number) => {
          console.log(`  ${i + 1}. ${s.title} - ${s.url}`);
        });
      }
    } catch (error) {
      console.log(`? EXCEPTION: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error && error.stack) {
        console.log(`Stack: ${error.stack.substring(0, 200)}...`);
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('? Test completed!');
  console.log(`${'='.repeat(60)}\n`);
}

testWebSearch().catch(console.error);
