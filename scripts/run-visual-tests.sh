#!/bin/bash

# Exit on first error
set -e

# Ensure the script is executable
chmod +x "$0"

# Run Playwright visual regression tests
echo "Running Playwright visual regression tests..."
npx playwright test tests/home-page-visual.spec.ts --update-snapshots

# Generate HTML report
echo "Generating test report..."
npx playwright show-report

# Optional: Open the report in default browser
echo "Opening test report..."
npx playwright show-report