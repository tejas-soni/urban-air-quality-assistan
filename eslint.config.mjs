/**
 * ESLint configuration: Next.js Web Vitals + typescript-eslint strictTypeChecked & stylisticTypeChecked,
 * enforced complexity/size ceilings, zero inline disables, and strict `as` assertion ban in source.
 */
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

const SIZE_AND_SAFETY_RULES = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/ban-ts-comment': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
  complexity: ['error', 8],
  'max-depth': ['error', 3],
  'max-params': ['error', 4],
  'max-lines': ['error', { max: 120, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['error', { max: 45, skipBlankLines: true, skipComments: true }],
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-warning-comments': ['error', { terms: ['todo', 'fixme', 'xxx', 'hack'] }],
  eqeqeq: ['error', 'always'],
  'prefer-const': 'error',
  'no-console': 'error',
};

const eslintConfig = [
  {
    ignores: ['.next/**', 'coverage/**', 'node_modules/**', 'hackathon-prep/**'],
  },
  {
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'error' },
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...tseslint.configs.strictTypeChecked.map((cfg) => ({
    ...cfg,
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}', 'e2e/**/*.ts'],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((cfg) => ({
    ...cfg,
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}', 'e2e/**/*.ts'],
  })),
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}', 'e2e/**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: SIZE_AND_SAFETY_RULES,
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}'],
    rules: {
      'max-lines-per-function': ['error', { max: 65, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['src/lib/logger.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'e2e/**/*.ts'],
    rules: {
      'max-lines': ['error', { max: 220, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  prettierConfig,
];

export default eslintConfig;
