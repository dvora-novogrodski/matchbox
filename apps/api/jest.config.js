const path = require('node:path');

// CommonJS output turns the Prisma client's dynamic import() into require(), which Jest supports
// without --experimental-vm-modules.
const shared = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs', moduleResolution: 'node10' } }],
  },
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  testEnvironment: 'node',
};

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      ...shared,
      displayName: 'unit',
      rootDir: path.join(__dirname, 'src'),
      testRegex: '.*\\.spec\\.ts$',
    },
    {
      ...shared,
      displayName: 'e2e',
      rootDir: path.join(__dirname, 'test'),
      testRegex: '.*\\.e2e-spec\\.ts$',
      globalSetup: '<rootDir>/setup/global-setup.ts',
      globalTeardown: '<rootDir>/setup/global-teardown.ts',
    },
  ],
};
