#!/usr/bin/env node
const { program } = require('commander');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

program.version('1.0.1');

// Build Commands
program
  .command('build')
  .description('Build the Next.js application')
  .option('-a, --analyze', 'Analyze bundle size')
  .option('-p, --performance', 'Analyze build performance')
  .action((options) => {
    try {
      if (options.analyze) {
        execSync('npm run build:analyze', { stdio: 'inherit' });
      } else if (options.performance) {
        execSync('npm run build:performance', { stdio: 'inherit' });
      } else {
        execSync('npm run build', { stdio: 'inherit' });
      }
    } catch (error) {
      console.error('Build failed:', error.message);
      process.exit(1);
    }
  });

// Cache Commands
program
  .command('cache')
  .description('Manage build cache')
  .option('-c, --clear', 'Clear build cache')
  .option('-a, --analyze', 'Analyze cache performance')
  .option('-v, --validate', 'Validate cache')
  .option('-m, --metrics', 'Show cache metrics')
  .option('-p, --prune', 'Prune cache')
  .action((options) => {
    try {
      if (options.clear) {
        execSync('npm run build:cache:clear', { stdio: 'inherit' });
      } else if (options.analyze) {
        execSync('npm run build:cache:analyze', { stdio: 'inherit' });
      } else if (options.validate) {
        execSync('npm run build:cache:validate', { stdio: 'inherit' });
      } else if (options.metrics) {
        execSync('npm run cache:metrics', { stdio: 'inherit' });
      } else if (options.prune) {
        execSync('npm run cache:prune', { stdio: 'inherit' });
      } else {
        console.log('Please specify a cache operation. Use --help for options.');
      }
    } catch (error) {
      console.error('Cache operation failed:', error.message);
      process.exit(1);
    }
  });

// Test Commands
program
  .command('test')
  .description('Run tests')
  .option('-u, --unit', 'Run unit tests')
  .option('-e, --e2e', 'Run end-to-end tests')
  .option('-v, --visual', 'Run visual tests')
  .option('-c, --coverage', 'Generate test coverage report')
  .option('-w, --watch', 'Watch mode for tests')
  .action((options) => {
    try {
      if (options.unit) {
        execSync('npm run test', { stdio: 'inherit' });
      } else if (options.e2e) {
        execSync('npm run test:e2e', { stdio: 'inherit' });
      } else if (options.visual) {
        execSync('npm run test:visual', { stdio: 'inherit' });
      } else if (options.coverage) {
        execSync('npm run test:coverage', { stdio: 'inherit' });
      } else if (options.watch) {
        execSync('npm run test:watch', { stdio: 'inherit' });
      } else {
        execSync('npm run test', { stdio: 'inherit' });
      }
    } catch (error) {
      console.error('Tests failed:', error.message);
      process.exit(1);
    }
  });

// Deployment Commands
program
  .command('deploy')
  .description('Deploy to Vercel')
  .option('-p, --production', 'Deploy to production')
  .action((options) => {
    try {
      if (options.production) {
        execSync('npm run vercel:deploy:prod', { stdio: 'inherit' });
      } else {
        execSync('npm run vercel:deploy', { stdio: 'inherit' });
      }
    } catch (error) {
      console.error('Deployment failed:', error.message);
      process.exit(1);
    }
  });

// Development Commands
program
  .command('dev')
  .description('Start development server')
  .action(() => {
    try {
      execSync('npm run dev', { stdio: 'inherit' });
    } catch (error) {
      console.error('Development server failed:', error.message);
      process.exit(1);
    }
  });

// Performance Commands
program
  .command('performance')
  .description('Run performance tests')
  .action(() => {
    try {
      execSync('npm run test:performance', { stdio: 'inherit' });
    } catch (error) {
      console.error('Performance test failed:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);