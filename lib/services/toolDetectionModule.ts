import fs from 'fs';
import path from 'path';

export type ToolDetectionResult = {
  projectType: string;
  tools: string[];
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'unknown';
  configSuggestion: Record<string, any>;
};

function detectProjectType(pkg: any): string {
  if (pkg?.dependencies?.react || pkg?.devDependencies?.react) return 'react';
  if (pkg?.dependencies?.next || pkg?.devDependencies?.next) return 'nextjs';
  if (pkg?.dependencies?.vue || pkg?.devDependencies?.vue) return 'vue';
  if (pkg?.dependencies?.express || pkg?.devDependencies?.express) return 'express';
  return 'node';
}

function detectTools(pkg: any): string[] {
  const tools = [];
  if (pkg?.devDependencies?.eslint || pkg?.dependencies?.eslint) tools.push('eslint');
  if (pkg?.devDependencies?.prettier || pkg?.dependencies?.prettier) tools.push('prettier');
  if (pkg?.devDependencies?.typescript || pkg?.dependencies?.typescript) tools.push('typescript');
  // Add more as needed
  return tools;
}

function detectPackageManager(dir: string): 'npm' | 'yarn' | 'pnpm' | 'unknown' {
  if (fs.existsSync(path.join(dir, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(dir, 'package-lock.json'))) return 'npm';
  return 'unknown';
}

function suggestConfig(projectType: string, tools: string[], packageManager: string): Record<string, any> {
  const config: Record<string, any> = {};
  if (tools.includes('eslint')) {
    config.lintCommand = packageManager === 'yarn' ? 'yarn lint' : 'npm run lint';
    config.lintFixCommand = packageManager === 'yarn' ? 'yarn lint --fix' : 'npm run lint -- --fix';
  }
  if (tools.includes('prettier')) {
    config.formatCommand = packageManager === 'yarn' ? 'yarn format' : 'npm run format';
    config.formatFixCommand = packageManager === 'yarn' ? 'yarn format --write' : 'npm run format -- --write';
  }
  config.toolOrder = tools;
  config.projectType = projectType;
  return config;
}

export function detectToolsAndConfig({ cwd = process.cwd() }: { cwd?: string } = {}): ToolDetectionResult {
  const pkgPath = path.join(cwd, 'package.json');
  let pkg: any = {};
  if (fs.existsSync(pkgPath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    } catch {}
  }
  const projectType = detectProjectType(pkg);
  const tools = detectTools(pkg);
  const packageManager = detectPackageManager(cwd);
  const configSuggestion = suggestConfig(projectType, tools, packageManager);
  return { projectType, tools, packageManager, configSuggestion };
}

// Example CLI usage (can be removed if used as a module)
if (process.argv[1] && process.argv[1].endsWith('toolDetectionModule.ts')) {
  const result = detectToolsAndConfig({});
  console.log(result);
}
