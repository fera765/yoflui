/**
 * A simple function that returns a greeting message
 * @param {string} name - The name to greet
 * @returns {string} - The greeting message
 */
function hello(name) {
  if (typeof name !== 'string' || name.trim() === '') {
    return 'Hello, World!';
  }
  return `Hello, ${name}!`;
}

// Export the function for use in other modules
module.exports = { hello };

// If this file is run directly, demonstrate the function
if (require.main === module) {
  console.log(hello('World'));
  console.log(hello('Node.js'));
}