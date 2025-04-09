const { transform } = require('@babel/core');

module.exports = {
  process(sourceText, sourcePath, options) {
    // Skip non-TypeScript files
    if (!sourcePath.endsWith('.ts')) {
      return { code: sourceText };
    }

    // Handle type imports specially
    const modifiedSource = sourceText
      .replace(/import\s+type/g, 'import')
      .replace(/export\s+type/g, 'export');

    // Transform the code using Babel
    const result = transform(modifiedSource, {
      filename: sourcePath,
      sourceFileName: sourcePath,
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript'
      ],
      plugins: [
        ['@babel/plugin-transform-typescript', { allowDeclareFields: true }],
        '@babel/plugin-transform-runtime',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread'
      ],
      sourceMaps: 'inline',
      retainLines: true
    });

    return {
      code: result.code,
      map: result.map
    };
  }
};