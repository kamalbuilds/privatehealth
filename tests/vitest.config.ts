import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**'
    ],
    reporters: ['verbose', 'json', 'html'],
    outputFile: {
      json: './tests/coverage/test-results.json',
      html: './tests/coverage/test-results.html'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './tests/coverage',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/*.d.ts',
        'src/types/**',
        'node_modules/**'
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 30000,
    hookTimeout: 10000,
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@tests': path.resolve(__dirname, '.'),
      '@fixtures': path.resolve(__dirname, './fixtures'),
      '@utils': path.resolve(__dirname, './utils'),
      '@mocks': path.resolve(__dirname, './__mocks__')
    }
  }
});