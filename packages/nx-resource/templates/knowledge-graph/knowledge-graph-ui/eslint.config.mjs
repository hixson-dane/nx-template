import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['dist'],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {},
  },
];
