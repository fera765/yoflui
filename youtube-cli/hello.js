// hello.js - A simple function that returns a greeting

function hello(name) {
  if (name) {
    return `Hello, ${name}!`;
  } else {
    return "Hello, World!";
  }
}

// Export the function so it can be used in other files
module.exports = { hello };