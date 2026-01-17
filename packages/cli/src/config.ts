import { promises as fs } from 'node:fs';
import { type PolagramConfig, validateConfig } from '@polagram/core';
import yaml from 'js-yaml';

export async function loadConfig(path: string): Promise<PolagramConfig> {
  try {
    const content = await fs.readFile(path, 'utf-8');
    const raw = yaml.load(content);
    return validateConfig(raw);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Configuration file not found at: ${path}`);
    }
    if (error instanceof Error) {
      // If it's a validation error from Core, it will have a nice message already.
      // If it's a YAML syntax error, js-yaml throws formatted errors too.
      throw error;
    }
    throw new Error(`Unknown error loading config: ${String(error)}`);
  }
}
