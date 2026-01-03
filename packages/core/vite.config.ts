import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PolagramCore',
      fileName: 'polagram-core',
    },
  },
  plugins: [dts({ rollupTypes: true })],
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'dist/**'],
    },
  },
});
