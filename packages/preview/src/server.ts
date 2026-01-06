/**
 * Local development server for preview
 */

import { exec } from 'child_process';
import path from 'path';
import { build } from './builder.js';
import type { ServeOptions } from './types.js';

export async function serve(options: ServeOptions): Promise<void> {
  const { config, port } = options;

  // Build first
  const outDir = path.join(process.cwd(), '.polagram-preview-tmp');
  await build({ config, outDir });

  console.log(`Starting preview server on port ${port}...`);
  console.log(`Preview available at http://localhost:${port}`);

  // Use npx serve to serve the built files
  const serverProcess = exec(`npx -y serve -l ${port} ${outDir}`, {
    cwd: process.cwd(),
  });

  serverProcess.stdout?.pipe(process.stdout);
  serverProcess.stderr?.pipe(process.stderr);

  // Keep the process alive
  await new Promise(() => {});
}
