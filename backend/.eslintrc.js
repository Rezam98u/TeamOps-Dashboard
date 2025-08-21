module.exports = {
	root: true,
	env: {
		node: true,
		es2020: true,
	},
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
	},
	rules: {
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': [
			'error',
			{ argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
		],
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/explicit-function-return-type': 'warn',
		'@typescript-eslint/no-non-null-assertion': 'warn',
		'prefer-const': 'error',
		'no-var': 'error',
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
