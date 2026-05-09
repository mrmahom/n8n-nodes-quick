/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'client/**/*.ts',
    'credentials/**/*.ts',
    'nodes/**/*.ts',
    'index.ts',
    '!**/*.d.ts',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      // A küszöböket úgy állítjuk, hogy a tesztelhető logika 100%-on legyen
      // (lines, functions), míg a tisztán defenzív vagy default-fallback ágak
      // (pl. `opts.fetch ?? fetch`, üres-input early return-ök) belül férnek
      // a 93%-os branch limit alatt.
      branches: 93,
      functions: 100,
      lines: 100,
      statements: 99,
    },
  },
  clearMocks: true,
  restoreMocks: true,
  verbose: false,
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },
};
