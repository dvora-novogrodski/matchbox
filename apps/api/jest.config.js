const path = require('node:path');

// CommonJS output turns the Prisma client's dynamic import() into require(), which Jest supports
// without --experimental-vm-modules.
const shared = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs', moduleResolution: 'node10' } }],
  },
  moduleNameMapper: {
    // The package "require" export points at dist, which CI has not built. Load the
    // TypeScript source so ts-jest compiles it with the rest of the tests.
    '^@matchbox/shared$': '<rootDir>/../../../packages/shared/src/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
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
      setupFiles: ['<rootDir>/setup/jest.setup.ts'],
      globalSetup: '<rootDir>/setup/global-setup.ts',
      globalTeardown: '<rootDir>/setup/global-teardown.ts',
    },
  ],
};
