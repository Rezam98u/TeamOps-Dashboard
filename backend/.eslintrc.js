module.exports = {
	root: false,
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
	rules: {
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': [
			'error',
			{ argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
		],
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/explicit-function-return-type': 'warn',
		'@typescript-eslint/no-non-null-assertion': 'warn',
	},
	overrides: [
		{
			files: [
				'src/**/*.test.ts',
				'src/**/*.spec.ts',
				'src/routes/__tests__/**/*.ts',
				'src/test/setup.ts',
			],
			env: { jest: true },
			rules: {
				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/explicit-function-return-type': 'off',
				'@typescript-eslint/no-require-imports': 'off',
				'no-unused-vars': 'off',
				'@typescript-eslint/no-unused-vars': 'off',
			},
		},
	],
};

module.exports = {
  env: {
    node: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true,
      },
    },
  ],
};
