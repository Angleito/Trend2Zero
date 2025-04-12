const fs = require('fs');
const path = require('path');

// Create all required test directories
const directories = [
  'test-results',
  'test-results/logs',
  'test-results/screenshots',
  'test-results/reports',
  'test-results/coverage',
  'test-results/performance',
  'test-results/visual',
  'test-results/responsive',
  'playwright-report'
];

// Create directories
directories.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Create a .gitkeep file in each directory to ensure they're tracked by git
directories.forEach(dir => {
  const gitkeepPath = path.join(__dirname, '..', dir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
    console.log(`Created .gitkeep in: ${dir}`);
  }
});