import { executeWebSearchTool } from './source/tools/web-search.js';

// Test the updated parser
async function testUpdatedParser() {
  console.log('?? Testing updated DuckDuckGo parser...\n');
  
  try {
    const query = 'javascript tutorial';
    const result = await executeWebSearchTool(query, 'duckduckgo', 5);
    
    if (result.startsWith('Error:')) {
      console.log(`? ERROR: ${result}`);
      return;
    }
    
    const parsed = JSON.parse(result);
    console.log(`? Success!`);
    console.log(`?? Engine: ${parsed.engine}`);
    console.log(`?? Query: ${parsed.query}`);
    console.log(`?? Total Results: ${parsed.totalResults}`);
    
    if (parsed.results && parsed.results.length > 0) {
      console.log(`\n?? Results:`);
      parsed.results.forEach((r: any, i: number) => {
        console.log(`\n  ${i + 1}. ${r.title}`);
        console.log(`     URL: ${r.url}`);
        console.log(`     Description: ${r.description?.substring(0, 100) || 'N/A'}...`);
      });
    } else {
      console.log(`??  WARNING: No results returned!`);
      console.log(`\nRaw result preview: ${result.substring(0, 500)}`);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

testUpdatedParser().catch(console.error);
