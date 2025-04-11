#!/usr/bin/env node

/**
 * Test TradingViewLightweightChart Component
 *
 * This script tests the TradingViewLightweightChart component locally
 * to ensure it works correctly with lightweight-charts v4.1.1.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Check if the component file exists
const componentPath = path.join(__dirname, '../components/TradingViewLightweightChart.tsx');
if (!fs.existsSync(componentPath)) {
  console.error('Component file not found:', componentPath);
  process.exit(1);
}

// Read the component file
const componentContent = fs.readFileSync(componentPath, 'utf8');

// Check for common issues
const issues = [];

// Check for browser-specific APIs without fallbacks
if (componentContent.includes('document.') && !componentContent.includes('typeof document !== "undefined"')) {
  issues.push('Using document API without checking if it exists (will fail in SSR)');
}

// Check for window references without safety checks
const windowMatches = componentContent.match(/window\.[^\s]+/g) || [];
const safeWindowChecks = componentContent.match(/typeof window !== ['|"]undefined['|"]/g) || [];

if (windowMatches.length > safeWindowChecks.length) {
  // Find the lines with window references
  const lines = componentContent.split('\n');
  const windowLines = [];

  lines.forEach((line, index) => {
    if (line.includes('window.') && !line.includes('typeof window !== \'undefined\'') && !line.includes('typeof window !== "undefined"')) {
      windowLines.push(`Line ${index + 1}: ${line.trim()}`);
    }
  });

  issues.push(`Using window API without checking if it exists (will fail in SSR):\n${windowLines.join('\n')}`);
}

// Check for lightweight-charts specific issues
if (componentContent.includes('chart.addSeries(')) {
  issues.push('Using chart.addSeries() with incorrect parameters. For v4.1.1, use chart.addLineSeries()');
}

if (componentContent.includes('PriceLineSource.Last')) {
  issues.push('Using PriceLineSource.Last which may not exist in the current version');
}

// Report issues
if (issues.length > 0) {
  console.error(`\nIssues found in ${componentPath}:`);
  issues.forEach(issue => console.error(`- ${issue}`));
  process.exit(1);
}

console.log(`✅ No issues found in ${componentPath}`);

// Check if the test page exists
const testPagePath = path.join(__dirname, '../app/test/tradingviewlightweightchart/page.tsx');
if (!fs.existsSync(testPagePath)) {
  console.log('Creating test page for TradingViewLightweightChart...');

  // Create the directory if it doesn't exist
  const testPageDir = path.dirname(testPagePath);
  if (!fs.existsSync(testPageDir)) {
    fs.mkdirSync(testPageDir, { recursive: true });
  }

  // Create the test page
  const testPageContent = `'use client';

import React from 'react';
import TradingViewLightweightChart from '../../../components/TradingViewLightweightChart';

/**
 * Test page for TradingViewLightweightChart component
 * This page is used for visual testing and browser diagnostics
 */
export default function TradingViewLightweightChartTestPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">TradingViewLightweightChart Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Bitcoin (Dark Theme)</h2>
          <div className="h-64">
            <TradingViewLightweightChart
              symbol="BTC"
              theme="dark"
              days={30}
            />
          </div>
        </div>

        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Ethereum (Light Theme)</h2>
          <div className="h-64">
            <TradingViewLightweightChart
              symbol="ETH"
              theme="light"
              days={30}
            />
          </div>
        </div>
      </div>
    </div>
  );
}`;

  fs.writeFileSync(testPagePath, testPageContent);
  console.log(`✅ Test page created at ${testPagePath}`);
}

console.log('\nTo test the component:');
console.log('1. Start the development server: npm run dev');
console.log('2. Open http://localhost:3000/test/tradingviewlightweightchart in your browser');
console.log('3. Check if the charts render correctly');

// Exit with success
process.exit(0);
