#!/usr/bin/env npx tsx

/**
 * Interactive FLUI Quality Testing Script
 * Tests FLUI with predefined queries and analyzes response quality
 */

import { spawn } from 'child_process';
import { writeFileSync, appendFileSync } from 'fs';

interface TestCase {
	id: string;
	query: string;
	category: string;
	expectedBehavior: string[];
}

const testCases: TestCase[] = [
	{
		id: 'test1',
		query: 'Resultado Corinthians ontem',
		category: 'Eventos Esportivos',
		expectedBehavior: [
			'Deve chamar tool de web search',
			'Deve retornar resultado do jogo',
			'Deve incluir placar',
			'Deve incluir data do jogo',
			'Deve ter estrutura organizada'
		]
	},
	{
		id: 'test2',
		query: '?ltimas not?cias sobre IA hoje',
		category: 'Not?cias Atuais',
		expectedBehavior: [
			'Deve buscar not?cias recentes',
			'Deve resumir principais t?picos',
			'Deve incluir contexto',
			'Deve ser conciso'
		]
	},
	{
		id: 'test3',
		query: 'Clima em S?o Paulo agora',
		category: 'Clima/Previs?o',
		expectedBehavior: [
			'Deve consultar dados de clima',
			'Deve incluir temperatura',
			'Deve incluir condi??es',
			'Deve ser atual'
		]
	},
	{
		id: 'test4',
		query: 'Cota??o d?lar hoje',
		category: 'Informa??es Financeiras',
		expectedBehavior: [
			'Deve buscar cota??o atual',
			'Deve incluir valor',
			'Deve incluir varia??o',
			'Deve incluir contexto'
		]
	},
	{
		id: 'test5',
		query: 'O que est? acontecendo no Brasil agora',
		category: 'Pesquisa Contextual',
		expectedBehavior: [
			'Deve buscar not?cias atuais',
			'Deve priorizar relev?ncia',
			'Deve resumir m?ltiplas fontes',
			'Deve ser abrangente mas conciso'
		]
	}
];

console.log('????????????????????????????????????????????????????????????????');
console.log('?                                                              ?');
console.log('?        ?? FLUI QUALITY TESTING - Interactive Mode ??         ?');
console.log('?                                                              ?');
console.log('????????????????????????????????????????????????????????????????\n');

console.log('?? Test Cases Prepared:\n');
testCases.forEach((tc, idx) => {
	console.log(`${idx + 1}. [${tc.category}] "${tc.query}"`);
	console.log(`   Expected behaviors:`);
	tc.expectedBehavior.forEach(behavior => {
		console.log(`   ? ${behavior}`);
	});
	console.log('');
});

console.log('\n??  MANUAL TESTING INSTRUCTIONS:');
console.log('????????????????????????????????????????????????????????????\n');

console.log('1. Open a NEW terminal window');
console.log('2. Navigate to: /workspace/youtube-cli');
console.log('3. Run: npm start');
console.log('4. For each test case above, type the query');
console.log('5. Observe and document:');
console.log('   ? Is web search tool called?');
console.log('   ? Is response structured?');
console.log('   ? Is response concise?');
console.log('   ? Are emojis used?');
console.log('   ? Is information accurate?');
console.log('6. Take notes on quality issues');
console.log('7. Come back here with findings\n');

console.log('????????????????????????????????????????????????????????????\n');

console.log('?? After testing, document findings in:');
console.log('   /workspace/FLUI_TEST_RESULTS.md\n');

console.log('??  Template for results:\n');

const template = `
# FLUI Quality Test Results

## Test 1: ${testCases[0].query}
**Category:** ${testCases[0].category}

### Observed Behavior:
- [ ] Web search tool called: YES/NO
- [ ] Response structured: YES/NO
- [ ] Information accurate: YES/NO
- [ ] Concise and clear: YES/NO
- [ ] Used emojis: YES/NO

### Quality Score: _/10

### Actual Response:
\`\`\`
[Paste actual response here]
\`\`\`

### Issues Identified:
- Issue 1: ...
- Issue 2: ...

### Suggestions for Improvement:
- Suggestion 1: ...
- Suggestion 2: ...

---

[Repeat for each test case...]

## Summary
- Tests passed: _/5
- Average quality score: _/10
- Critical issues: _
- Priority improvements: _
`;

writeFileSync('/workspace/FLUI_TEST_RESULTS_TEMPLATE.md', template);

console.log('? Template created at: /workspace/FLUI_TEST_RESULTS_TEMPLATE.md\n');

console.log('?? Ready to start testing!');
console.log('   Run: npm start (in youtube-cli directory)\n');
