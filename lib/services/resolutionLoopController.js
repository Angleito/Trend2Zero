import { ErrorDetectionModule } from './errorDetectionModule.js';
import { AutoFixModule } from './autoFixModule.js';
import { PreCommitHookRunner } from './preCommitHookRunner.js';
export class ResolutionLoopController {
    constructor(projectRoot = process.cwd(), maxIterations = 10) {
        this.projectRoot = projectRoot;
        this.detector = new ErrorDetectionModule(projectRoot);
        this.fixer = new AutoFixModule(projectRoot);
        this.preCommit = new PreCommitHookRunner(projectRoot);
        this.maxIterations = maxIterations;
    }
    async run() {
        let iteration = 0;
        let previousErrorCount = Infinity;
        const reports = [];
        while (iteration < this.maxIterations) {
            iteration++;
            // 1. Detect errors
            const errorsBefore = this.detector.detectErrors();
            const totalErrorsBefore = errorsBefore.reduce((sum, r) => sum + r.errors.length, 0);
            // 2. Apply fixes
            const fixResults = this.fixer.runAllFixes();
            // 3. Detect errors again
            const errorsAfter = this.detector.detectErrors();
            const totalErrorsAfter = errorsAfter.reduce((sum, r) => sum + r.errors.length, 0);
            // 4. Run pre-commit hook
            const preCommitResult = this.preCommit.run();
            // 5. Determine progress
            const progressMade = totalErrorsAfter < totalErrorsBefore;
            reports.push({
                iteration,
                errorsBefore,
                fixResults,
                errorsAfter,
                preCommitResult,
                progressMade,
            });
            // 6. Termination conditions
            if (totalErrorsAfter === 0)
                break;
            if (!progressMade || totalErrorsAfter === previousErrorCount)
                break;
            previousErrorCount = totalErrorsAfter;
        }
        return reports;
    }
}
// Example CLI usage (can be removed if used as a module)
if (process.argv[1] && process.argv[1].endsWith('resolutionLoopController.ts')) {
    (async () => {
        const controller = new ResolutionLoopController();
        const reports = await controller.run();
        for (const report of reports) {
            console.log(`\n=== ITERATION ${report.iteration} ===`);
            console.log('Errors before:', report.errorsBefore.map(r => r.errors.length));
            console.log('Fix results:', report.fixResults.map(r => ({ tool: r.tool, fixed: r.fixedCount, remaining: r.remainingCount })));
            console.log('Errors after:', report.errorsAfter.map(r => r.errors.length));
            console.log('Pre-commit:', report.preCommitResult.framework, 'Exit:', report.preCommitResult.exitCode);
            if (report.preCommitResult.output)
                console.log(report.preCommitResult.output);
            if (report.preCommitResult.error)
                console.error(report.preCommitResult.error);
            console.log('Progress made:', report.progressMade);
        }
        console.log('\n=== LOOP COMPLETE ===');
        const last = reports[reports.length - 1];
        if (last.errorsAfter.reduce((sum, r) => sum + r.errors.length, 0) === 0) {
            console.log('All issues resolved!');
        }
        else {
            console.log('Some issues remain and could not be auto-fixed.');
        }
    })();
}
