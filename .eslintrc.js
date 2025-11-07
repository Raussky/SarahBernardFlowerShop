module.exports = {
  extends: ['expo', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  plugins: ['react', 'react-hooks', 'expo'],
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  ignorePatterns: ['supabase/functions/**'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'import/no-unresolved': ['error', { ignore: ['^@env$'] }],
    'import/namespace': 'off',
    'import/first': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['**/__tests__/**', '**/*.test.js', '**/*.spec.js', 'jest.setup.js'],
      env: {
        jest: true,
      },
    },
  ],
};
