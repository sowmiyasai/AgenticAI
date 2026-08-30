const { spawn } = require('child_process');
const path = require('path');

console.log('===========================================================');
console.log('🚀 Starting Agentflow_AI Full-Stack Development Platform...');
console.log('===========================================================');

const serverCwd = path.join(__dirname, 'server');
const clientCwd = path.join(__dirname, 'client');

// Start Express Backend on Port 5000
const serverProcess = spawn('node', ['src/server.js'], {
  cwd: serverCwd,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

// Start Next.js Frontend on Port 3000
const clientProcess = spawn('node', ['node_modules/next/dist/bin/next', 'dev', '-p', '3000'], {
  cwd: clientCwd,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

function cleanup() {
  console.log('\nGracefully shutting down Agentflow_AI processes...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
