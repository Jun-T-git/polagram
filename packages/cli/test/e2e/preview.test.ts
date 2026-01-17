import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const CLI_PATH = path.resolve(__dirname, '../../dist/index.js');
const FIXTURE_DIR = path.resolve(__dirname, 'preview-fixture');
const PORT = 6099; // Use a distinct port to avoid conflicts
const BASE_URL = `http://localhost:${PORT}`;

describe('CLI: Preview Command', () => {
  let serverProcess: any;

  beforeAll(async () => {
    // Setup Fixture
    await fs.rm(FIXTURE_DIR, { recursive: true, force: true });
    await fs.mkdir(FIXTURE_DIR, { recursive: true });

    const config = `
version: 1
targets:
  - input: ["src/*.mmd"]
    outputDir: "dist"
    lenses: []
`;
    await fs.writeFile(path.join(FIXTURE_DIR, 'polagram.yml'), config);

    const srcDir = path.join(FIXTURE_DIR, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(
      path.join(srcDir, 'test.mmd'),
      'sequenceDiagram\nA->>B: Hi',
    );

    // Start Server
    // We use spawn instead of exec to keep it running
    console.log('Starting preview server...');
    serverProcess = spawn('node', [CLI_PATH, 'preview', '-p', String(PORT)], {
      cwd: FIXTURE_DIR,
      stdio: 'pipe', // Pipe stdio to check for "ready" message if possible
    });

    // Wait for server to be ready
    await new Promise<void>((resolve, reject) => {
      let output = '';
      const onData = (data: Buffer) => {
        output += data.toString();
        // Assuming Vite prints something like "Local: http://localhost:..."
        // or we just wait for the port to be open.
        // Let's rely on polling fetch for robustness.
        if (output.includes('Local:')) {
           // Provide a small buffer after "Local:" appears
           // resolve();
        }
      };

      serverProcess.stdout.on('data', onData);
      serverProcess.stderr.on('data', (data: Buffer) => console.error(`[Server Error]: ${data}`));

      // Polling strategy
      const start = Date.now();
      const interval = setInterval(async () => {
        try {
            const res = await fetch(BASE_URL);
            if (res.ok) {
                clearInterval(interval);
                resolve();
            }
        } catch (_e) {
            // Ignore connection refused
        }

        if (Date.now() - start > 10000) {
            clearInterval(interval);
            reject(new Error(`Server failed to start within 10s. Output: ${output}`));
        }
      }, 500);

      serverProcess.on('error', (err: any) => {
        clearInterval(interval);
        reject(err);
      });
      
      serverProcess.on('exit', (code: number) => {
          if (code !== 0) {
             clearInterval(interval);
             reject(new Error(`Server exited early with code ${code}`));
          }
      });
    });
    console.log('Server is ready.');
  }, 15000);

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill();
    }
    await fs.rm(FIXTURE_DIR, { recursive: true, force: true });
  });

  it('should serve HTML at root', async () => {
    const res = await fetch(BASE_URL);
    expect(res.status).toBe(200);
    const text = await res.text();
    // Should contain title from index.html
    expect(text).toContain('<title>Polagram Preview</title>');
  });

  it('should serve API config', async () => {
    // Note: The dev server might route /__api/config or we might need to check how useConfig fetches it.
    // In dev mode (vite), the middleware (if implemented) should handle it.
    // Let's check `packages/preview/src/node/server.ts` logic if needed.
    // Assuming standard implementation:
    const res = await fetch(`${BASE_URL}/__api/config`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('config');
    expect(json.config).toHaveProperty('version', 1);
    expect(json.config.targets).toHaveLength(1);
    expect(json.config.targets[0]).toHaveProperty('_files');
    expect(json.config.targets[0]._files).toContain('src/test.mmd');
  });

  it('should serve API file content', async () => {
    const filePath = 'src/test.mmd';
    const res = await fetch(`${BASE_URL}/__api/file?path=${encodeURIComponent(filePath)}`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('sequenceDiagram');
    expect(text).toContain('A->>B: Hi');
  });

  it('should return 404 for missing file', async () => {
    const res = await fetch(`${BASE_URL}/__api/file?path=missing.mmd`);
    expect(res.status).toBe(404);
  });
});
