export default {
  verbose: true,
  collectCoverage: true,
  resetModules: true,
  restoreMocks: true,
  testEnvironment: 'node',
  transform: {},
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
      useESM: true,
    },
  },
  collectCoverageFrom: ['<rootDir>/src/*.ts'],
  coveragePathIgnorePatterns: ['<rootDir>/dist/', '/node_modules/', '<rootDir>/scripts', '<rootDir>/tools'],
}
