import react from '@vitejs/plugin-react';
import type { ViteUserConfig } from 'vitest/config';

type ReactTestConfigOptions = {
  sourceDirectory?: string;
  alias?: Record<string, string>;
  uiDependencies?: string[];
};

export function createReactTestConfig({
  sourceDirectory = 'src',
  alias = {},
  uiDependencies = [],
}: ReactTestConfigOptions = {}): ViteUserConfig {
  const testDirectory: string = sourceDirectory ? `${sourceDirectory}/` : '';

  return {
    plugins: [react()],
    resolve: { dedupe: ['react', 'react-dom'], alias },
    test: {
      globals: false,
      deps: {
        optimizer: {
          client: {
            enabled: true,
            include: [
              'react',
              'react-dom',
              'react-dom/client',
              '@testing-library/react',
              ...uiDependencies,
            ],
          },
        },
      },
      coverage: { provider: 'v8', reporter: ['text', 'lcov'] },
      projects: [
        {
          extends: true,
          test: {
            name: 'logic',
            environment: 'node',
            include: [`${testDirectory}**/*.test.ts`],
          },
        },
        {
          extends: true,
          test: {
            name: 'react',
            environment: 'jsdom',
            include: [`${testDirectory}**/*.test.tsx`],
            setupFiles: ['./test/setup.ts'],
          },
        },
      ],
    },
  };
}
