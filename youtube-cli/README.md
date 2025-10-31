# Hello World Node.js Project

A simple Node.js project that demonstrates a basic function and testing.

## Overview

This project contains a simple `hello` function that returns a greeting message. It also includes tests to verify the function works correctly.

## Files

- `hello.js` - Contains the hello function
- `test.js` - Tests for the hello function
- `package.json` - Project metadata and dependencies

## Usage

To run the tests:
```bash
npm test
```

To run the hello script directly:
```bash
node hello.js
```

## Function

The `hello(name)` function:
- Takes an optional name parameter
- Returns "Hello, [name]!" if a name is provided
- Returns "Hello, World!" if no name is provided

## Example

```javascript
const { hello } = require('./hello.js');
console.log(hello("John")); // Output: "Hello, John!"
console.log(hello()); // Output: "Hello, World!"
```