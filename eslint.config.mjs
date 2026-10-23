import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    // Patterns are resolved against the config file's directory (the repo
    // root), so they must be depth-agnostic to also cover the per-package
    // build output directories.
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.turbo/**',
      '**/.next/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.config.*',
      '**/*.d.ts'
    ]
  },
  js.configs.recommended,
  ...tsPlugin.configs['flat/recommended'],
  prettierConfig,
  {
    // Without an explicit `files` pattern, ESLint's directory traversal only
    // discovers .js/.mjs/.cjs — the TypeScript sources would be skipped.
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
];
