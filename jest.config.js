import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import nextJest from 'next/jest.js'; // Add .js extension for proper ESM resolution

const createJestConfig = nextJest({
    dir: './',
});

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    modulePaths: ['<rootDir>'],
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/playwright/'],
    moduleNameMapper: {
        '^@/components/(.*)$': '<rootDir>/components/$1',
        '^@/pages/(.*)$': '<rootDir>/pages/$1',
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
        '^@/styles/(.*)$': '<rootDir>/styles/$1',
        '^@/context/(.*)$': '<rootDir>/context/$1',
        '^@/utils/(.*)$': '<rootDir>/utils/$1'
    },
    testMatch: [
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)' // Uncomment this line
    ],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
    },
    transformIgnorePatterns: [
        '/node_modules/',
        '^.+\\.module\\.(css|sass|scss)$',
    ],
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
};

export default createJestConfig(customJestConfig);
