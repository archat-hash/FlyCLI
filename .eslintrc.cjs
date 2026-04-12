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
  },
  overrides: [
    {
      files: ['test/integration/**/*', 'test/bdd/**/*'],
      rules: {
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
