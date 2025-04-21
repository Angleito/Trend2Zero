// errorAnalysisModule.ts
const ESLINT_DOC_BASE = 'https://eslint.org/docs/latest/rules/';
const TYPESCRIPT_DOC_BASE = 'https://www.typescriptlang.org/error/';
function getDocLinkForError(err) {
    if (err.ruleId) {
        return ESLINT_DOC_BASE + err.ruleId;
    }
    if (err.code && /^TS\d+$/.test(err.code)) {
        return TYPESCRIPT_DOC_BASE + err.code.replace('TS', '');
    }
    return undefined;
}
function heuristicSuggestion(err) {
    if (err.message.includes('missing semicolon'))
        return 'Add a semicolon at the end of the statement.';
    if (err.message.includes('is not defined'))
        return 'Check for missing variable or import.';
    if (err.message.includes('Unexpected token'))
        return 'Check for syntax errors near the reported location.';
    if (err.message.includes('Type'))
        return 'Check type annotations or type compatibility.';
    if (err.ruleId === 'no-unused-vars')
        return 'Remove or use the declared variable.';
    // Add more heuristics as needed
    return undefined;
}
export function groupErrors(errors) {
    const groups = {};
    for (const err of errors) {
        const key = err.ruleId || err.code || err.type || err.message.split(':')[0];
        if (!groups[key]) {
            groups[key] = {
                title: key,
                errors: [],
                suggestion: heuristicSuggestion(err),
                docLinks: [],
            };
        }
        groups[key].errors.push(err);
        const doc = getDocLinkForError(err);
        if (doc && !groups[key].docLinks?.includes(doc)) {
            groups[key].docLinks?.push(doc);
        }
    }
    return Object.values(groups);
}
export function summarizeChanges({ filesModified, errorsRemaining }) {
    console.log('\x1b[1m===== SUMMARY OF CHANGES =====\x1b[0m');
    if (filesModified.length) {
        console.log('Files modified:');
        for (const f of filesModified) {
            console.log('  \x1b[34m' + f + '\x1b[0m');
        }
    }
    else {
        console.log('No files were modified.');
    }
    if (errorsRemaining.length) {
        console.log('\nErrors remaining:');
        const groups = groupErrors(errorsRemaining);
        for (const group of groups) {
            console.log(`\n\x1b[31m${group.title}\x1b[0m (${group.errors.length}):`);
            if (group.suggestion)
                console.log('  Suggestion:', group.suggestion);
            if (group.docLinks && group.docLinks.length) {
                for (const link of group.docLinks) {
                    console.log('  Docs:', link);
                }
            }
            for (const err of group.errors) {
                let loc = err.file ? `${err.file}` : '';
                if (err.line)
                    loc += `:${err.line}`;
                if (loc)
                    loc += ' - ';
                console.log('    ' + loc + err.message);
            }
        }
    }
    else {
        console.log('\x1b[32mNo errors remaining!\x1b[0m');
    }
}
// Example CLI usage (can be removed if used as a module)
if (process.argv[1] && process.argv[1].endsWith('errorAnalysisModule.ts')) {
    const errors = [
        { file: 'foo.js', message: 'Unexpected token', ruleId: 'no-unexpected-token', line: 2 },
        { file: 'foo.js', message: 'x is not defined', ruleId: 'no-undef', line: 3 },
        { file: 'bar.ts', message: 'Type number is not assignable to string', code: 'TS2322', line: 5 },
    ];
    const filesModified = ['foo.js'];
    summarizeChanges({ filesModified, errorsRemaining: errors });
}
