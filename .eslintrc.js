module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'linebreak-style': ['off'],
    complexity: ['off', 'error', { max: 4 }],
    'max-len': ['error', { code: 90 }],
  },
};
