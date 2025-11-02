import { getAllToolDefinitions } from './source/tools/index.ts';
import { executeToolCall } from './source/tools/index.ts';

async function testWebSearchIntegration() {
	console.log('?? Testing Web Search Tool Integration with Flui System\n');
	
	// 1. Verify tool is available
	const tools = getAllToolDefinitions();
	const webSearchTool = tools.find(t => t.function.name === 'web_search');
	
	if (!webSearchTool) {
		console.error('? Web Search tool not found in tool definitions');
		return false;
	}
	
	console.log('? Web Search tool found in system');
	console.log(`   Name: ${webSearchTool.function.name}`);
	console.log(`   Description: ${webSearchTool.function.description.substring(0, 80)}...`);
	console.log(`   Parameters: ${Object.keys(webSearchTool.function.parameters.properties).join(', ')}\n`);
	
	// 2. Test tool execution with custom maxResults (simulating LLM request)
	console.log('?? Testing tool execution with maxResults=20 (simulating LLM request)...\n');
	
	try {
		const result = await executeToolCall(
			'web_search',
			{
				query: 'react hooks tutorial',
				engine: 'bing',
				maxResults: 20
			},
			process.cwd()
		);
		
		const parsed = JSON.parse(result);
		
		console.log(`? Tool executed successfully`);
		console.log(`   Engine: ${parsed.engine}`);
		console.log(`   Query: ${parsed.query}`);
		console.log(`   Requested: 20 results`);
		console.log(`   Returned: ${parsed.totalResults} results`);
		
		if (parsed.totalResults > 0) {
			console.log(`\n?? Sample Result:`);
			console.log(`   Title: ${parsed.results[0].title?.substring(0, 60)}...`);
			console.log(`   URL: ${parsed.results[0].url?.substring(0, 60)}...`);
			console.log(`   Description: ${parsed.results[0].description?.substring(0, 60)}...`);
		}
		
		// Validate that LLM can request different amounts
		if (parsed.totalResults <= 20) {
			console.log(`\n? Tool respects maxResults parameter - LLM can control result count`);
		}
		
		console.log(`\n? Integration test PASSED - Tool is ready for LLM use`);
		return true;
	} catch (error) {
		console.error(`? Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
		return false;
	}
}

testWebSearchIntegration()
	.then(success => {
		process.exit(success ? 0 : 1);
	})
	.catch(error => {
		console.error('Test error:', error);
		process.exit(1);
	});
