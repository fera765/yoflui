import { validateFilePath, validateDirectoryPath, validateShellCommand } from './source/security/security.js';

console.log('?? Testing Security Validations\n');

// Test blocked file paths
console.log('=== File Path Tests ===');
const fileTests = [
	{ path: 'node_modules/package/index.js', shouldBlock: true },
	{ path: 'vendor/composer.json', shouldBlock: true },
	{ path: '.git/config', shouldBlock: true },
	{ path: 'src/index.ts', shouldBlock: false },
	{ path: '../outside.txt', shouldBlock: true },
	{ path: '/etc/passwd', shouldBlock: true },
	{ path: 'package-lock.json', shouldBlock: true },
	{ path: '.env', shouldBlock: true },
];

fileTests.forEach(test => {
	const result = validateFilePath(test.path);
	const passed = (result.valid === !test.shouldBlock);
	console.log(`${passed ? '?' : '?'} ${test.path}: ${result.valid ? 'ALLOWED' : `BLOCKED - ${result.error}`}`);
});

// Test blocked directory paths
console.log('\n=== Directory Path Tests ===');
const dirTests = [
	{ path: 'node_modules', shouldBlock: true },
	{ path: 'vendor', shouldBlock: true },
	{ path: '.git', shouldBlock: true },
	{ path: 'src', shouldBlock: false },
	{ path: '../parent', shouldBlock: true },
];

dirTests.forEach(test => {
	const result = validateDirectoryPath(test.path);
	const passed = (result.valid === !test.shouldBlock);
	console.log(`${passed ? '?' : '?'} ${test.path}: ${result.valid ? 'ALLOWED' : `BLOCKED - ${result.error}`}`);
});

// Test dangerous shell commands
console.log('\n=== Shell Command Tests ===');
const shellTests = [
	{ cmd: 'rm -rf /', shouldBlock: true },
	{ cmd: 'rm -rf ..', shouldBlock: true },
	{ cmd: 'rm -rf ~', shouldBlock: true },
	{ cmd: 'format /dev/sda', shouldBlock: true },
	{ cmd: 'shutdown -h now', shouldBlock: true },
	{ cmd: 'ls -la', shouldBlock: false },
	{ cmd: 'cat file.txt', shouldBlock: false },
	{ cmd: 'cd ..', shouldBlock: true },
	{ cmd: 'cd /home', shouldBlock: true },
	{ cmd: 'echo "test"', shouldBlock: false },
];

shellTests.forEach(test => {
	const result = validateShellCommand(test.cmd);
	const passed = (result.valid === !test.shouldBlock);
	console.log(`${passed ? '?' : '?'} "${test.cmd}": ${result.valid ? 'ALLOWED' : `BLOCKED - ${result.error}`}`);
});

console.log('\n? Security validation tests completed!');
