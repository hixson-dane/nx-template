/* eslint-disable @typescript-eslint/no-var-requires */
const { readFileSync } = require('node:fs');

// Reading the SWC compilation config for the spec files
const swcJestConfig = JSON.parse(
  readFileSync(`${__dirname}/.spec.swcrc`, 'utf-8'),
);

// Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
swcJestConfig.swcrc = false;

module.exports = {
  displayName: 'schema-sdk',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  // GitHub Copilot generated code - start
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)', '**/src/**/test.ts'],
  // GitHub Copilot generated code - end
  coverageDirectory: 'test-output/jest/coverage',
};
