// Simple test file for the hello function
const { hello } = require('./hello.js');

console.log('Testing the hello function...\n');

// Test cases
const testCases = [
  { input: 'World', expected: 'Hello, World!' },
  { input: 'Node.js', expected: 'Hello, Node.js!' },
  { input: 'JavaScript', expected: 'Hello, JavaScript!' },
  { input: '', expected: 'Hello, World!' },
  { input: null, expected: 'Hello, World!' },
  { input: '   ', expected: 'Hello, World!' }
];

let passedTests = 0;
let totalTests = testCases.length;

for (let i = 0; i < testCases.length; i++) {
  const testCase = testCases[i];
  let result;
  
  // Handle case where input might be null
  if (testCase.input === null) {
    result = hello();
  } else {
    result = hello(testCase.input);
  }
  
  const passed = result === testCase.expected;
  
  console.log(`Test ${i + 1}: ${passed ? 'PASS' : 'FAIL'}`);
  console.log(`  Input: ${testCase.input === null ? 'undefined' : `'${testCase.input}'`}`);
  console.log(`  Expected: '${testCase.expected}'`);
  console.log(`  Got: '${result}'`);
  console.log('');
  
  if (passed) {
    passedTests++;
  }
}

console.log(`\nResults: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('All tests passed! ✓');
} else {
  console.log(`${totalTests - passedTests} test(s) failed! ✗`);
  process.exit(1); // Exit with error code if tests failed
}