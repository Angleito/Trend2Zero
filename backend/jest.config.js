module.exports = {
  // Basic Jest configuration
  testEnvironment: 'node',
  verbose: true,
  rootDir: '.',
  roots: ['<rootDir>/src'],

  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],

  // Module name mapper for aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
    'node_modules/mongodb.*\\.ts$': '<rootDir>/src/tests/transformers/mongodbTransformer.js'
  },

  // Configure how to transform node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(mongodb|mongoose|@babel/runtime|@babel/runtime-corejs3)/)'
  ],

  // Test path patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)'
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Setup and teardown configuration
  globalSetup: '<rootDir>/src/tests/setup.js',
  globalTeardown: '<rootDir>/src/tests/teardown.js',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],

  // Test environment configuration
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },

  // Global configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      diagnostics: false
    }
  },

  // Performance and optimization
  maxWorkers: '50%',
  bail: 0,
  verbose: true,

  // Error handling and reporting
  errorOnDeprecated: true,

  // Reporters configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'reports/junit',
      outputName: 'js-test-results.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,

  // Timeout configuration
  testTimeout: 10000
};
