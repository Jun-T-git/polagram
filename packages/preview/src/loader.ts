/**
 * Load polagram.yml and generate preview data
 */

import type { PolagramConfig } from '@polagram/core';
import { FormatDetector, Polagram, validateConfig } from '@polagram/core';
import { promises as fs } from 'fs';
import { glob } from 'glob';
import yaml from 'js-yaml';
import path from 'path';
import type { PreviewCase, PreviewData } from './types.js';

export async function loadPreviewData(configPath: string): Promise<PreviewData> {
  const configDir = path.dirname(path.resolve(configPath));
  const configContent = await fs.readFile(configPath, 'utf-8');
  const rawConfig = yaml.load(configContent) as unknown;
  const config: PolagramConfig = validateConfig(rawConfig);

  const cases: PreviewCase[] = [];

  for (let targetIndex = 0; targetIndex < config.targets.length; targetIndex++) {
    const target = config.targets[targetIndex];
    const ignores = [
      '**/node_modules/**',
      '**/dist/**',
      ...(target.ignore || [])
    ];

    const files = await glob(target.input, {
      ignore: ignores,
      cwd: configDir,
      absolute: true
    });

    for (const file of files) {
      const sourceCode = await fs.readFile(file, 'utf-8');
      const relativePath = path.relative(configDir, file);
      const inputFormat = target.format || FormatDetector.detect(file, sourceCode);

      if (!inputFormat) {
        console.warn(`Cannot detect format for ${relativePath}, skipping.`);
        continue;
      }

      // 0. Add "original" case
      try {
        const originalLens = { name: '(original)', layers: [] };
        const builder = Polagram.init(sourceCode, inputFormat);
        const transformedCode = builder.toMermaid();

        const originalCase: PreviewCase = {
          id: `${targetIndex}/${relativePath}/(original)`,
          targetIndex,
          inputPath: relativePath,
          lensName: '(original)',
          sourceCode,
          transformedCode,
          lens: originalLens
        };
        cases.push(originalCase);
      } catch (error) {
        console.error(`Error processing ${relativePath} with original lens:`, error);
      }

      for (const lens of target.lenses) {
        try {
          const builder = Polagram.init(sourceCode, inputFormat);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          builder.applyLens(lens as any);
          const transformedCode = builder.toMermaid();

          const previewCase: PreviewCase = {
            id: `${targetIndex}/${relativePath}/${lens.name}`,
            targetIndex,
            inputPath: relativePath,
            lensName: lens.name,
            sourceCode,
            transformedCode,
            lens
          };

          cases.push(previewCase);
        } catch (error) {
          console.error(`Error processing ${relativePath} with lens ${lens.name}:`, error);
        }
      }
    }
  }

  return { cases };
}
