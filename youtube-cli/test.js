// test.js - Test file for the hello function

const { hello } = require('./hello.js');

// Test cases
console.log('Testing hello function:');
console.log('hello("John"):', hello("John"));
console.log('hello("Jane"):', hello("Jane"));
console.log('hello():', hello());
console.log('hello(""):', hello(""));

// Simple assertion function for testing
function assert(actual, expected, message) {
  if (actual === expected) {
    console.log(`✓ ${message}`);
  } else {
    console.log(`✗ ${message} - Expected: ${expected}, Got: ${actual}`);
  }
}

// Run tests
assert(hello("John"), "Hello, John!", "Should return 'Hello, John!' when name is 'John'");
assert(hello("World"), "Hello, World!", "Should return 'Hello, World!' when name is 'World'");
assert(hello(), "Hello, World!", "Should return 'Hello, World!' when no name is provided");
assert(hello(""), "Hello, !", "Should return 'Hello, !' when name is empty string");

console.log("\nAll tests completed!");