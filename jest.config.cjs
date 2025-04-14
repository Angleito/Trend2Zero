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
};

module.exports = {
  projects: [
    // Frontend tests (React/Next.js)
    {
      ...commonConfig,
      displayName: 'frontend',
      testEnvironment: 'jest-environment-jsdom', // Use jsdom for frontend
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Frontend specific setup
      testMatch: [
        '<rootDir>/__tests__/**/*.test.[jt]s?(x)',
        '<rootDir>/app/**/*.test.[jt]s?(x)', // Include tests colocated with app components
        '<rootDir>/?(*.)+(spec|test).[jt]s?(x)' // Uncomment this line
      ],
      // Apply Next.js specific transforms
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      modulePaths: ['<rootDir>'],
      collectCoverageFrom: [
        '**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/.next/**',
        '!**/coverage/**',
        '!**/*.config.js',
        '!**/playwright/**'
      ],
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>/tsconfig.json'
        }
      }
    },
    // Backend tests (Node.js)
    {
      ...commonConfig,
      displayName: 'backend',
      testEnvironment: 'node', // Use node for backend
      // setupFilesAfterEnv: ['<rootDir>/backend/src/tests/setup.cjs'], // If backend needs specific setup after env
      testMatch: [
        '<rootDir>/backend/src/tests/**/*.test.js',
      ],
      // Backend doesn't usually need Next.js transforms
      transform: { // Add basic transform if needed (e.g., for modern JS syntax)
        '^.+\\.js$': 'babel-jest',
      },
      collectCoverageFrom: [
        '**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/.next/**',
        '!**/coverage/**',
        '!**/*.config.js',
        '!**/playwright/**'
      ],
    },
  ],
  // Optional: global settings applicable to all projects if needed
  // reporters: ['default'],
  // collectCoverage: true,
  // coverageDirectory: 'coverage',
  testTimeout: 15000, // Add global timeout (15 seconds)
};
