/**
 * Build static preview site
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadPreviewData } from './loader.js';
import type { BuildOptions } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function build(options: BuildOptions): Promise<void> {
  const { config, outDir } = options;

  console.log(`Loading config from ${config}...`);
  const previewData = await loadPreviewData(config);
  console.log(`Found ${previewData.cases.length} preview cases.`);

  // Create output directory
  const absoluteOutDir = path.resolve(process.cwd(), outDir);
  await fs.mkdir(absoluteOutDir, { recursive: true });

  // Write preview data as JSON for the React app to consume
  const dataPath = path.join(absoluteOutDir, 'preview-data.json');
  await fs.writeFile(dataPath, JSON.stringify(previewData, null, 2));
  console.log(`Wrote preview data to ${dataPath}`);

  // Build the React app with Vite
  const packageRoot = path.resolve(__dirname, '..');
  const viteConfig = path.join(packageRoot, 'vite.config.ts');

  console.log('Building preview app...');
  execSync(`npx vite build --config ${viteConfig} --outDir ${absoluteOutDir}`, {
    cwd: packageRoot,
    stdio: 'inherit'
  });

  // Move preview-data.json into the built assets
  const finalDataPath = path.join(absoluteOutDir, 'preview-data.json');
  if (dataPath !== finalDataPath) {
    await fs.rename(dataPath, finalDataPath);
  }

  console.log(`Preview site built to ${absoluteOutDir}`);
}
