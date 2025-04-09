#!/bin/bash

# Run all tests for the Trend2Zero project

# Set environment variables for testing
export NODE_ENV=test
export MONGODB_URI_TEST=mongodb://localhost:27017/trend2zero_test
export JWT_SECRET=test-secret-key
export JWT_EXPIRES_IN=90d
export JWT_COOKIE_EXPIRES_IN=90

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Trend2Zero test suite...${NC}"

# Function to run tests and check result
run_test() {
  echo -e "${YELLOW}Running $1...${NC}"
  $2
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $1 passed${NC}"
    return 0
  else
    echo -e "${RED}✗ $1 failed${NC}"
    return 1
  fi
}

# Create test results directory
mkdir -p test-results

# Start MongoDB for testing if not already running
if ! pgrep -x "mongod" > /dev/null; then
  echo -e "${YELLOW}Starting MongoDB...${NC}"
  mongod --dbpath ./data/db --fork --logpath ./data/mongod.log
  sleep 2
fi

# Run backend unit tests
run_test "Backend Unit Tests" "cd backend && npm test"
BACKEND_UNIT_RESULT=$?

# Run backend integration tests
run_test "Backend Integration Tests" "cd backend && npm run test:integration"
BACKEND_INTEGRATION_RESULT=$?

# Run frontend unit tests
run_test "Frontend Unit Tests" "npm test"
FRONTEND_UNIT_RESULT=$?

# Run end-to-end tests
run_test "End-to-End Tests" "npm run test:e2e"
E2E_RESULT=$?

# Print summary
echo -e "\n${YELLOW}Test Summary:${NC}"
if [ $BACKEND_UNIT_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ Backend Unit Tests: PASSED${NC}"
else
  echo -e "${RED}✗ Backend Unit Tests: FAILED${NC}"
fi

if [ $BACKEND_INTEGRATION_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ Backend Integration Tests: PASSED${NC}"
else
  echo -e "${RED}✗ Backend Integration Tests: FAILED${NC}"
fi

if [ $FRONTEND_UNIT_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ Frontend Unit Tests: PASSED${NC}"
else
  echo -e "${RED}✗ Frontend Unit Tests: FAILED${NC}"
fi

if [ $E2E_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ End-to-End Tests: PASSED${NC}"
else
  echo -e "${RED}✗ End-to-End Tests: FAILED${NC}"
fi

# Overall result
if [ $BACKEND_UNIT_RESULT -eq 0 ] && [ $BACKEND_INTEGRATION_RESULT -eq 0 ] && [ $FRONTEND_UNIT_RESULT -eq 0 ] && [ $E2E_RESULT -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "\n${RED}Some tests failed. Please check the logs for details.${NC}"
  exit 1
fi
