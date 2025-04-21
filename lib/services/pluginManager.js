import fs from 'fs';
import path from 'path';
export class PluginManager {
    constructor({ config, cwd = process.cwd() }) {
        this.plugins = [];
        this.customScripts = [];
        this.cwd = cwd;
        if (config?.customScripts) {
            this.customScripts = config.customScripts;
        }
        if (config?.plugins) {
            this.loadPlugins(config.plugins);
        }
    }
    loadPlugins(pluginPaths) {
        for (const pluginPath of pluginPaths) {
            const absPath = path.isAbsolute(pluginPath)
                ? pluginPath
                : path.join(this.cwd, pluginPath);
            if (fs.existsSync(absPath)) {
                try {
                    const plugin = require(absPath);
                    if (plugin)
                        this.plugins.push(plugin);
                }
                catch (e) {
                    // Fallback: skip plugin on error
                }
            }
        }
    }
    runCustomScripts(type) {
        for (const script of this.customScripts.filter(s => s.type === type)) {
            try {
                console.log(`[PLUGIN] Running custom script: ${script.name}`);
                require('child_process').execSync(script.command, { stdio: 'inherit', cwd: this.cwd });
            }
            catch (e) {
                console.error(`[PLUGIN] Error running script: ${script.name}`);
            }
        }
    }
    runPlugins(type) {
        for (const plugin of this.plugins) {
            try {
                if (type === 'detect' && plugin.detect)
                    plugin.detect(this.cwd);
                if (type === 'fix' && plugin.fix)
                    plugin.fix(this.cwd);
            }
            catch (e) {
                console.error(`[PLUGIN] Error in plugin: ${plugin.name}`);
            }
        }
    }
    chainFixStrategies() {
        // Run all fix scripts and plugins in order
        this.runCustomScripts('fix');
        this.runPlugins('fix');
    }
    chainDetectStrategies() {
        // Run all detect scripts and plugins in order
        this.runCustomScripts('detect');
        this.runPlugins('detect');
    }
}
// Example CLI usage (can be removed if used as a module)
if (process.argv[1] && process.argv[1].endsWith('pluginManager.ts')) {
    const config = {
        customScripts: [
            { name: 'Custom Lint', command: 'npm run custom-lint', type: 'detect' },
            { name: 'Custom Fix', command: 'npm run custom-fix', type: 'fix' },
        ],
        plugins: [],
    };
    const pm = new PluginManager({ config });
    pm.chainDetectStrategies();
    pm.chainFixStrategies();
}
