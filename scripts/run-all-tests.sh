#!/usr/bin/env zsh

# Script to run all tests in the project
# Usage: ./scripts/run-all-tests.sh

setopt ERR_EXIT # Exit immediately if a command exits with a non-zero status

echo "🧪 Running all tests for Trend2Zero project..."

# Run frontend tests
echo "📱 Running frontend tests..."
npm run test:ci

# Run backend tests
echo "🖥️ Running backend tests..."
cd backend
npm run test:ci
cd ..

# Run end-to-end tests
echo "🔄 Running end-to-end tests..."
npm run test:e2e

echo "✅ All tests completed successfully!"
