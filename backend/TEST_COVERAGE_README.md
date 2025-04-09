# Backend Test Coverage Guide

## Overview

This guide explains how to work with the test coverage tools and maintain high-quality tests in the Trend2Zero backend.

## Quick Start

```bash
# Run tests with coverage
npm run test:coverage

# Analyze test coverage and get improvement suggestions
npm run test:diagnose

# Generate test templates for uncovered code
npm run test:improve

# Run tests in CI environment
npm run test:ci
```

## Test Coverage Tools

### 1. Coverage Diagnosis (`test:diagnose`)

The diagnosis tool analyzes test coverage and provides:
- Overall coverage metrics
- Per-directory coverage breakdown
- List of uncovered code sections
- Specific recommendations for improvement

Output is saved to `TEST_COVERAGE_REPORT.md` for tracking and review.

### 2. Coverage Improvement (`test:improve`)

This tool helps you:
- Generate test templates for uncovered code
- Set up proper test structure
- Include common test patterns
- Follow project testing standards

### 3. CI Integration (`test:ci`)

Configured for continuous integration with:
- JUnit report generation
- Coverage thresholds enforcement
- Parallel test execution
- Comprehensive error reporting

## Testing Standards

### 1. Test Structure

```javascript
describe('ComponentName', () => {
    // Setup/teardown
    beforeEach(() => {
        // Initialize test environment
    });

    afterEach(() => {
        // Clean up test environment
    });

    // Test cases
    test('should handle successful operation', () => {
        // Arrange
        // Act
        // Assert
    });

    test('should handle error cases', () => {
        // Error handling tests
    });
});
```

### 2. Coverage Requirements

- **Controllers**: 80% coverage
- **Services**: 85% coverage
- **Models**: 75% coverage
- **Overall**: Minimum 70% coverage

### 3. Best Practices

1. **Test Organization**
   - Group related tests using `describe` blocks
   - Use clear, descriptive test names
   - Follow the Arrange-Act-Assert pattern

2. **Mocking**
   - Mock external dependencies
   - Use Jest's mock functions for callbacks
   - Implement custom mock factories for complex objects

3. **Error Handling**
   - Test both success and error paths
   - Verify error messages and types
   - Test edge cases and boundary conditions

4. **Async Testing**
   - Use async/await for asynchronous tests
   - Test timeouts and race conditions
   - Handle promise rejections properly

### 4. Common Patterns

1. **API Endpoint Testing**
```javascript
describe('POST /api/resource', () => {
    test('should create resource with valid data', async () => {
        const response = await request(app)
            .post('/api/resource')
            .send(validData);
        expect(response.status).toBe(201);
    });

    test('should return 400 with invalid data', async () => {
        const response = await request(app)
            .post('/api/resource')
            .send(invalidData);
        expect(response.status).toBe(400);
    });
});
```

2. **Service Layer Testing**
```javascript
describe('ResourceService', () => {
    test('should process data correctly', async () => {
        const result = await resourceService.process(data);
        expect(result).toMatchObject(expectedOutput);
    });

    test('should handle processing errors', async () => {
        await expect(
            resourceService.process(invalidData)
        ).rejects.toThrow('Invalid data');
    });
});
```

3. **Model Testing**
```javascript
describe('UserModel', () => {
    test('should validate required fields', () => {
        const user = new User({});
        const validationError = user.validateSync();
        expect(validationError.errors.email).toBeDefined();
    });

    test('should hash password before save', async () => {
        const user = new User(validUserData);
        await user.save();
        expect(user.password).not.toBe(validUserData.password);
    });
});
```

## Troubleshooting

### Common Issues

1. **Timeouts in Async Tests**
   - Increase timeout using `jest.setTimeout()`
   - Check for unresolved promises
   - Verify async cleanup in `afterEach`

2. **Memory Leaks**
   - Close database connections
   - Clear cached instances
   - Reset mocks between tests

3. **Flaky Tests**
   - Use stable test data
   - Avoid time-dependent tests
   - Clean up test environment properly

### Performance Tips

1. **Optimize Test Execution**
   - Use `--runInBand` for CPU-intensive tests
   - Implement proper test isolation
   - Minimize setup/teardown overhead

2. **Reduce Test Time**
   - Group related tests
   - Use shared setup when appropriate
   - Implement efficient mocking strategies

## Contributing

1. Write tests for new features
2. Update tests when modifying existing code
3. Run coverage analysis before submitting PRs
4. Address coverage gaps identified by tools
5. Follow the testing standards outlined above

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [MongoDB Testing Guide](https://docs.mongodb.com/drivers/node/current/fundamentals/testing/)