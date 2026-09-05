import type { Config } from 'jest';

const esmOnlyDependencies = ['nanoid', 'p-limit', 'uuid', 'yocto-queue'];

const swcOptions = {
  module: { type: 'commonjs' },
  jsc: {
    target: 'es2023',
    transform: { legacyDecorator: true, decoratorMetadata: true },
  },
};

const baseProject = {
  rootDir: '.',
  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        ...swcOptions,
        jsc: {
          ...swcOptions.jsc,
          parser: { syntax: 'typescript', decorators: true },
        },
      },
    ],
    '^.+\\.m?js$': [
      '@swc/jest',
      {
        ...swcOptions,
        jsc: { ...swcOptions.jsc, parser: { syntax: 'ecmascript' } },
      },
    ],
  },
  transformIgnorePatterns: [
    `/node_modules/(?!(${esmOnlyDependencies.join('|')})/)`,
  ],
} satisfies Config;

const config: Config = {
  passWithNoTests: true,
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/dto/**',
    '!src/**/*.dto.ts',
    '!src/**/index.ts',
  ],
  coverageProvider: 'v8',
  coverageDirectory: 'coverage',
  projects: [
    {
      ...baseProject,
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.unit.spec.ts'],
    },
    {
      ...baseProject,
      displayName: 'integration',
      testMatch: ['<rootDir>/test/integration/**/*.integration.spec.ts'],
    },
    {
      ...baseProject,
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/e2e/**/*.e2e.spec.ts'],
    },
  ],
};

export default config;
