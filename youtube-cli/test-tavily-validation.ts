import { executeWebSearchTool } from './source/tools/web-search.js';

console.log('🔍 Validando Implementação Tavily API...\n');

// Teste de validação da estrutura
async function validateImplementation() {
  const apiKey = process.env.TAVILY_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️  TAVILY_API_KEY não configurada');
    console.log('📝 Para testar com API key válida, configure:');
    console.log('   export TAVILY_API_KEY=your_api_key_here\n');
    
    // Testar tratamento de erro sem API key
    console.log('🧪 Teste 1: Validação sem API key...');
    const resultNoKey = await executeWebSearchTool('test query');
    const parsedNoKey = JSON.parse(resultNoKey);
    
    if (parsedNoKey.error === 'TAVILY_API_KEY not configured') {
      console.log('✅ Tratamento de erro sem API key: OK\n');
    } else {
      console.log('❌ Tratamento de erro sem API key: FALHOU\n');
    }
    
    return;
  }
  
  console.log('✅ TAVILY_API_KEY configurada\n');
  
  // Teste com API key válida
  console.log('🧪 Teste 2: Busca real com API key...');
  try {
    const startTime = Date.now();
    const result = await executeWebSearchTool('javascript tutorial', 3);
    const duration = Date.now() - startTime;
    
    console.log(`⏱️  Tempo de resposta: ${duration}ms\n`);
    
    const parsed = JSON.parse(result);
    
    if (parsed.error) {
      console.log('❌ Erro na API:', parsed.message);
      if (parsed.message.includes('Unauthorized')) {
        console.log('⚠️  API key inválida ou expirada');
      }
      return;
    }
    
    // Validar estrutura de resposta
    const checks = {
      hasQuery: !!parsed.query,
      hasResults: Array.isArray(parsed.results),
      hasTotalResults: typeof parsed.totalResults === 'number',
      hasAnswer: typeof parsed.answer === 'string',
      hasSources: Array.isArray(parsed.sources),
    };
    
    console.log('📊 Validação da estrutura:');
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
    });
    
    if (Object.values(checks).every(v => v)) {
      console.log('\n✅ Estrutura de resposta válida!\n');
    } else {
      console.log('\n❌ Estrutura de resposta inválida!\n');
    }
    
    // Mostrar resultados
    console.log(`📝 Query: ${parsed.query}`);
    console.log(`📊 Total Results: ${parsed.totalResults}`);
    
    if (parsed.answer) {
      console.log(`\n💬 Answer (primeiros 200 chars):`);
      console.log(parsed.answer.substring(0, 200) + '...');
    }
    
    if (parsed.results && parsed.results.length > 0) {
      console.log(`\n📋 Resultados (${parsed.results.length}):`);
      parsed.results.forEach((r: any, i: number) => {
        console.log(`  ${i + 1}. ${r.title}`);
        console.log(`     URL: ${r.url}`);
        if (r.score) {
          console.log(`     Score: ${r.score}`);
        }
      });
    }
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error instanceof Error ? error.message : String(error));
  }
}

validateImplementation().catch(console.error);
