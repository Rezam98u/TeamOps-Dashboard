module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
    'no-unused-vars': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts', 'backend/src/test/setup.ts'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
    {
      files: ['backend/src/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
  ],
};
