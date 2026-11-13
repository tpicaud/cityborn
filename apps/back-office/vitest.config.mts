import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
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
            '@ariakit/react',
            'lucide-react',
          ],
        },
      },
    },
    coverage: { provider: 'v8', reporter: ['text', 'lcov'] },
    projects: [
      {
        extends: true,
        test: { name: 'logic', environment: 'node', include: ['**/*.test.ts'] },
      },
      {
        extends: true,
        test: {
          name: 'react',
          environment: 'jsdom',
          include: ['**/*.test.tsx'],
          setupFiles: ['./test/setup.ts'],
        },
      },
    ],
  },
});
