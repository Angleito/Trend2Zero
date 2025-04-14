import path from 'path';
import fs from 'fs';

// Test directories configuration
export const testConfig = {
  // Base directories
  baseDir: process.cwd(),
  testResultsDir: path.join(process.cwd(), 'test-results'),

  // Server configuration
  server: {
    port: process.env.TEST_SERVER_PORT || '3001',
    get baseUrl() {
      return `http://localhost:${this.port}`;
    }
  },

  // MCP Configuration
  mcp: {
    url: process.env.MCP_SERVER_URL || 'http://localhost:8081',
    apiKey: process.env.MCP_API_KEY || '0fe62a35-b670-41e1-8120-aa8ac09d191c',
    client: 'vscode'
  },

  // Subdirectories
  get screenshotsDir() { return path.join(this.testResultsDir, 'screenshots'); },
  get logsDir() { return path.join(this.testResultsDir, 'logs'); },
  get videosDir() { return path.join(this.testResultsDir, 'videos'); },
  get reportsDir() { return path.join(this.testResultsDir, 'reports'); },
  get mcpLogsDir() { return path.join(this.logsDir, 'mcp'); },

  // Utility functions
  ensureDirs() {
    [
      this.testResultsDir,
      this.screenshotsDir,
      this.logsDir,
      this.videosDir,
      this.reportsDir,
      this.mcpLogsDir
    ].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  },

  getScreenshotPath(name: string) {
    return path.join(this.screenshotsDir, `${name}.png`);
  },

  getLogPath(name: string) {
    return path.join(this.logsDir, `${name}.log`);
  },

  getVideoPath(name: string) {
    return path.join(this.videosDir, `${name}.webm`);
  },

  getMcpLogPath(name: string) {
    return path.join(this.mcpLogsDir, `${name}.log`);
  }
};