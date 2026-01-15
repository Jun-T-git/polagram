import { promises as fs } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import connect from 'connect';
import { glob } from 'glob';
import picocolors from 'picocolors';
import sirv from 'sirv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface PreviewServerOptions {
  config: string; // Path to polagram.yml
  port?: number;
  root?: string; // Project root (defaults to dirname of config)
}

export function createPreviewMiddleware(options: PreviewServerOptions) {
  const app = connect();
  const configPath = path.resolve(process.cwd(), options.config);
  const projectRoot = options.root
    ? path.resolve(process.cwd(), options.root)
    : process.cwd();

  console.log('--- Preview Middleware Debug ---');
  console.log('CWD:', process.cwd());
  console.log('Options Config:', options.config);
  console.log('Resolved Config Path:', configPath);
  console.log('Resolved Project Root:', projectRoot);
  console.log('--------------------------------');

  // API Middleware
  app.use(
    '/__api/config',
    async (_req: IncomingMessage, res: ServerResponse) => {
      try {
        const content = await fs.readFile(configPath, 'utf-8');

        const yaml = await import('js-yaml');
        const parsed: any = yaml.load(content);

        const enrichedTargets = await Promise.all(
          (parsed.targets || []).map(async (t: any) => {
            if (!t.input) return t;
            const inputs = Array.isArray(t.input) ? t.input : [t.input];
            const files = await glob(inputs, {
              cwd: projectRoot,
              ignore: ['**/node_modules/**'],
            });
            return { ...t, _files: files };
          }),
        );

        parsed.targets = enrichedTargets;

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ config: parsed, path: configPath }));
      } catch (err) {
        console.error(err); // Log error for debugging
        res.statusCode = 500;
        res.end(JSON.stringify({ error: String(err) }));
      }
    },
  );

  app.use('/__api/file', async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const filePath = url.searchParams.get('path');

    if (!filePath) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Missing path parameter' }));
      return;
    }

    // Security check: Ensure file is within project root
    const absPath = path.resolve(projectRoot, filePath);
    if (!absPath.startsWith(projectRoot)) {
      res.statusCode = 403;
      res.end(
        JSON.stringify({ error: 'Access denied: File outside project root' }),
      );
      return;
    }

    try {
      const content = await fs.readFile(absPath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain');
      res.end(content);
    } catch (_err) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'File not found' }));
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
    server.listen(port, () => {
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
