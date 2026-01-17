
import type { TargetConfig } from '@polagram/core';
import { validateConfig } from '@polagram/core';
import { glob } from 'glob';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import picocolors from 'picocolors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface BuildOptions {
  config: string; // "polagram.yml"
  outDir?: string;
}

export async function buildStatic(options: BuildOptions) {
  const configPath = path.resolve(process.cwd(), options.config);
  const outDir = path.resolve(process.cwd(), options.outDir || 'dist-preview');
  const projectRoot = path.dirname(configPath); // Assuming config is at root of what we want to preview

  console.log(picocolors.blue(`Building Polagram Preview to ${outDir}...`));

  // 1. Copy Client Artifacts
  // dist/node/index.js -> ../client
  const clientDist = path.resolve(__dirname, '../client');

  try {
    await fs.stat(clientDist);
  } catch (_e) {
    throw new Error(
      `Client build not found at ${clientDist}. Please run "pnpm build" in packages/preview.`,
    );
  }

  // Clean & Create outDir
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  // Copy everything from dist/client to outDir
  await fs.cp(clientDist, outDir, { recursive: true });

  // 2. Generate config.json (Expanded)
  // Logic duplicated from server.ts - ideally shared.
  // For now duplicating for speed, but refactor later.
  const content = await fs.readFile(configPath, 'utf-8');
  // Dynamic import js-yaml (should be in deps)
  const yaml = await import('js-yaml');
  const parsed = validateConfig(yaml.load(content));

  // Resolve files
  const enrichedTargets = await Promise.all(
    (parsed.targets || []).map(async (t: TargetConfig) => {
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

  // Write api/config.json
  // Client attempts fetch('/__api/config') -> fail -> fetch('api/config.json') ?
  // My useConfig hook has fallback: `fetch('api/config.json')`.
  // Wait, `/__api/config` is root relative. Static hosting usually implies root.
  // Let's create `api/config.json` inside outDir.
  await fs.mkdir(path.join(outDir, 'api'), { recursive: true });
  await fs.writeFile(
    path.join(outDir, 'api', 'config.json'),
    JSON.stringify(parsed),
  );

  // 3. Copy Input Files (Mocking /__api/file?path=...)
  // The client fallback is: `fetch('api/file/${filePath}')`
  // So we need to put files in `outDir/api/file/...`
  // We need to collect ALL distinct files from all targets.
  const allFiles = new Set<string>();
  enrichedTargets.forEach((t: TargetConfig & { _files?: string[] }) => {
    if (Array.isArray(t._files)) {
      t._files.forEach((f: string) => {
        allFiles.add(f);
      });
    }
  });

  console.log(picocolors.dim(`  Copying ${allFiles.size} input files...`));

  for (const fileRelPath of allFiles) {
    const src = path.resolve(projectRoot, fileRelPath);
    // Construct dest: outDir/api/file/path/to/file.mmd
    const dest = path.join(outDir, 'api', 'file', fileRelPath);

    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }

  // Also copy polagram.yml itself if needed? Not really, we baked it into config.json.

  console.log(picocolors.green(`Build complete.`));
}
