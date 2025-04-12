module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
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