#!/usr/bin/env zsh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Function to print section headers
print_header() {
    print -P "\n${BOLD}$1${NC}"
    print -P "=================================="
}

# Function to check if a command exists
command_exists() {
    (( $+commands[$1] ))
}

# Function to generate test template
generate_test_template() {
    local file_path=$1
    local file_name=${file_path:t}
    local test_name="${file_name:r}.test.js"
    local test_dir="src/tests/${${file_path#src/}:h}"
    
    # Create test directory if it doesn't exist
    mkdir -p "$test_dir"
    
    # Generate test file if it doesn't exist
    if [[ ! -f "$test_dir/$test_name" ]]; then
        cat > "$test_dir/$test_name" <<EOL
const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
// Import the module to test
const { /* TODO: Import required functions/classes */ } = require('../../${file_path#src/}');

describe('${file_name:r}', () => {
    beforeEach(() => {
        // TODO: Setup test environment
    });

    afterEach(() => {
        // TODO: Cleanup test environment
    });

    test('should handle successful operation', () => {
        // TODO: Implement test
    });

    test('should handle error cases', () => {
        // TODO: Implement test
    });

    test('should validate input', () => {
        // TODO: Implement test
    });
});
EOL
        print -P "${GREEN}Created test template:${NC} $test_dir/$test_name"
    else
        print -P "${YELLOW}Test file already exists:${NC} $test_dir/$test_name"
    fi
}

# Check for required tools
print_header "Checking required tools"

required_tools=(node npm jest)
missing_tools=()

for tool in $required_tools; do
    if ! command_exists $tool; then
        missing_tools+=$tool
    fi
done

if (( $#missing_tools )); then
    print -P "${RED}Error: Missing required tools: ${(j:, :)missing_tools}${NC}"
    exit 1
fi

# Run coverage diagnosis
print_header "Running coverage diagnosis"
node scripts/diagnose-test-coverage.js

# Check if coverage report exists
if [[ ! -f "TEST_COVERAGE_REPORT.md" ]]; then
    print -P "${RED}Error: Coverage report not found${NC}"
    exit 1
fi

# Extract files needing coverage from the report
print_header "Analyzing coverage report"
files_needing_coverage=$(grep -A 1 "^### " TEST_COVERAGE_REPORT.md | grep "^- Lines:" | cut -d' ' -f3-)

if [[ -z "$files_needing_coverage" ]]; then
    print -P "${GREEN}No files identified as needing additional coverage${NC}"
    exit 0
fi

# Process each file needing coverage
print_header "Generating test templates"
print -P "The following files need additional test coverage:"
echo "$files_needing_coverage" | while read -r file; do
    if [[ -f "$file" ]]; then
        print -P "\n${YELLOW}Processing:${NC} $file"
        generate_test_template "$file"
    fi
done

# Provide next steps
print_header "Next steps"
print -P "1. Review the generated test templates in ${BOLD}src/tests/${NC}"
print -P "2. Implement the TODO sections in each test file"
print -P "3. Run ${BOLD}npm test${NC} to verify your changes"
print -P "4. Run this script again to check coverage improvements"

print_header "Additional resources"
print -P "- Jest documentation: ${BOLD}https://jestjs.io/docs/getting-started${NC}"
print -P "- Testing best practices: ${BOLD}backend/TEST_COVERAGE_STRATEGY.md${NC}"
print -P "- Project test guidelines: ${BOLD}backend/TEST_COVERAGE_README.md${NC}"