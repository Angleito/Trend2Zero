#!/bin/bash

# Comprehensive Test Runner for Trend2Zero

# Exit on first error
set -e

# Timestamp for logging
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
LOG_DIR="$BASE_DIR/test-results/logs"
REPORT_DIR="$BASE_DIR/test-results/reports"

# Create necessary directories
mkdir -p "$LOG_DIR"
mkdir -p "$REPORT_DIR"

# Log file for this test run
FULL_LOG_FILE="$LOG_DIR/full_test_run_$TIMESTAMP.log"

# Color codes for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    local level="$1"
    local message="$2"
    local color=""

    case "$level" in
        "ERROR")   color="$RED" ;;
        "SUCCESS") color="$GREEN" ;;
        "WARN")    color="$YELLOW" ;;
        *)         color="$NC" ;;
    esac

    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] ${color}[$level]${NC} $message" | tee -a "$FULL_LOG_FILE"
}

# Function to cleanup processes
cleanup() {
    log "WARN" "Cleaning up test environment"
    
    # Kill any running dev server or test-related processes
    pkill -f "next dev" || true
    pkill -f "node scripts/start-dev-server.js" || true
    pkill -f "playwright" || true
}

# Trap signals to ensure cleanup
trap cleanup EXIT SIGINT SIGTERM ERR

# Validate required tools
validate_dependencies() {
    local missing_deps=()
    
    # Check for required commands
    for cmd in npm node npx; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log "ERROR" "Missing dependencies: ${missing_deps[*]}"
        exit 1
    fi
}

# Main test execution function
run_tests() {
    # Start development server
    log "INFO" "Starting development server"
    node "$BASE_DIR/scripts/start-dev-server.js" >> "$FULL_LOG_FILE" 2>&1 &
    DEV_SERVER_PID=$!

    # Wait for server to start
    sleep 10

    # Run unit tests
    log "INFO" "Running Jest Unit Tests"
    if npm run test:coverage 2>&1 | tee -a "$FULL_LOG_FILE"; then
        log "SUCCESS" "Unit tests completed successfully"
    else
        log "ERROR" "Unit tests failed"
        exit 1
    fi

    # Run E2E tests
    log "INFO" "Running Playwright End-to-End Tests"
    if npm run test:e2e 2>&1 | tee -a "$FULL_LOG_FILE"; then
        log "SUCCESS" "E2E tests completed successfully"
    else
        log "ERROR" "E2E tests failed"
        exit 1
    fi

    # Analyze MCP logs
    log "INFO" "Analyzing MCP Server Logs"
    if npm run test:mcp:logs 2>&1 | tee -a "$FULL_LOG_FILE"; then
        log "SUCCESS" "MCP log analysis completed"
    else
        log "WARN" "MCP log analysis encountered issues"
    fi

    # Generate comprehensive test report
    log "INFO" "Generating Test Report"
    if node "$BASE_DIR/scripts/generate-test-report.js" "$TIMESTAMP" 2>&1 | tee -a "$FULL_LOG_FILE"; then
        log "SUCCESS" "Test report generated successfully"
    else
        log "WARN" "Test report generation encountered issues"
    fi
}

# Main script execution
main() {
    log "INFO" "Starting comprehensive test run for Trend2Zero"
    
    # Validate dependencies
    validate_dependencies
    
    # Run tests
    run_tests
    
    # Final success log
    log "SUCCESS" "Test Run Completed Successfully"
    log "INFO" "Full logs available at: $FULL_LOG_FILE"
    log "INFO" "Test report generated in: $REPORT_DIR"
}

# Execute main function
main
