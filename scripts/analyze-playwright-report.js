// scripts/analyze-playwright-report.js
// Usage: node scripts/analyze-playwright-report.js
// Parses playwright-report/report.json and logs all failed tests with errors and stack traces.

const fs = require('fs');
const path = require('path');

const reportPath = path.resolve(__dirname, '../playwright-report/report.json');

function printErrorDetails(errors, indent = '') {
  if (Array.isArray(errors)) {
    for (const error of errors) {
      if (error.message) {
        console.log(`${indent}Error: ${error.message}`);
      }
      if (error.stack) {
        console.log(`${indent}Stack Trace:\n${error.stack}`);
      }
    }
  }
}

function main() {
  if (!fs.existsSync(reportPath)) {
    console.error(`❌ Playwright JSON report not found at ${reportPath}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  let failed = 0;

  for (const suite of report.suites || []) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        for (const result of test.results || []) {
          if (result.status === 'failed' || (result.errors && result.errors.length > 0)) {
            failed++;
            console.log(`\n❌ Test Failed: ${spec.title}`);
            printErrorDetails(result.errors, '  ');
          }
        }
      }
    }
  }

  if (failed === 0) {
    console.log('✅ All Playwright tests passed (no failures in JSON report).');
  } else {
    console.log(`\nTotal failed tests: ${failed}`);
    process.exit(1);
  }
}

main();