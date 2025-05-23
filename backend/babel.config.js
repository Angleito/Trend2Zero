module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-object-rest-spread',  // Updated from deprecated plugin
    '@babel/plugin-transform-optional-chaining',
    '@babel/plugin-transform-nullish-coalescing-operator',  // Updated from proposal to transform
    ['module-resolver', {
      root: ['./src'],
      alias: {
        '@': './src',
        '@models': './src/models',
        '@controllers': './src/controllers',
        '@services': './src/services',
        '@utils': './src/utils'
      }
    }]
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: { node: 'current' },
            modules: 'commonjs',
          },
        ],
      ],
      plugins: [
        '@babel/plugin-transform-modules-commonjs',
        '@babel/plugin-transform-runtime',
        [
          'babel-plugin-transform-import-meta',
          {
            module: 'ES6',
          },
        ],
      ],
    },
  },
  ignore: ['node_modules/(?!mongoose|mongodb)'],
  sourceMaps: 'inline',
  retainLines: true,
};