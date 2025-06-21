const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function startDevServerWithFixedWatchpack() {
  // Set environment variables to prevent OrbStack scanning
  const env = {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '3000',
    NEXT_TELEMETRY_DISABLED: '1',
    WATCHPACK_POLLING: 'true',
    CHOKIDAR_USEPOOLING: 'true',
    // Ignore OrbStack completely at the environment level
    CHOKIDAR_IGNORE_PATTERNS: '/Users/angel/OrbStack,/Users/angel/.orbstack,**/OrbStack/**,**/.orbstack/**',
  };

  console.log('Starting Next.js development server with OrbStack fixes...');
  
  const server = spawn('npx', ['next', 'dev'], {
    stdio: 'inherit',
    env: env,
    cwd: path.join(__dirname, '..'),
  });

  server.on('error', (error) => {
    console.error('Server failed to start:', error);
    process.exit(1);
  });

  server.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down server...');
    server.kill('SIGTERM');
  });

  return server;
}

if (require.main === module) {
  startDevServerWithFixedWatchpack();
}

module.exports = startDevServerWithFixedWatchpack;