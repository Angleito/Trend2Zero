const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class BuildCacheValidator {
  constructor() {
    this.cacheDir = path.join(process.cwd(), '.next/cache');
    this.validationReportPath = path.join(process.cwd(), '.next/cache-validation-report.json');
  }

  async validateBuildCache() {
    const validationReport = {
      timestamp: new Date().toISOString(),
      totalFiles: 0,
      validFiles: 0,
      invalidFiles: 0,
      corruptedFiles: [],
      largeFiles: [],
      recommendations: []
    };

    try {
      const cacheFiles = await this.getCacheFiles();
      validationReport.totalFiles = cacheFiles.length;

      for (const file of cacheFiles) {
        const fileValidation = await this.validateCacheFile(file);
        
        if (fileValidation.isValid) {
          validationReport.validFiles++;
        } else {
          validationReport.invalidFiles++;
          validationReport.corruptedFiles.push(file);
        }

        if (fileValidation.isLarge) {
          validationReport.largeFiles.push({
            file,
            size: fileValidation.size
          });
        }
      }

      // Generate recommendations
      validationReport.recommendations = this.generateRecommendations(validationReport);

      // Write validation report
      await this.writeValidationReport(validationReport);

      return validationReport;
    } catch (error) {
      console.error('Cache validation failed:', error);
      return null;
    }
  }

  async getCacheFiles() {
    try {
      const files = await fs.readdir(this.cacheDir);
      return files.map(file => path.join(this.cacheDir, file));
    } catch (error) {
      console.error('Failed to read cache directory:', error);
      return [];
    }
  }

  async validateCacheFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const fileContent = await fs.readFile(filePath);

      // Check file integrity
      const isValid = this.checkFileIntegrity(fileContent);

      // Check file size (large if > 10MB)
      const isLarge = stats.size > 10 * 1024 * 1024;

      return {
        isValid,
        isLarge,
        size: stats.size
      };
    } catch (error) {
      console.error(`Failed to validate file ${filePath}:`, error);
      return {
        isValid: false,
        isLarge: false,
        size: 0
      };
    }
  }

  checkFileIntegrity(content) {
    try {
      // Attempt to parse as JSON
      JSON.parse(content.toString());
      return true;
    } catch {
      return false;
    }
  }

  generateRecommendations(validationReport) {
    const recommendations = [];

    if (validationReport.invalidFiles > 0) {
      recommendations.push('Clear invalid cache files to improve build performance');
    }

    if (validationReport.largeFiles.length > 5) {
      recommendations.push('Consider pruning large cache files to reduce storage usage');
    }

    const validityRatio = validationReport.validFiles / validationReport.totalFiles;
    if (validityRatio < 0.8) {
      recommendations.push('Low cache file validity detected. Recommend full cache rebuild');
    }

    return recommendations;
  }

  async writeValidationReport(report) {
    try {
      await fs.writeFile(
        this.validationReportPath, 
        JSON.stringify(report, null, 2), 
        'utf8'
      );
      console.log('Cache validation report generated');
    } catch (error) {
      console.error('Failed to write validation report:', error);
    }
  }
}

// If run directly, execute cache validation
if (require.main === module) {
  (async () => {
    const validator = new BuildCacheValidator();
    const validationReport = await validator.validateBuildCache();
    console.log('Cache Validation Report:', JSON.stringify(validationReport, null, 2));
  })();
}

module.exports = new BuildCacheValidator();