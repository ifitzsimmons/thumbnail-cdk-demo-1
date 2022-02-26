module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
    es2021: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['prettier', '@typescript-eslint'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  rules: {
    'comma-dangle': 'off',
    eqeqeq: 'error',
    'prettier/prettier': 'error',
    'require-jsdoc': [
      'error',
      {
        require: {
          MethodDefinition: true,
          ArrowFunctionExpression: true,
        },
      },
    ],
  },
};
