import { execSync, ExecSyncOptions } from 'child_process';

import path from 'path';

export type PreCommitHookResult = {
  framework: 'husky' | 'pre-commit' | 'none';
  hookPath?: string;
  output: string;
  exitCode: number;
  error?: string;
};

export class PreCommitHookRunner {
  projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  detectHuskyHook(): string | null {
    const huskyDir = path.join(this.projectRoot, '.husky');
    const preCommitPath = path.join(huskyDir, 'pre-commit');
    if (fs.existsSync(preCommitPath)) {
      return preCommitPath;
    }
    return null;
  }

  detectPreCommitConfig(): string | null {
    const yamlPath = path.join(this.projectRoot, '.pre-commit-config.yaml');
    const jsonPath = path.join(this.projectRoot, '.pre-commit-config.json');
    if (fs.existsSync(yamlPath)) return yamlPath;
    if (fs.existsSync(jsonPath)) return jsonPath;
    return null;
  }

  runHuskyHook(hookPath: string): PreCommitHookResult {
    try {
      const output = execSync(`bash ${hookPath}`, { encoding: 'utf-8', stdio: 'pipe' });
      return { framework: 'husky', hookPath, output, exitCode: 0 };
    } catch (err: any) {
      return {
        framework: 'husky',
        hookPath,
        output: err.stdout?.toString() || '',
        exitCode: err.status ?? 1,
        error: err.message,
      };
    }
  }

  runPreCommit(): PreCommitHookResult {
    try {
      const output = execSync('npx pre-commit run --all-files', { encoding: 'utf-8', stdio: 'pipe' });
      return { framework: 'pre-commit', output, exitCode: 0 };
    } catch (err: any) {
      return {
        framework: 'pre-commit',
        output: err.stdout?.toString() || '',
        exitCode: err.status ?? 1,
        error: err.message,
      };
    }
  }

  run(): PreCommitHookResult {
    const husky = this.detectHuskyHook();
    if (husky) {
      return this.runHuskyHook(husky);
    }
    const preCommit = this.detectPreCommitConfig();
    if (preCommit) {
      return this.runPreCommit();
    }
    return {
      framework: 'none',
      output: 'No pre-commit hook detected.',
      exitCode: 0,
    };
  }
}

// Example CLI usage (can be removed if used as a module)
if (process.argv[1] && process.argv[1].endsWith('preCommitHookRunner.ts')) {
  const runner = new PreCommitHookRunner();
  const result = runner.run();
  console.log(`Framework: ${result.framework}`);
  if (result.hookPath) console.log(`Hook Path: ${result.hookPath}`);
  console.log(`Exit Code: ${result.exitCode}`);
  if (result.output) console.log('Output:', result.output);
  if (result.error) console.error('Error:', result.error);
}
