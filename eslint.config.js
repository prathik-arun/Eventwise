'use strict';

const js = require('@eslint/js');
const globals = require('globals');

/** Rules that keep functions small and the code easy to follow. */
const maintainability = {
  complexity: ['error', 10],
  'max-depth': ['error', 3],
  'max-params': ['error', 4],
  'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
  'no-nested-ternary': 'error',
  'no-else-return': 'error',
  'no-lonely-if': 'error',
  'consistent-return': 'error',
};

/** Rules for correctness and a consistent style. */
const style = {
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  curly: ['error', 'all'],
  'no-var': 'error',
  'prefer-const': 'error',
  'prefer-template': 'error',
  'object-shorthand': 'error',
  'no-shadow': 'error',
  'no-use-before-define': ['error', { functions: false }],
  'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  'no-param-reassign': ['error', { props: false }],
  'no-implicit-coercion': 'error',
};

module.exports = [
  { ignores: ['node_modules/**', 'coverage/**', 'index.html'] },
  js.configs.recommended,
  {
    // Browser code: plain scripts that share the `Eventwise` namespace.
    files: ['src/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: { ...globals.browser, Eventwise: 'readonly' },
    },
    rules: { ...maintainability, ...style },
  },
  {
    // Node code: tests, helpers and tooling.
    files: ['tests/**/*.js', 'scripts/**/*.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'commonjs', globals: globals.node },
    rules: { ...style, 'max-lines-per-function': 'off' },
  },
];
