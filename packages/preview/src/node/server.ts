import { promises as fs } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import connect from 'connect';
import picocolors from 'picocolors';
import sirv from 'sirv';
import {
  assertRelativeInput,
  loadPreviewConfig,
  PreviewAccessError,
  resolveInput,
} from './boundary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface PreviewServerOptions {
  config: string; // Path to polagram.yml
  port?: number;
  root?: string; // Project root (defaults to dirname of config)
}

export function createPreviewMiddleware(options: PreviewServerOptions) {
  const app = connect();
  const configPath = path.resolve(process.cwd(), options.config);
  const configDir = path.dirname(configPath);
  const projectRoot = options.root
    ? path.resolve(process.cwd(), options.root)
    : configDir;

  // Local preview APIs must not expose project files to remote web pages or DNS rebinding.
  app.use('/__api', (req: IncomingMessage, res: ServerResponse, next) => {
    let trusted = false;
    try {
      const host = req.headers.host;
      const localPort = req.socket.localPort;
      const allowedHosts = new Set(
        ['localhost', '127.0.0.1', '[::1]'].flatMap((name) => [
          name,
          `${name}:${localPort}`,
        ]),
      );
      const origin = req.headers.origin;
      trusted =
        !!host &&
        allowedHosts.has(host.toLowerCase()) &&
        (!origin || origin === `http://${host}`) &&
        req.headers['sec-fetch-site'] !== 'cross-site';
    } catch {
      /* Reject malformed request headers. */
    }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!trusted) {
      res.statusCode = 403;
      res.end('Access denied');
      return;
    }
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.setHeader('Allow', 'GET');
      res.end('Method not allowed');
      return;
    }
    next();
  });

  app.use(
    '/__api/config',
    async (req: IncomingMessage, res: ServerResponse) => {
      let url: URL;
      try {
        url = new URL(req.url || '/', 'http://localhost');
      } catch {
        res.statusCode = 400;
        res.end('Invalid URL');
        return;
      }
      if (url.pathname !== '/') {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      try {
        const { config } = await loadPreviewConfig(configPath, projectRoot);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ config, path: configPath }));
      } catch (error) {
        res.statusCode = error instanceof PreviewAccessError ? 403 : 500;
        res.end(
          JSON.stringify({ error: 'Unable to load preview configuration' }),
        );
      }
    },
  );

  app.use('/__api/file', async (req: IncomingMessage, res: ServerResponse) => {
    let url: URL;
    try {
      url = new URL(req.url || '/', 'http://localhost');
    } catch {
      res.statusCode = 400;
      res.end('Invalid URL');
      return;
    }
    if (url.pathname !== '/') {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    const filePath = url.searchParams.get('path');
    if (!filePath) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Missing path parameter' }));
      return;
    }
    try {
      assertRelativeInput(filePath);
      const { allowedFiles } = await loadPreviewConfig(configPath, projectRoot);
      if (!allowedFiles.has(filePath)) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'File not found' }));
        return;
      }
      const absPath = await resolveInput(configDir, projectRoot, filePath);
      const content = await fs.readFile(absPath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain');
      res.end(content);
    } catch (error) {
      res.statusCode = error instanceof PreviewAccessError ? 403 : 404;
      res.end(JSON.stringify({ error: 'File unavailable' }));
    }
  });

  return app;
}

export async function startServer(options: PreviewServerOptions) {
  const app = createPreviewMiddleware(options);
  const port = options.port || 6006;

  // Serve static assets (Vite build output)
  const clientDist = path.resolve(__dirname, '../client');

  // Check if client dist exists, otherwise warn
  try {
    const stats = await fs.stat(clientDist);
    if (!stats.isDirectory()) {
      console.warn(
        picocolors.yellow(
          '⚠️  Client build not found. Please run "pnpm build" in packages/preview.',
        ),
      );
    }
  } catch (_e) {
    console.warn(
      picocolors.yellow(
        `⚠️  Client build not found at ${clientDist}. Please run "pnpm build" in packages/preview.`,
      ),
    );
  }

  // Serve static assets (Vite build output)
  app.use(sirv(clientDist, { dev: true, single: true }));

  const server = http.createServer(app);

  return new Promise<void>((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => {
      console.log(
        picocolors.green(
          `  ➜  Polagram Preview running at: http://localhost:${port}/`,
        ),
      );
      console.log(picocolors.dim(`     Config: ${options.config}`)); // Use original relative path for display or absolute? options.config is usually relative.
      // Or calculate absolute configPath again if needed for logging, but usually fine.
      resolve();
    });
    server.on('error', reject);
  });
}
