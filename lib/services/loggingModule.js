// ANSI color codes (no deps, works everywhere)
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
};
export class Logger {
    constructor(detailed = false) {
        this.detailed = detailed;
    }
    color(msg, color) {
        return colors[color] + msg + colors.reset;
    }
    info(msg) {
        console.log(this.color('[INFO] ', 'cyan') + msg);
    }
    warn(msg) {
        console.log(this.color('[WARN] ', 'yellow') + msg);
    }
    error(msg) {
        console.error(this.color('[ERROR] ', 'red') + msg);
    }
    success(msg) {
        console.log(this.color('[SUCCESS] ', 'green') + msg);
    }
    debug(msg) {
        if (this.detailed)
            console.log(this.color('[DEBUG] ', 'gray') + msg);
    }
    summary(report) {
        console.log(this.color(`\n===== SUMMARY =====`, 'bold'));
        this.success(`Iterations: ${report.iterations}`);
        this.success(`Total errors fixed: ${report.totalFixed}`);
        if (report.remaining > 0) {
            this.warn(`Errors remaining: ${report.remaining}`);
        }
        else {
            this.success('All errors fixed!');
        }
        if (report.filesModified.length) {
            this.info('Files modified:');
            for (const f of report.filesModified) {
                console.log('  ' + this.color(f, 'blue'));
            }
        }
    }
    detailedReport(errors, filesModified) {
        console.log(this.color(`\n===== DETAILED REPORT =====`, 'bold'));
        if (filesModified.length) {
            this.info('Files modified:');
            for (const f of filesModified) {
                console.log('  ' + this.color(f, 'blue'));
            }
        }
        if (errors.length) {
            this.error('Errors remaining:');
            for (const err of errors) {
                let msg = err.file ? `${err.file}: ` : '';
                msg += err.message;
                if (err.line)
                    msg += ` (line ${err.line}` + (err.column ? `:${err.column}` : '') + ')';
                console.log('  ' + this.color(msg, 'red'));
            }
        }
        else {
            this.success('No errors remaining.');
        }
    }
}
// Example CLI usage (can be removed if used as a module)
if (process.argv[1] && process.argv[1].endsWith('loggingModule.ts')) {
    const logger = new Logger(true);
    logger.info('This is info');
    logger.warn('This is a warning');
    logger.error('This is an error');
    logger.success('This is a success');
    logger.debug('This is debug');
    logger.summary({ iterations: 3, totalFixed: 5, remaining: 2, filesModified: ['src/foo.js', 'src/bar.ts'] });
    logger.detailedReport([
        { file: 'src/foo.js', message: 'Unexpected semi.', line: 1, column: 10 },
        { file: 'src/bar.ts', message: 'Missing return type.' },
    ], ['src/foo.js', 'src/bar.ts']);
}
