import { promises as fs } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { buildStatic, createPreviewMiddleware } from '@polagram/preview';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

let fixture: string;
let project: string;
let config: string;
let server: http.Server;
let base: string;

async function writeConfig(input = 'src/*.mmd') {
  await fs.writeFile(
    config,
    `version: 1\ntargets:\n  - input: [${JSON.stringify(input)}]\n    outputDir: dist\n    lenses: []\n`,
  );
}

beforeEach(async () => {
  fixture = await fs.mkdtemp(
    path.join(os.tmpdir(), 'polagram-preview-boundary-'),
  );
  project = path.join(fixture, 'project');
  config = path.join(project, 'polagram.yml');
  await fs.mkdir(path.join(project, 'src'), { recursive: true });
  await fs.mkdir(path.join(fixture, 'project-secret'));
  await fs.writeFile(
    path.join(fixture, 'project-secret', 'secret.mmd'),
    'outside secret',
  );
  await fs.writeFile(
    path.join(project, 'src', 'diagram.mmd'),
    'sequenceDiagram\nA->>B: Safe',
  );
  await fs.writeFile(
    path.join(project, 'src', 'secret.txt'),
    'private content',
  );
  await fs.writeFile(path.join(project, 'unlisted.mmd'), 'unlisted diagram');
  await writeConfig();
  server = http.createServer(createPreviewMiddleware({ config }));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  base = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  await fs.rm(fixture, { recursive: true, force: true });
});

async function rawStatus(endpoint: string, headers: Record<string, string>) {
  return new Promise<number | undefined>((resolve, reject) => {
    http
      .get(`${base}/__api/${endpoint}`, { headers }, (response) => {
        response.resume();
        resolve(response.statusCode);
      })
      .on('error', reject);
  });
}

async function fileResponse(file: string) {
  return fetch(`${base}/__api/file?path=${encodeURIComponent(file)}`);
}

describe('Preview filesystem and request boundary', () => {
  it('uses the config directory as root and serves only configured diagram files', async () => {
    const response = await fetch(`${base}/__api/config`);
    expect(response.status).toBe(200);
    expect((await response.json()).config.targets[0]._files).toEqual([
      'src/diagram.mmd',
    ]);
    expect(await (await fileResponse('src/diagram.mmd')).text()).toContain(
      'Safe',
    );
    for (const input of ['polagram.yml', 'src/secret.txt', 'unlisted.mmd']) {
      expect((await fileResponse(input)).status).toBe(404);
    }
    await writeConfig('src/*');
    const expanded = await (await fetch(`${base}/__api/config`)).json();
    expect(expanded.config.targets[0]._files).toEqual(['src/diagram.mmd']);
  });

  it('rejects malformed endpoint URLs and continues serving normal requests', async () => {
    for (const endpoint of ['config//[', 'file//[']) {
      expect(await rawStatus(endpoint, {})).toBe(400);
    }
    expect((await fileResponse('src/diagram.mmd')).status).toBe(200);
  });

  it('rejects traversal and absolute paths including sibling prefix paths', async () => {
    for (const input of [
      '../project-secret/secret.mmd',
      path.join(project, 'src/diagram.mmd'),
      'src/../polagram.yml',
      'C:\\secret.mmd',
    ]) {
      expect((await fileResponse(input)).status).toBe(403);
      await writeConfig(input);
      expect((await fetch(`${base}/__api/config`)).status).toBe(403);
    }
  });

  it('rejects external symlinks and rechecks changed config on each read', async () => {
    await fs.symlink(
      path.join(fixture, 'project-secret/secret.mmd'),
      path.join(project, 'src/link.mmd'),
    );
    expect((await fetch(`${base}/__api/config`)).status).toBe(403);
    expect((await fileResponse('src/link.mmd')).status).toBe(403);
    await fs.unlink(path.join(project, 'src/link.mmd'));
    await writeConfig('unlisted.mmd');
    expect((await fileResponse('src/diagram.mmd')).status).toBe(404);
    expect((await fileResponse('unlisted.mmd')).status).toBe(200);
  });

  it('rejects remote origins, foreign hosts, unsafe methods and endpoint suffixes', async () => {
    for (const endpoint of ['config', 'file?path=src/diagram.mmd']) {
      for (const headers of [
        { Origin: 'https://attacker.example' },
        { Host: 'attacker.example' },
        { 'Sec-Fetch-Site': 'cross-site' },
      ]) {
        expect(
          await rawStatus(endpoint, headers),
          JSON.stringify(headers),
        ).toBe(403);
      }
      expect(
        (await fetch(`${base}/__api/${endpoint}`, { method: 'POST' })).status,
      ).toBe(405);
      expect(
        (
          await fetch(`${base}/__api/${endpoint}`, {
            headers: { Origin: base },
          })
        ).status,
      ).toBe(200);
    }
    expect((await fetch(`${base}/__api/config/extra`)).status).toBe(404);
  });
});

describe('Preview static build boundary', () => {
  it('copies only declared diagrams and supports rebuilding its own output', async () => {
    const outDir = path.join(fixture, 'output');
    await buildStatic({ config, outDir });
    expect(
      await fs.readFile(path.join(outDir, 'api/file/src/diagram.mmd'), 'utf-8'),
    ).toContain('Safe');
    await expect(
      fs.stat(path.join(outDir, 'api/file/src/secret.txt')),
    ).rejects.toThrow();
    await buildStatic({ config, outDir });
    expect(
      JSON.parse(
        await fs.readFile(path.join(outDir, 'api/config.json'), 'utf-8'),
      ).targets[0]._files,
    ).toEqual(['src/diagram.mmd']);
  });

  it('validates unsafe input before modifying an existing directory', async () => {
    const outDir = path.join(fixture, 'output');
    await fs.mkdir(outDir);
    await fs.writeFile(path.join(outDir, 'keep.txt'), 'keep');
    for (const input of [
      '../project-secret/secret.mmd',
      path.join(fixture, 'project-secret/secret.mmd'),
    ]) {
      await writeConfig(input);
      await expect(buildStatic({ config, outDir })).rejects.toThrow();
      expect(await fs.readFile(path.join(outDir, 'keep.txt'), 'utf-8')).toBe(
        'keep',
      );
    }
    await writeConfig();
    await expect(buildStatic({ config, outDir })).rejects.toThrow('nonempty');
    expect(await fs.readFile(path.join(outDir, 'keep.txt'), 'utf-8')).toBe(
      'keep',
    );
  });

  it('rejects project ancestors, input folders and output symlinks without deleting inputs', async () => {
    for (const outDir of [fixture, project, path.join(project, 'src')]) {
      await expect(buildStatic({ config, outDir })).rejects.toThrow('Unsafe');
    }
    const link = path.join(fixture, 'output-link');
    await fs.symlink(project, link);
    await expect(buildStatic({ config, outDir: link })).rejects.toThrow(
      'Unsafe',
    );
    expect(
      await fs.readFile(path.join(project, 'src/diagram.mmd'), 'utf-8'),
    ).toContain('Safe');
  });

  it('rejects external symlink inputs before creating output', async () => {
    const outDir = path.join(fixture, 'output');
    await fs.symlink(
      path.join(fixture, 'project-secret/secret.mmd'),
      path.join(project, 'src/link.mmd'),
    );
    await expect(buildStatic({ config, outDir })).rejects.toThrow('symlink');
    await expect(fs.stat(outDir)).rejects.toThrow();
  });
});
