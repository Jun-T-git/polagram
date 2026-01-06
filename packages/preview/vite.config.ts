import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { loadPreviewData } from './src/loader';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-preview-data',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.includes('/preview-data.json')) {
            try {
              const configPath = resolve(__dirname, '../../polagram.yml');
              console.log(`[dev] Loading config from ${configPath}...`);
              const data = await loadPreviewData(configPath);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            } catch (error) {
              console.error('[dev] Error serving preview data:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }
          next();
        });
      },
    },
  ],
  base: './',
  build: {
    outDir: 'dist/app',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
