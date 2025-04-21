import { execSync } from 'child_process';
import path from 'path';
import { ErrorDetectionModule } from './errorDetectionModule.js';
export class AutoFixModule {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
        this.detector = new ErrorDetectionModule(projectRoot);
    }
    getAllFiles(dir) {
        // Recursively get all files in a directory
        let results = [];
        fs.readdirSync(dir).forEach((file) => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                results = results.concat(this.getAllFiles(filePath));
            }
            else {
                results.push(filePath);
            }
        });
        return results;
    }
    getFileTimestamps(files) {
        const map = {};
        for (const file of files) {
            try {
                map[file] = fs.statSync(file).mtimeMs;
            }
            catch { }
        }
        return map;
    }
    getModifiedFiles(before, after) {
        return Object.keys(after).filter((file) => before[file] !== undefined && after[file] !== before[file]);
    }
    runEslintFix() {
        execSync('npm run lint -- --fix', { stdio: 'inherit' });
    }
    runPrettierFix() {
        execSync('npm run format -- --write', { stdio: 'inherit' });
    }
    runAllFixes() {
        const results = [];
        // Get all JS/TS files before
        const allFiles = this.getAllFiles(this.projectRoot).filter((f) => /\.(js|jsx|ts|tsx)$/.test(f));
        const beforeTimestamps = this.getFileTimestamps(allFiles);
        // ESLint Fix
        let eslintResultBefore = null;
        let eslintResultAfter = null;
        if (this.detector.availableScripts['lint']) {
            eslintResultBefore = this.detector.parseEslintOutput(this.detector.runCommand('npm run lint'));
            this.runEslintFix();
            eslintResultAfter = this.detector.parseEslintOutput(this.detector.runCommand('npm run lint'));
            const afterTimestamps = this.getFileTimestamps(allFiles);
            const filesModified = this.getModifiedFiles(beforeTimestamps, afterTimestamps);
            results.push({
                tool: 'eslint',
                filesModified,
                errorsBefore: eslintResultBefore,
                errorsAfter: eslintResultAfter,
                fixedCount: (eslintResultBefore?.errors.length || 0) - (eslintResultAfter?.errors.length || 0),
                remainingCount: eslintResultAfter?.errors.length || 0,
            });
        }
        // Prettier Fix
        let prettierResultBefore = null;
        let prettierResultAfter = null;
        if (this.detector.availableScripts['format']) {
            prettierResultBefore = this.detector.parsePrettierOutput(this.detector.runCommand('npm run format -- --check'));
            this.runPrettierFix();
            prettierResultAfter = this.detector.parsePrettierOutput(this.detector.runCommand('npm run format -- --check'));
            const afterTimestamps = this.getFileTimestamps(allFiles);
            const filesModified = this.getModifiedFiles(beforeTimestamps, afterTimestamps);
            results.push({
                tool: 'prettier',
                filesModified,
                errorsBefore: prettierResultBefore,
                errorsAfter: prettierResultAfter,
                fixedCount: (prettierResultBefore?.errors.length || 0) - (prettierResultAfter?.errors.length || 0),
                remainingCount: prettierResultAfter?.errors.length || 0,
            });
        }
        return results;
    }
}
// Example CLI usage (can be removed if used as a module)
if (process.argv[1] && process.argv[1].endsWith('autoFixModule.ts')) {
    const fixer = new AutoFixModule();
    const results = fixer.runAllFixes();
    for (const result of results) {
        console.log(`\n=== ${result.tool.toUpperCase()} FIXES ===`);
        console.log('Files modified:', result.filesModified);
        console.log('Fixed errors:', result.fixedCount);
        console.log('Remaining errors:', result.remainingCount);
        if (result.remainingCount > 0) {
            for (const err of result.errorsAfter.errors) {
                console.log(err.file ? `${err.file}: ${err.message}` : err.message);
            }
        }
    }
}
