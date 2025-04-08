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

Please ensure your changes pass all tests:

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/example.spec.js
```

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
