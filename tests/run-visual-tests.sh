#!/bin/bash

# Create directories for test results if they don't exist
mkdir -p test-results/responsive
mkdir -p test-results/visual
mkdir -p test-results/performance

# Run all tests and generate HTML report
echo "Running Playwright tests..."
npx playwright test

# Show the report
echo "Tests completed. Opening HTML report..."
npx playwright show-report

echo "Test results and screenshots are available in the test-results directory."