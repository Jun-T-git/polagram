import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test, expect } from '@playwright/test';

let fixture: string;
let server: ChildProcess | undefined;
let baseURL: string;

test.beforeAll(async () => {
  fixture = await mkdtemp(join(tmpdir(), 'polagram-render-preview-'));
  await mkdir(join(fixture, 'src'));
  await writeFile(join(fixture, 'polagram.yml'), `version: 1
targets:
  - input: ['src/*.mmd']
    outputDir: dist
    lenses:
      - name: remove-logs
        layers:
          - action: remove
            selector:
              kind: participant
              name: Log
`);
  await writeFile(join(fixture, 'src/normal.mmd'), 'sequenceDiagram\nparticipant User\nparticipant API\nparticipant Log\nUser->>API: Request\nAPI->>Log: Audit');

  // Allocate an unused port so simultaneous product QA sessions stay independent.
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const address = reservation.address();
  if (!address || typeof address === 'string') throw new Error('No TCP port allocated');
  const port = address.port;
  await new Promise<void>((done, reject) => reservation.close(error => error ? reject(error) : done()));
  baseURL = `http://127.0.0.1:${port}`;
  const cli = resolve(__dirname, '../../../cli/dist/index.js');
  server = spawn(process.execPath, [cli, 'preview', '-p', String(port)], { cwd: fixture, stdio: 'pipe' });
  let output = '';
  let spawnError: Error | undefined;
  server.on('error', error => { spawnError = error; });
  server.stdout?.on('data', chunk => { output = (output + String(chunk)).slice(-8_000); });
  server.stderr?.on('data', chunk => { output = (output + String(chunk)).slice(-8_000); });
  await expect.poll(async () => {
    if (spawnError) throw spawnError;
    if (server?.exitCode !== null) throw new Error(`CLI exited before ready: ${output}`);
    try { return (await fetch(`${baseURL}/__api/config`)).status; }
    catch { return 0; }
  }, { timeout: 15_000, message: 'CLI preview becomes available' }).toBe(200);
});

test.afterAll(async () => {
  if (server && server.exitCode === null && server.signalCode === null) {
    const closed = once(server, 'close');
    server.kill('SIGTERM');
    await closed;
  }
  if (fixture) await rm(fixture, { recursive: true, force: true });
});

test('CLI preview supports nested diagram, lens, missing-file error, and recovery', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(baseURL);

  await test.step('open a diagram from a nested path', async () => {
    await page.getByRole('link', { name: 'src/normal.mmd', exact: true }).click();
    await expect(page.locator('.mermaid-preview svg')).toBeVisible();
    await expect(page.locator('.mermaid-preview')).toContainText('Request');
    await expect(page.locator('.mermaid-preview')).toContainText('Audit');
  });

  await test.step('apply the available lens', async () => {
    await page.getByRole('link', { name: 'remove-logs', exact: true }).click();
    await expect(page.locator('.mermaid-preview')).toContainText('Request');
    await expect(page.locator('.mermaid-preview')).not.toContainText('Audit');
  });

  await test.step('show a useful error when the file is missing', async () => {
    await page.goto(`${baseURL}/#/missing.mmd`);
    await expect(page.getByText('Unable to display diagram', { exact: true })).toBeVisible();
    await expect(page.locator('.mermaid-preview svg')).toHaveCount(0);
  });

  await test.step('recover by selecting a valid diagram', async () => {
    await page.getByRole('link', { name: 'src/normal.mmd', exact: true }).click();
    await expect(page.locator('.mermaid-preview svg')).toBeVisible();
    await expect(page.locator('.mermaid-preview')).toContainText('Request');
    await expect(page.getByText('Unable to display diagram', { exact: true })).toHaveCount(0);
  });
  expect(pageErrors).toEqual([]);
});
