import { execSync } from 'child_process';
async function globalTeardown(config) {
    console.log('Global teardown: Stopping development server...');
    try {
        // Find and kill the process using port 3000
        if (process.platform === 'win32') {
            execSync('taskkill /F /IM node.exe');
        }
        else {
            execSync('pkill -f "npm run dev"');
            execSync('lsof -ti:3000 | xargs kill -9');
        }
        console.log('Development server stopped');
    }
    catch (error) {
        console.error('Error stopping development server:', error);
    }
    // Clean up dev server
    const devServer = globalThis.__DEV_SERVER__;
    if (devServer) {
        console.log('[Teardown] Shutting down development server...');
        devServer.kill();
        delete globalThis.__DEV_SERVER__;
        console.log('[Teardown] Development server shutdown complete');
    }
}
export default globalTeardown;
