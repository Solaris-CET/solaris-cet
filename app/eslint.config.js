import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'public/vendor/**',
    /* Playwright output — must not be linted; missing dir must not break `eslint .` (ESLint 10 glob). */
    'test-results/**',
    'playwright-report/**',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'Use SafeHtml component instead of dangerouslySetInnerHTML.',
        },
      ],
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['src/components/SafeHtml.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
])
