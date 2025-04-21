import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
export class ErrorDetectionModule {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
        this.packageJson = this.readPackageJson();
        this.availableScripts = this.packageJson?.scripts || {};
    }
    readPackageJson() {
        const pkgPath = path.join(this.projectRoot, 'package.json');
        if (fs.existsSync(pkgPath)) {
            return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        }
        return null;
    }
    detectProjectType() {
        if (this.packageJson?.dependencies?.react || this.packageJson?.devDependencies?.react) {
            return 'react';
        }
        if (this.packageJson?.dependencies?.next || this.packageJson?.devDependencies?.next) {
            return 'nextjs';
        }
        // Add more detections as needed
        return 'node';
    }
    getAvailableCommands() {
        return Object.keys(this.availableScripts);
    }
    runCommand(command, options = {}) {
        try {
            return execSync(command, { encoding: 'utf-8', stdio: 'pipe', ...options });
        }
        catch (err) {
            return err.stdout ? err.stdout.toString() : (err.message || String(err));
        }
    }
    parseEslintOutput(output) {
        // Basic parsing for stylish/default ESLint output
        const errors = [];
        const lines = output.split('\n');
        let currentFile = '';
        for (const line of lines) {
            const fileMatch = line.match(/^(.*\.(js|ts|tsx|jsx))$/);
            if (fileMatch) {
                currentFile = fileMatch[1];
                continue;
            }
            const errMatch = line.match(/^(\s*)(\d+):(\d+)\s+error\s+(.*)$/);
            if (errMatch && currentFile) {
                errors.push({
                    file: currentFile,
                    line: Number(errMatch[2]),
                    column: Number(errMatch[3]),
                    message: errMatch[4],
                    raw: line,
                });
            }
        }
        return { tool: 'eslint', type: 'lint', errors, rawOutput: output };
    }
    parsePrettierOutput(output) {
        // Prettier usually outputs files with formatting issues
        const errors = output
            .split('\n')
            .filter((line) => line.trim().length && !line.startsWith('info'))
            .map((file) => ({ file, message: 'Formatting issue', raw: file }));
        return { tool: 'prettier', type: 'format', errors, rawOutput: output };
    }
    parseBuildOutput(output) {
        // Simple heuristic: lines with 'Error' or 'error' in build output
        const errors = output
            .split('\n')
            .filter((line) => /error/i.test(line))
            .map((line) => ({ message: line, raw: line }));
        return { tool: 'build', type: 'build', errors, rawOutput: output };
    }
    detectErrors() {
        const results = [];
        // ESLint
        if (this.availableScripts['lint']) {
            const lintOutput = this.runCommand('npm run lint');
            results.push(this.parseEslintOutput(lintOutput));
        }
        // Prettier (optional)
        if (this.availableScripts['format']) {
            const prettierOutput = this.runCommand('npm run format -- --check');
            results.push(this.parsePrettierOutput(prettierOutput));
        }
        // Build
        if (this.availableScripts['build']) {
            const buildOutput = this.runCommand('npm run build');
            results.push(this.parseBuildOutput(buildOutput));
        }
        return results;
    }
}
