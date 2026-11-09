import { promises as fs } from 'node:fs';
import path from 'node:path';
import { validateConfig } from '@polagram/core';
import { glob } from 'glob';

const diagramExtensions = new Set([
  '.mmd',
  '.mermaid',
  '.puml',
  '.plantuml',
  '.pu',
]);

export class PreviewAccessError extends Error {}

export function isWithin(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== '..' &&
      !path.isAbsolute(relative))
  );
}

export function assertRelativeInput(input: string): void {
  if (
    !input ||
    input.includes('\0') ||
    path.isAbsolute(input) ||
    path.win32.isAbsolute(input) ||
    input.split(/[\\/]/).includes('..')
  ) {
    throw new PreviewAccessError(
      'Access denied: input must be a relative path without parent traversal',
    );
  }
}

export async function resolveInput(
  configDir: string,
  root: string,
  input: string,
): Promise<string> {
  assertRelativeInput(input);
  const candidate = path.resolve(configDir, input);
  if (!isWithin(root, candidate))
    throw new PreviewAccessError('Access denied: input outside project root');
  const realPath = await fs.realpath(candidate);
  if (!isWithin(await fs.realpath(root), realPath))
    throw new PreviewAccessError('Access denied: symlink outside project root');
  return realPath;
}

export async function loadPreviewConfig(
  configPath: string,
  root = path.dirname(configPath),
) {
  const configDir = path.dirname(configPath);
  const yaml = await import('js-yaml');
  const parsed = validateConfig(
    yaml.load(await fs.readFile(configPath, 'utf-8')),
  );
  const allowedFiles = new Set<string>();
  const targets = await Promise.all(
    parsed.targets.map(async (target) => {
      const inputs = Array.isArray(target.input)
        ? target.input
        : [target.input];
      inputs.forEach(assertRelativeInput);
      const matches = await glob(inputs, {
        cwd: configDir,
        ignore: ['**/node_modules/**'],
        nodir: true,
      });
      const files: string[] = [];
      for (const file of matches) {
        if (!diagramExtensions.has(path.extname(file).toLowerCase())) continue;
        await resolveInput(configDir, root, file);
        files.push(file);
        allowedFiles.add(file);
      }
      return { ...target, _files: files };
    }),
  );
  return { config: { ...parsed, targets }, allowedFiles };
}
