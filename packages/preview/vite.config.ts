import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { createPreviewMiddleware } from './src/node/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'polagram-api-mock',
      configureServer(server) {
        // Standard CLI behavior: default to CWD/polagram.yml
        const configPath =
          process.env.POLAGRAM_CONFIG ||
          path.resolve(process.cwd(), 'polagram.yml');

        // Root defaults to CWD unless overridden
        const projectRoot = process.env.POLAGRAM_ROOT
          ? path.resolve(process.cwd(), process.env.POLAGRAM_ROOT)
          : process.cwd();

        console.log('Using dev config:', configPath);
        console.log('Using dev root:', projectRoot);

        const app = createPreviewMiddleware({
          config: configPath,
          root: projectRoot,
        });

        server.middlewares.use(app);
      },
    },
  ],
  publicDir: path.resolve(__dirname, 'public'),
  root: 'src/client',
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/client'),
    },
  },
});
