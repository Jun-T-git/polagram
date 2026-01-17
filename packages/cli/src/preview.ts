import path from 'node:path';
import { Command } from 'commander';

export const previewCommand = new Command('preview')
  .description('Start preview server or build static site')
  .option(
    '-c, --config <path>',
    'Path to config file',
    process.env.POLAGRAM_CONFIG || 'polagram.yml',
  )
  .option('-p, --port <number>', 'Port to run server on', '6006')
  .option('-b, --build', 'Build static site')
  .option('-o, --out-dir <dir>', 'Output directory for build', 'dist-preview')
  .action(async (options) => {
    const configPath = options.config;
    try {
      // Dynamic import to avoid loading preview logic (and React deps) when running other commands
      // Although currently it is a direct dependency.
      const { startServer, buildStatic } = await import('@polagram/preview');

      const absoluteConfigPath = path.resolve(process.cwd(), configPath);

      if (options.build) {
        await buildStatic({
          config: absoluteConfigPath,
          outDir: options.outDir,
        });
      } else {
        await startServer({
          config: absoluteConfigPath,
          port: parseInt(options.port, 10),
        });
        // Keep process alive
      }
    } catch (error) {
      console.error('Preview failed:', error);
      process.exit(1);
    }
  });
