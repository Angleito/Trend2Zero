import fs from 'fs';
import path from 'path';
const CONFIG_FILENAMES = [
    '.toolrc',
    '.toolrc.json',
    'tool.config.json',
    'tool.config.js',
    'tool.config.cjs',
];
function loadConfigFile(dir) {
    for (const filename of CONFIG_FILENAMES) {
        const filePath = path.join(dir, filename);
        if (fs.existsSync(filePath)) {
            if (filename.endsWith('.js') || filename.endsWith('.cjs')) {
                // Dynamically import JS config
                // (Node ESM: import() is async, so skip for now, or require for CJS)
                // For simplicity, skip .js config unless needed
                continue;
            }
            try {
                const raw = fs.readFileSync(filePath, 'utf-8');
                return JSON.parse(raw);
            }
            catch { }
        }
    }
    return {};
}
function getDefaultConfig(projectType) {
    if (projectType === 'react' || projectType === 'nextjs') {
        return {
            detectCommands: ['npm run lint', 'npm run build'],
            fixCommands: ['npm run lint -- --fix', 'npm run format -- --write'],
            toolOrder: ['eslint', 'prettier', 'build'],
        };
    }
    return {
        detectCommands: ['npm run lint', 'npm run build'],
        fixCommands: ['npm run lint -- --fix'],
        toolOrder: ['eslint', 'build'],
    };
}
export function getConfig({ cwd = process.cwd(), cliArgs = {}, projectType = 'node', } = {}) {
    const fileConfig = loadConfigFile(cwd);
    const defaults = getDefaultConfig(projectType);
    // Merge order: defaults < fileConfig < cliArgs
    return {
        ...defaults,
        ...fileConfig,
        ...cliArgs,
    };
}
// Example CLI usage (can be removed if used as a module)
if (process.argv[1] && process.argv[1].endsWith('configModule.ts')) {
    const config = getConfig({ cliArgs: { toolOrder: ['prettier', 'eslint'] }, projectType: 'react' });
    console.log(config);
}
