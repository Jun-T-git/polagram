#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { type DiagramFormat, FormatDetector, Polagram } from '@polagram/core';
import { Command } from 'commander';
import { glob } from 'glob';
import { loadConfig } from './config.js';
import { previewCommand } from './preview.js';

const program = new Command();

program
  .name('polagram')
  .description('CLI tool for Polagram - Sequence Diagram CI/CD')
  .version('0.0.1');

program.addCommand(previewCommand);

program
  .command('generate')
  .description('Generate diagrams based on polagram.yml')
  .option(
    '-c, --config <path>',
    'Path to config file',
    process.env.POLAGRAM_CONFIG || 'polagram.yml',
  )
  .action(async (options) => {
    try {
      console.log(`Loading config from ${options.config}...`);
      // Resolve config path to absolute to determine the base directory
      const configPath = path.resolve(process.cwd(), options.config);
      const configDir = path.dirname(configPath);
      const config = await loadConfig(configPath);

      console.log(`Found ${config.targets.length} targets.`);

      for (const target of config.targets) {
        const ignores = [
          '**/node_modules/**',
          '**/dist/**',
          ...(target.ignore || []),
        ];

        // Search for files relative to the config file directory
        const files = await glob(target.input, {
          ignore: ignores,
          cwd: configDir,
          absolute: true,
        });

        if (files.length === 0) {
          console.warn(`No files found for input: ${target.input}`);
          continue;
        }

        console.log(`Processing ${files.length} files...`);

        for (const file of files) {
          const content = await fs.readFile(file, 'utf-8');
          // Calculate relative path from the config directory to the input file
          const relativePath = path.relative(configDir, file);

          try {
            // Determine input format
            const inputFormat: DiagramFormat | null =
              target.format || FormatDetector.detect(file, content);
            if (!inputFormat) {
              console.error(
                `  Cannot detect format for ${relativePath}. Please specify 'format' in config.`,
              );
              process.exitCode = 1;
              continue;
            }

            // Determine output format (defaults to input format)
            const outputFormat: DiagramFormat =
              target.outputFormat || inputFormat;

            // 1. Initialize Pipeline with detected format (parsing check)
            Polagram.init(content, inputFormat);

            // 2. Apply Lenses
            for (const lens of target.lenses) {
              const lensPipeline = Polagram.init(content, inputFormat);
              // core expects strict discriminated union, Zod inferred type is loose.
              // Validation guarantees structure.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              lensPipeline.applyLens(lens as any);

              // 3. Generate based on output format
              const result =
                outputFormat === 'plantuml'
                  ? lensPipeline.toPlantUML()
                  : lensPipeline.toMermaid();

              // 4. Output
              const originalExt = path.extname(file);
              const basename = path.basename(file, originalExt);
              const suffix = lens.suffix || `.${lens.name}`;
              const outputExt =
                FormatDetector.getDefaultExtension(outputFormat);
              const newFilename = `${basename}${suffix}${outputExt}`;

              // Mirroring Logic:
              // input: src/foo/bar.mmd -> relativePath: src/foo/bar.mmd (relative to configDir)
              // outputDir is resolved relative to configDir

              const fileDir = path.dirname(relativePath); // src/foo
              // target.outputDir is relative to configDir, so we join them: configDir + target.outputDir + fileDir
              const absOutputDir = path.resolve(configDir, target.outputDir);
              const finalOutputDir = path.join(absOutputDir, fileDir); // /path/to/config/generated/src/foo

              await fs.mkdir(finalOutputDir, { recursive: true });
              const outputPath = path.join(finalOutputDir, newFilename);

              await fs.writeFile(outputPath, result);
              console.log(
                `  Derived: ${relativePath} -> ${path.relative(configDir, outputPath)}`,
              );
            }
          } catch (err: unknown) {
            console.error(
              `  Error processing ${relativePath}: ${err instanceof Error ? err.message : String(err)}`,
            );
            // Continue with next file? Yes, usually CI tools shouldn't crash fully on one file unless strict.
            // But maybe we want to track errors and exit non-zero at end.
            process.exitCode = 1;
          }
        }
      }
      console.log('Done.');
    } catch (error: unknown) {
      console.error(
        'Fatal error:',
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

program.parse();
