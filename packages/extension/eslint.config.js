// ESLint v9 Flat Config with @antfu/eslint-config

import antfu from '@antfu/eslint-config';
import globals from 'globals';

export default antfu(
  {
    typescript: {
      tsconfigPath: './tsconfig.eslint.json',
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.config.js'],
        },
      },
    },
    react: {
      overrides: {
        'react-hooks/exhaustive-deps': 'off',
        'react-hooks/rules-of-hooks': 'off',
      },
    },

    // Disable stylistic formatting to avoid conflicts with Prettier
    stylistic: false,

    // Use simpler import sorting to avoid circular fixes
    sortKeys: false,

    ignores: [
      'dist',
      'node_modules',
      'coverage',
      '**/*.md',
      '.wxt',
      '.output',
      '.claude',
      'pkg',
      'public',
      'playwright-report',
      'test-results',
      'src/types/global.d.ts', // Ambient declarations require 'any' for test environment
      'src/types/chrome-mock.d.ts', // Mock type definitions
    ],
  },

  {
    rules: {
      // TypeScript: antfu is permissive with 'any', but we enforce strictness
      'ts/no-explicit-any': 'error',
      'ts/no-floating-promises': 'error',
      'ts/await-thenable': 'error',
      'ts/no-deprecated': 'warn', // Warn on deprecated APIs (Buffer.slice, etc.)
      'ts/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],
      'ts/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Console
      'no-console': 'error',

      // Code quality
      'no-restricted-globals': [
        'error',
        {
          name: 'location',
          message: 'Use window.location instead',
        },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-void': ['error', { allowAsStatement: true }],
      radix: 'error',

      // Pragmatic style preferences
      'no-plusplus': ['error', { allowForLoopAfterthoughts: true }], // i++ is idiomatic in loops
      'no-param-reassign': ['error', { props: false }], // Allow property mutations for DOM
      'no-continue': 'off',
      'no-restricted-syntax': [
        'error',
        'ForInStatement', // Ban for-in (use Object.keys)
        'LabeledStatement', // Ban labels
        'WithStatement', // Ban with
      ],

      // Allow await in loops when necessary
      'no-await-in-loop': 'warn',
      'no-cond-assign': ['error', 'except-parens'], // Allow with extra parens
      'ts/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],
    },
  },

  // Test files (Vitest unit/integration tests)
  {
    files: ['**/__tests__/**/*', '**/*.test.*'],
    rules: {
      'ts/no-explicit-any': 'off',
      'ts/no-unsafe-call': 'off',
      'ts/no-unsafe-member-access': 'off',
      'ts/no-unsafe-assignment': 'off',
      'ts/no-unsafe-argument': 'off',
      'ts/unbound-method': 'off', // Vitest mocks require accessing .mock property
      'test/prefer-lowercase-title': 'off', // Allow "Integration: ..." test titles
    },
  },

  // Playwright test files (E2E, visual, performance, etc.)
  {
    files: ['tests/**/*', '*/e2e/**/*', '**/*.spec.*', 'playwright.config.ts'],
    rules: {
      'no-empty-pattern': 'off', // Playwright fixtures use empty {} for no-dependency fixtures
      'no-await-in-loop': 'off', // Sequential execution needed in E2E tests
      'ts/no-explicit-any': 'off',
    },
  },

  // WASM loader - needs Node.js environment detection
  {
    files: [
      'src/shared/services/pdf/wasm/loader.ts',
      'src/shared/services/pdf/wasm/loader.node.ts',
    ],
    languageOptions: {
      globals: {
        ...globals['shared-node-browser'],
      },
    },
    rules: {
      'node/prefer-global/process': 'off', // Required for cross-platform environment detection
    },
  },

  // Build configuration files
  {
    files: ['*.config.ts', '*.config.js'],
    rules: {
      'ts/strict-boolean-expressions': 'off', // Config files may use looser boolean checks
      'node/prefer-global/process': 'off', // Config files commonly use process.env
    },
  }
);
