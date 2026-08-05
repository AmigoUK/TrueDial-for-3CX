// Flat ESLint config — deliberately light: TypeScript recommended rules plus a
// few consistency guards. Formatting is Prettier's job (config-prettier last).
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['.output/**', '.wxt/**', 'node_modules/**', 'public/**', 'demo/**'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      // The codebase leans on intentional empty catches ("never break the host
      // page"); require them to stay explicit blocks, not accidents.
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
    },
  },
  {
    files: ['scripts/**'],
    rules: { 'no-console': 'off' },
  },
  prettier,
);
