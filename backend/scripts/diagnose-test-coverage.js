#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const COVERAGE_REPORT_PATH = path.join(__dirname, '..', 'coverage', 'coverage-final.json');
const COVERAGE_SUMMARY_PATH = path.join(__dirname, '..', 'TEST_COVERAGE_REPORT.md');
const CRITICAL_THRESHOLD = 85;
const WARNING_THRESHOLD = 70;

// ANSI color codes for console output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function generateCoverageSummary() {
  // Run Jest with coverage
  try {
    execSync('npm run test:coverage', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to run tests:', error);
    process.exit(1);
  }

  // Read coverage report
  const coverageData = JSON.parse(fs.readFileSync(COVERAGE_REPORT_PATH, 'utf8'));

  // Analyze coverage data
  const analysis = analyzeCoverage(coverageData);
  
  // Generate report
  const report = generateReport(analysis);
  
  // Save report
  fs.writeFileSync(COVERAGE_SUMMARY_PATH, report);
  
  // Print summary to console
  printConsoleSummary(analysis);
  
  // Return recommendations if coverage is below thresholds
  if (analysis.overall.percentage < WARNING_THRESHOLD) {
    suggestImprovements(analysis);
  }
}

function analyzeCoverage(coverageData) {
  const analysis = {
    overall: { covered: 0, total: 0, percentage: 0 },
    byDirectory: {},
    uncoveredLines: []
  };

  Object.entries(coverageData).forEach(([filePath, data]) => {
    const directory = path.dirname(filePath).split('/').pop();
    
    if (!analysis.byDirectory[directory]) {
      analysis.byDirectory[directory] = { covered: 0, total: 0, percentage: 0 };
    }

    const fileAnalysis = {
      covered: 0,
      total: Object.keys(data.statementMap).length,
      uncovered: []
    };

    // Analyze statements coverage
    Object.entries(data.s).forEach(([stmtId, count]) => {
      if (count > 0) {
        fileAnalysis.covered++;
      } else {
        fileAnalysis.uncovered.push({
          line: data.statementMap[stmtId].start.line,
          endLine: data.statementMap[stmtId].end.line,
          file: filePath
        });
      }
    });

    // Update directory stats
    analysis.byDirectory[directory].covered += fileAnalysis.covered;
    analysis.byDirectory[directory].total += fileAnalysis.total;
    
    // Update overall stats
    analysis.overall.covered += fileAnalysis.covered;
    analysis.overall.total += fileAnalysis.total;
    
    // Track uncovered lines
    analysis.uncoveredLines.push(...fileAnalysis.uncovered);
  });

  // Calculate percentages
  analysis.overall.percentage = (analysis.overall.covered / analysis.overall.total) * 100;
  
  Object.values(analysis.byDirectory).forEach(dir => {
    dir.percentage = (dir.covered / dir.total) * 100;
  });

  return analysis;
}

function generateReport(analysis) {
  const timestamp = new Date().toISOString();
  
  let report = `# Test Coverage Report\n\n`;
  report += `Generated: ${timestamp}\n\n`;
  
  report += `## Overall Coverage: ${analysis.overall.percentage.toFixed(2)}%\n\n`;
  
  report += `## Coverage by Directory\n\n`;
  report += `| Directory | Coverage | Status |\n`;
  report += `|-----------|-----------|--------|\n`;
  
  Object.entries(analysis.byDirectory).forEach(([directory, stats]) => {
    const status = stats.percentage >= CRITICAL_THRESHOLD ? '✅' :
                  stats.percentage >= WARNING_THRESHOLD ? '⚠️' : '❌';
    report += `| ${directory} | ${stats.percentage.toFixed(2)}% | ${status} |\n`;
  });
  
  if (analysis.uncoveredLines.length > 0) {
    report += `\n## Areas Needing Coverage\n\n`;
    const groupedByFile = groupUncoveredLinesByFile(analysis.uncoveredLines);
    
    Object.entries(groupedByFile).forEach(([file, lines]) => {
      report += `### ${file}\n`;
      report += `- Lines: ${formatLineRanges(lines)}\n`;
    });
  }
  
  report += `\n## Recommendations\n\n`;
  report += generateRecommendations(analysis);
  
  return report;
}

function groupUncoveredLinesByFile(uncoveredLines) {
  return uncoveredLines.reduce((acc, { file, line, endLine }) => {
    if (!acc[file]) acc[file] = [];
    acc[file].push({ start: line, end: endLine });
    return acc;
  }, {});
}

function formatLineRanges(lines) {
  // Sort and merge continuous line ranges
  lines.sort((a, b) => a.start - b.start);
  const ranges = [];
  let currentRange = lines[0];
  
  lines.slice(1).forEach(line => {
    if (line.start <= currentRange.end + 1) {
      currentRange.end = Math.max(currentRange.end, line.end);
    } else {
      ranges.push(currentRange);
      currentRange = line;
    }
  });
  ranges.push(currentRange);
  
  return ranges.map(r => r.start === r.end ? r.start : `${r.start}-${r.end}`).join(', ');
}

function printConsoleSummary(analysis) {
  console.log('\n=== Test Coverage Summary ===\n');
  
  const overallColor = analysis.overall.percentage >= CRITICAL_THRESHOLD ? colors.green :
                      analysis.overall.percentage >= WARNING_THRESHOLD ? colors.yellow : colors.red;
  
  console.log(`Overall Coverage: ${overallColor}${analysis.overall.percentage.toFixed(2)}%${colors.reset}\n`);
  
  console.log('Coverage by Directory:');
  Object.entries(analysis.byDirectory).forEach(([directory, stats]) => {
    const color = stats.percentage >= CRITICAL_THRESHOLD ? colors.green :
                 stats.percentage >= WARNING_THRESHOLD ? colors.yellow : colors.red;
    console.log(`${directory}: ${color}${stats.percentage.toFixed(2)}%${colors.reset}`);
  });
}

function suggestImprovements(analysis) {
  console.log('\n=== Suggested Improvements ===\n');
  
  // Sort directories by coverage (ascending)
  const sortedDirs = Object.entries(analysis.byDirectory)
    .sort(([, a], [, b]) => a.percentage - b.percentage);
  
  sortedDirs.forEach(([directory, stats]) => {
    if (stats.percentage < WARNING_THRESHOLD) {
      console.log(`${colors.bold}${directory}${colors.reset} (${stats.percentage.toFixed(2)}%):`);
      console.log('- Add unit tests for uncovered functions');
      console.log('- Implement integration tests for critical paths');
      console.log('- Review error handling scenarios\n');
    }
  });
}

function generateRecommendations(analysis) {
  let recommendations = '';
  
  if (analysis.overall.percentage < WARNING_THRESHOLD) {
    recommendations += '### High Priority\n';
    recommendations += '- Focus on adding tests for critical business logic\n';
    recommendations += '- Implement integration tests for main workflows\n';
    recommendations += '- Add error handling test cases\n\n';
  }
  
  if (analysis.uncoveredLines.length > 0) {
    recommendations += '### Specific Areas\n';
    const groupedByFile = groupUncoveredLinesByFile(analysis.uncoveredLines);
    Object.entries(groupedByFile)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5)
      .forEach(([file, lines]) => {
        recommendations += `- Add tests for ${file} (${lines.length} uncovered lines)\n`;
      });
  }
  
  return recommendations;
}

// Run the analysis
generateCoverageSummary();