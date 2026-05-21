module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react-hooks/exhaustive-deps': 'off', // Prevent hook dependency warnings from breaking the build via --max-warnings 0
    '@typescript-eslint/no-explicit-any': 'off', // Allow explicit any for dynamic JSON and store state usage
    'react-hooks/rules-of-hooks': 'off', // Allow custom function names starting with 'use' (like useHint store actions) to be called outside hooks
    'prefer-const': 'off', // Allow let variables even if never reassigned
  },
}
