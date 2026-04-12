module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'import/extensions': 'off',
    'no-underscore-dangle': 'error',
    'no-inline-comments': 'error',
    'no-warning-comments': ['error', { terms: ['todo', 'fixme', 'any other term'], location: 'anywhere' }],
    'multiline-comment-style': ['error', 'starred-block'],
  },
  overrides: [
    {
      files: ['src/domain/IFlightController.js', 'src/infrastructure/PortScanner.js'],
      rules: {
        'class-methods-use-this': 'off',
      },
    },
    {
      files: ['src/core/msp.js'],
      rules: {
        'no-bitwise': 'off',
        'no-plusplus': 'off',
      },
    },
    {
      files: ['test/integration/**/*', 'test/bdd/**/*'],
      rules: {
        'no-await-in-loop': 'off',
        'no-restricted-syntax': [
          'error',
          {
            selector: "CallExpression[callee.object.name='jest'][callee.property.name=/^(mock|doMock|unstable_mockModule)$/]",
            message: 'Integration/BDD tests must not use jest.mock() or similar mocking utilities. Only real dependencies are allowed.'
          }
        ]
      }
    }
  ],
};
