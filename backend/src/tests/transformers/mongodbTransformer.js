const babelJest = require('babel-jest').default;

module.exports = babelJest.createTransformer({
    presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }]
    ],
    plugins: [
        '@babel/plugin-transform-modules-commonjs',
        '@babel/plugin-proposal-class-properties'
    ]
});