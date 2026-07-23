import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      globals: {
        console: 'readable',
        process: 'readable',
        URL: 'readable',
        setTimeout: 'readable',
        clearTimeout: 'readable',
        setInterval: 'readable',
        clearInterval: 'readable',
        Buffer: 'readable',
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  },
];
