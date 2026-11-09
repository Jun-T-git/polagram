import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import picocolors from 'picocolors';
import { isWithin, loadPreviewConfig, resolveInput } from './boundary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const marker = '.polagram-preview-build';

export interface BuildOptions {
  config: string;
  outDir?: string;
}

// Resolve existing ancestors too: an output reached through a symlink must not
// turn a seemingly harmless directory into the project or one of its parents.
async function outputRealPath(candidate: string): Promise<string> {
  try {
    return await fs.realpath(candidate);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return path.join(
      await outputRealPath(path.dirname(candidate)),
      path.basename(candidate),
    );
  }
}

export async function buildStatic(options: BuildOptions) {
  const configPath = path.resolve(process.cwd(), options.config);
  const outDir = path.resolve(process.cwd(), options.outDir || 'dist-preview');
  const projectRoot = path.dirname(configPath);
  const clientDist = path.resolve(__dirname, '../client');
  const realRoot = await fs.realpath(projectRoot);
  const realClient = await fs.realpath(clientDist);
  const realOut = await outputRealPath(outDir);
  if (
    isWithin(realOut, realRoot) ||
    isWithin(realOut, realClient) ||
    isWithin(realClient, realOut)
  ) {
    throw new Error(
      'Unsafe preview output directory: overlaps project root or client build',
    );
  }

  // Validate every input before modifying any output.
  const { config, allowedFiles } = await loadPreviewConfig(
    configPath,
    projectRoot,
  );
  const files = await Promise.all(
    [...allowedFiles].map(async (file) => {
      const source = await resolveInput(projectRoot, projectRoot, file);
      if (isWithin(realOut, source))
        throw new Error(
          'Unsafe preview output directory: contains input files',
        );
      return { file, source };
    }),
  );
  try {
    const stat = await fs.lstat(outDir);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error('Unsafe preview output directory');
    const entries = await fs.readdir(outDir);
    if (
      entries.length &&
      !(await fs.lstat(path.join(outDir, marker)).catch(() => null))?.isFile()
    ) {
      throw new Error(
        'Refusing to replace a nonempty directory without a Polagram preview build marker',
      );
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  console.log(picocolors.blue(`Building Polagram Preview to ${outDir}...`));
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
  await fs.cp(clientDist, outDir, { recursive: true });
  await fs.mkdir(path.join(outDir, 'api'), { recursive: true });
  await fs.writeFile(
    path.join(outDir, 'api', 'config.json'),
    JSON.stringify(config),
  );
  for (const { file } of files) {
    // Recheck symlink containment immediately before copying.
    const source = await resolveInput(projectRoot, projectRoot, file);
    const destination = path.resolve(outDir, 'api', 'file', file);
    if (!isWithin(path.join(outDir, 'api', 'file'), destination))
      throw new Error('Unsafe preview copy destination');
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
  }
  await fs.writeFile(path.join(outDir, marker), 'Polagram preview output\n');
  console.log(picocolors.green('Build complete.'));
}
