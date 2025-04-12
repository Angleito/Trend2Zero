const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function diagnoseBuild() {
  console.log('🔍 Diagnosing Build Configuration...');
  
  const diagnosticReport = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    dependencies: {},
    buildConfiguration: {}
  };

  try {
    // Check package dependencies
    const packageJson = require('../package.json');
    diagnosticReport.dependencies = {
      total: Object.keys(packageJson.dependencies || {}).length,
      dev: Object.keys(packageJson.devDependencies || {}).length
    };

    // Check build output
    const buildDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(buildDir)) {
      const buildStats = fs.statSync(buildDir);
      diagnosticReport.buildOutput = {
        size: `${(buildStats.size / (1024 * 1024)).toFixed(2)} MB`,
        lastModified: buildStats.mtime.toISOString()
      };
    }

    // Write diagnostic report
    const reportPath = path.join(process.cwd(), 'build-diagnostic-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(diagnosticReport, null, 2));

    console.log('✅ Build Diagnostic Report Generated');
    console.log(JSON.stringify(diagnosticReport, null, 2));
  } catch (error) {
    console.error('❌ Build Diagnosis Failed:', error);
    process.exit(1);
  }
}

diagnoseBuild();