# Trend2Zero Backend Testing Guide

## Test Configuration

This backend uses Jest for testing, with a focus on robust and comprehensive test coverage.

### Test Types
- Unit Tests
- Integration Tests
- Service Tests

### Prerequisites
- Node.js 18.0.0 or higher
- MongoDB (local or in-memory for testing)

### Setup

1. Install Dependencies
```bash
npm install
```

2. Environment Configuration
- Copy `.env.example` to `.env`
- Create `.env.test` for test-specific configurations

### Running Tests

#### All Tests
```bash
npm test
```

#### Watch Mode (Development)
```bash
npm run test:watch
```

#### Coverage Report
```bash
npm run test:coverage
```

#### Continuous Integration
```bash
npm run test:ci
```

### Test Configuration Details

#### Test Environment
- Uses `mongodb-memory-server` for isolated database testing
- Generates comprehensive logs in `test-logs/`
- Provides coverage reports

#### Logging
Logs are generated in `test-logs/`:
- `combined.log`: All test logs
- `error.log`: Error-specific logs
- `teardown-error.log`: Teardown process errors

### Best Practices
- Write tests for all new features
- Aim for >70% code coverage
- Use meaningful test descriptions
- Mock external dependencies

### Troubleshooting
- Ensure MongoDB is installed
- Check Node.js version compatibility
- Review test logs for detailed error information

### Coverage Thresholds
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## Contributing
Please follow the project's testing guidelines when adding new tests.
