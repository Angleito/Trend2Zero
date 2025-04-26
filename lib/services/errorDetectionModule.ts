import { execSync, ExecSyncOptions } from 'child_process';
import fs from 'fs';
import path from 'path';

export type ErrorDetectionResult = {
  tool: string;
  type: 'lint' | 'build' | 'format' | 'unknown';
  errors: Array<{
    message: string;
    file?: string;
    line?: number;
    column?: number;
    raw?: string;
  }>;
  rawOutput: string;
};

export class ErrorDetectionModule {
  projectRoot: string;
  packageJson: any;
  availableScripts: Record<string, string>;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.packageJson = this.readPackageJson();
    this.availableScripts = this.packageJson?.scripts || {};
  }

  private readPackageJson() {
    const pkgPath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
      return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    }
    return null;
  }

  detectProjectType(): string {
    if (this.packageJson?.dependencies?.react || this.packageJson?.devDependencies?.react) {
      return 'react';
    }
    if (this.packageJson?.dependencies?.next || this.packageJson?.devDependencies?.next) {
      return 'nextjs';
    }
    // Add more detections as needed
    return 'node';
  }

  getAvailableCommands(): string[] {
    return Object.keys(this.availableScripts);
  }

  runCommand(command: string, options: ExecSyncOptions = {}): string {
    try {
      const result = execSync(command, { encoding: 'utf-8', stdio: 'pipe', ...options });
return typeof result === 'string' ? result : result.toString();
    } catch (err: any) {
      return err && err.stdout ? err.stdout.toString() : (err && err.message ? String(err.message) : '');
    }
  }

  parseEslintOutput(output: string): ErrorDetectionResult {
    // Basic parsing for stylish/default ESLint output
    const errors: ErrorDetectionResult['errors'] = [];
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

  parsePrettierOutput(output: string): ErrorDetectionResult {
    // Prettier usually outputs files with formatting issues
    const errors = output
      .split('\n')
      .filter((line) => line.trim().length && !line.startsWith('info'))
      .map((file) => ({ file, message: 'Formatting issue', raw: file }));
    return { tool: 'prettier', type: 'format', errors, rawOutput: output };
  }

  parseBuildOutput(output: string): ErrorDetectionResult {
    // Simple heuristic: lines with 'Error' or 'error' in build output
    const errors = output
      .split('\n')
      .filter((line) => /error/i.test(line))
      .map((line) => ({ message: line, raw: line }));
    return { tool: 'build', type: 'build', errors, rawOutput: output };
  }

  detectErrors(): ErrorDetectionResult[] {
    const results: ErrorDetectionResult[] = [];
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

