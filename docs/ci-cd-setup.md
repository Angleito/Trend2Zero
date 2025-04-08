# CI/CD Setup for Trend2Zero

This document describes the Continuous Integration and Continuous Deployment (CI/CD) setup for the Trend2Zero project.

## Overview

Our CI/CD pipeline is implemented using GitHub Actions and is designed to ensure code quality, run tests, and automate deployments. The pipeline is triggered on:

- Every push to the `main` and `develop` branches
- Every pull request to these branches

## Pipeline Stages

### 1. Lint and Test

This stage runs linting and testing for both frontend and backend:

- **Linting**: Ensures code quality and consistency
- **Unit Tests**: Runs Jest tests for both frontend and backend
- **Integration Tests**: Verifies component interactions
- **End-to-End Tests**: Runs Playwright tests to verify application functionality

### 2. Build

This stage creates production-ready builds:

- Builds the Next.js frontend application
- Uploads build artifacts for potential deployment

### 3. Deployment (When Configured)

This stage is commented out by default and can be configured to deploy to various environments:

- **Staging**: Automatically deploys to staging environment from the `develop` branch
- **Production**: Automatically deploys to production environment from the `main` branch

## Configuration Files

- `.github/workflows/main.yml`: Main workflow configuration
- `jest.config.js`: Jest configuration for frontend tests
- `backend/jest.config.js`: Jest configuration for backend tests
- `playwright.config.js`: Playwright configuration for E2E tests

## Test Coverage Requirements

We maintain high test coverage requirements to ensure code quality:

- **Branches**: 70% minimum coverage
- **Functions**: 70% minimum coverage
- **Lines**: 70% minimum coverage
- **Statements**: 70% minimum coverage

## Local Testing

Before pushing changes, you can run tests locally:

```bash
# Run all tests
npm run run-all-tests

# Run specific test types
npm test                # Frontend unit tests
npm run test:coverage   # Frontend tests with coverage
npm run test:e2e        # End-to-end tests
cd backend && npm test  # Backend tests
```

## Pre-commit Hooks

We use Husky to run pre-commit hooks that:

- Run linting
- Run frontend tests
- Run backend tests (if backend files have changed)

This ensures that only code that passes tests can be committed.

## Troubleshooting

If the CI/CD pipeline fails, check the following:

1. **Linting Errors**: Run `npm run lint` locally to identify and fix issues
2. **Test Failures**: Run tests locally to reproduce and fix failures
3. **Environment Issues**: Ensure environment variables are correctly set in GitHub Secrets

## Adding New Tests

When adding new features, follow these guidelines:

1. Write tests before implementing features (TDD approach)
2. Ensure tests cover both happy path and error scenarios
3. Keep tests independent and idempotent
4. Maintain the required coverage thresholds
