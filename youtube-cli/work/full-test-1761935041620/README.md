# Hello Project

A simple Node.js project that demonstrates a basic greeting function.

## Overview

This project contains a `hello` function that returns a personalized greeting message. It's designed as a simple example of a Node.js module with tests.

## Files

- `hello.js` - Contains the main `hello(name)` function
- `test.js` - Tests for the hello function
- `package.json` - Project metadata and dependencies

## Usage

To run the hello function directly:
```bash
node hello.js
```

To run the tests:
```bash
node test.js
```

Or using npm:
```bash
npm test
```

## Function API

The `hello(name)` function:
- Takes a name as a parameter
- Returns "Hello, {name}!" if a valid name is provided
- Returns "Hello, World!" if no name or an empty name is provided

## Example

```javascript
const { hello } = require('./hello.js');
console.log(hello('World')); // Output: "Hello, World!"
console.log(hello('JavaScript')); // Output: "Hello, JavaScript!"
```