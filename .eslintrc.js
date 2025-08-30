module.exports = {
  root: true,
  extends: [
    'universe/native',
    'universe/shared/typescript-analysis',
  ],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
