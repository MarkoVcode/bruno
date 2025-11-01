#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

// Get platform argument
const platform = process.argv[2];

if (!platform) {
  console.error('Usage: node build-brunon-release.js <platform>');
  console.error('Platforms: linux, mac, win, deb, rpm, snap');
  process.exit(1);
}

// Determine which script to run based on OS
const isWindows = os.platform() === 'win32';
const scriptFile = isWindows ? 'build-brunon-release.bat' : 'build-brunon-release.sh';
const scriptPath = path.join(__dirname, scriptFile);

// Build command with any additional arguments
const additionalArgs = process.argv.slice(3).join(' ');
const command = isWindows
  ? `"${scriptPath}" ${platform} ${additionalArgs}`
  : `"${scriptPath}" ${platform} ${additionalArgs}`;

console.log(`Running: ${command}`);

try {
  execSync(command, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: { ...process.env }
  });
} catch (error) {
  process.exit(error.status || 1);
}
