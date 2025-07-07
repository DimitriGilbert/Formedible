/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 8000, // Reasonable timeout for animations
  collectCoverageFrom: [
    'packages/formedible/src/**/*.{ts,tsx}',
    '!packages/formedible/src/**/*.d.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/web/src/$1',
  },
  maxWorkers: 1,
  verbose: false,
  bail: false,
  detectOpenHandles: false, // Stop waiting for handles
  forceExit: true, // Force exit when done
};