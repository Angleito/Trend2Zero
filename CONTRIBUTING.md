# Contributing to Trend2Zero

Thank you for your interest in contributing to Trend2Zero! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:
- A clear, descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details (browser, OS, etc.)

### Suggesting Enhancements

We welcome suggestions for enhancements! Please create an issue with:
- A clear, descriptive title
- A detailed description of the enhancement
- Any relevant mockups or examples
- Why this enhancement would be useful

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Run tests to ensure your changes don't break existing functionality
5. Commit your changes (`git commit -m 'Add some feature'`)
6. Push to the branch (`git push origin feature/your-feature-name`)
7. Open a Pull Request

## Development Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env.local` file based on `.env.example`
4. Start the development server with `npm run dev`

## Testing

We follow a comprehensive testing approach with unit, integration, and end-to-end tests. Please ensure your changes pass all tests before submitting a pull request.

### Frontend Testing

```bash
# Run Jest unit/integration tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

### Backend Testing

```bash
# Navigate to backend directory
cd backend

# Run Jest tests
npm test

# Run tests with coverage
npm run test:coverage
```

### End-to-End Testing

```bash
# Run Playwright tests
npm run test:e2e

# Run specific test file
npx playwright test tests/example.spec.js

# Run tests with UI mode for debugging
npx playwright test --ui
```

### Testing Guidelines

1. **Write tests first**: Follow Test-Driven Development (TDD) principles when possible
2. **Maintain coverage**: Aim for at least 70% code coverage for new features
3. **Test edge cases**: Include tests for error conditions and edge cases
4. **Keep tests fast**: Unit tests should be quick to run
5. **Isolate tests**: Tests should not depend on each other

## Coding Standards

- Follow the existing code style
- Write clear, descriptive commit messages
- Add comments for complex logic
- Update documentation as needed

## Security

- Do not commit API keys or sensitive information
- Use environment variables for configuration
- Report security vulnerabilities privately

Thank you for contributing to Trend2Zero!
