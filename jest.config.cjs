// Common configuration options
const commonConfig = {
  globalSetup: '<rootDir>/jest.globalSetup.js',
  globalTeardown: '<rootDir>/jest.globalTeardown.js',
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/styles/(.*)$': '<rootDir>/styles/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/context/(.*)$': '<rootDir>/context/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/playwright/',
    '<rootDir>/tests/.*'
  ],
  setupFiles: ['<rootDir>/jest.env.js'],
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'], 
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': ['babel-jest', { presets: ['next/babel'] }],
  },
};

module.exports = {
  // Global settings that apply to all projects
  bail: process.env.CI === 'true' ? 1 : 0,
  testTimeout: 30000,
  verbose: process.env.JEST_WORKER_ID === undefined,
  silent: process.env.JEST_WORKER_ID !== undefined,
  forceExit: true,
  detectOpenHandles: true,
  
  projects: [
    // Frontend tests (React/Next.js)
    {
      ...commonConfig,
      displayName: 'frontend',
      testEnvironment: 'jest-environment-jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testMatch: [
        '<rootDir>/__tests__/**/*.[jt]s?(x)',
        '<rootDir>/app/**/*.[jt]s?(x)',
        '<rootDir>/?(*.)+(spec|test).[jt]s?(x)'
      ],
      collectCoverageFrom: [
        '**/*.[jt]s?(x)',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/.next/**',
        '!**/coverage/**',
        '!**/*.config.[jt]s',
        '!**/playwright/**'
      ],
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>/tsconfig.json',
          useESM: true
        }
      }
    },
    // Backend tests
    {
      ...commonConfig,
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/backend/src/tests/**/*.[jt]s?(x)',
      ],
      collectCoverageFrom: [
        '**/*.[jt]s?(x)',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/.next/**',
        '!**/coverage/**',
        '!**/*.config.[jt]s',
        '!**/playwright/**'
      ],
    },
  ],
};
