module.exports = {
  testEnvironment: 'jsdom',
  roots: [
    '<rootDir>'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
    '^.+\\.jsx?$': 'babel-jest'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!axios)/'
  ],
  testPathIgnorePatterns: [
    '/node_modules/', 
    '/dist/', 
    '/tests/e2e/', 
    '/tests/performance.spec.ts',
    '/tests/chart-component.spec.js'
  ],
  collectCoverageFrom: [
    'app/**/*.{js,ts,tsx}',
    'components/**/*.{js,ts,tsx}',
    'lib/**/*.{js,ts,tsx}'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  maxWorkers: '50%',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  }
};
