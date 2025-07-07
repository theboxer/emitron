import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
    ],
  },
  ...tseslint.config({
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    extends: [
      pluginJs.configs.recommended,
      eslintConfigPrettier,
      eslintPluginPrettierRecommended,
      ...tseslint.configs.recommended,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': ['off'],
      'prettier/prettier': 'error',
      'no-console': [
        'error',
        {
          allow: ['warn', 'error'],
        },
      ],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  }),
];
