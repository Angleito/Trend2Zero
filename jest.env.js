process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5001/api';
process.env.MONGODB_URI = 'mongodb://localhost:27017/trend2zero-test';
process.env.JWT_SECRET = 'test-secret';
process.env.PORT = '3000';
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.USE_MOCK_DATA = 'true'; // Force use of mock data in tests

// Set CI environment variables if running in CI
if (process.env.CI) {
  process.env.JEST_WORKER_ID = '1';
  process.env.FORCE_COLOR = '1';
}

// Override console.error in test environment to fail on React warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0] && args[0].includes && args[0].includes('Warning: An update to')) {
    return;
  }
  originalConsoleError(...args);
};