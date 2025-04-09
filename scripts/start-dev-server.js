const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

function startDevServer() {
  return new Promise((resolve, reject) => {
    // Ensure logs directory exists
    const logDir = path.join(__dirname, '..', 'test-results', 'logs');
    fs.mkdirSync(logDir, { recursive: true });

    // Log file for server output
    const logPath = path.join(logDir, 'dev-server.log');
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });

    // Server process configuration
    const serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      env: { 
        ...process.env, 
        NODE_ENV: 'test',
        PORT: '3000' 
      }
    });

    // Pipe server output to log file
    serverProcess.stdout.pipe(logStream);
    serverProcess.stderr.pipe(logStream);

    // Log process details
    logStream.write(`[${new Date().toISOString()}] Dev server started. PID: ${serverProcess.pid}\n`);

    // Function to check server availability
    const checkServerAvailability = async (maxAttempts = 30) => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await axios.get('http://localhost:3000', {
            timeout: 5000,
            validateStatus: (status) => status >= 200 && status < 400
          });
          
          logStream.write(`[${new Date().toISOString()}] Server available after ${attempt} attempts\n`);
          return true;
        } catch (error) {
          if (attempt === maxAttempts) {
            logStream.write(`[${new Date().toISOString()}] Server failed to start after ${maxAttempts} attempts\n`);
            return false;
          }
          
          // Wait 1 second between attempts
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      return false;
    };

    // Handle server startup
    checkServerAvailability()
      .then(isAvailable => {
        if (isAvailable) {
          resolve({
            process: serverProcess,
            logPath: logPath
          });
        } else {
          serverProcess.kill();
          reject(new Error('Could not start development server'));
        }
      })
      .catch(error => {
        serverProcess.kill();
        reject(error);
      });

    // Ensure server is killed when parent process exits
    process.on('exit', () => {
      try {
        process.kill(-serverProcess.pid);
      } catch (killError) {
        console.error('Error killing dev server:', killError);
      }
    });
  });
}

// If script is run directly
if (require.main === module) {
  startDevServer()
    .then(({ process, logPath }) => {
      console.log(`Development server started. PID: ${process.pid}`);
      console.log(`Logs: ${logPath}`);
      console.log('Press Ctrl+C to stop');
    })
    .catch((error) => {
      console.error('Failed to start dev server:', error);
      process.exit(1);
    });
}

module.exports = startDevServer;