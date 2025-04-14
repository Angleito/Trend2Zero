module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',  // Add support for .js files
  },
  testMatch: ['**/__tests__/**/*.?(ts|js)', '**/?(*.)+(spec|test).?(ts|js)', 'src/tests/**/*.?(ts|js)'],
  moduleFileExtensions: ['ts', 'js', 'json'],
};
