import { execSync } from 'child_process';
import path from 'path';
export class PreCommitHookRunner {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
    }
    detectHuskyHook() {
        const huskyDir = path.join(this.projectRoot, '.husky');
        const preCommitPath = path.join(huskyDir, 'pre-commit');
        if (fs.existsSync(preCommitPath)) {
            return preCommitPath;
        }
        return null;
    }
    detectPreCommitConfig() {
        const yamlPath = path.join(this.projectRoot, '.pre-commit-config.yaml');
        const jsonPath = path.join(this.projectRoot, '.pre-commit-config.json');
        if (fs.existsSync(yamlPath))
            return yamlPath;
        if (fs.existsSync(jsonPath))
            return jsonPath;
        return null;
    }
    runHuskyHook(hookPath) {
        try {
            const output = execSync(`bash ${hookPath}`, { encoding: 'utf-8', stdio: 'pipe' });
            return { framework: 'husky', hookPath, output, exitCode: 0 };
        }
        catch (err) {
            return {
                framework: 'husky',
                hookPath,
                output: err.stdout?.toString() || '',
                exitCode: err.status ?? 1,
                error: err.message,
            };
        }
    }
    runPreCommit() {
        try {
            const output = execSync('npx pre-commit run --all-files', { encoding: 'utf-8', stdio: 'pipe' });
            return { framework: 'pre-commit', output, exitCode: 0 };
        }
        catch (err) {
            return {
                framework: 'pre-commit',
                output: err.stdout?.toString() || '',
                exitCode: err.status ?? 1,
                error: err.message,
            };
        }
    }
    run() {
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
    if (result.hookPath)
        console.log(`Hook Path: ${result.hookPath}`);
    console.log(`Exit Code: ${result.exitCode}`);
    if (result.output)
        console.log('Output:', result.output);
    if (result.error)
        console.error('Error:', result.error);
}
