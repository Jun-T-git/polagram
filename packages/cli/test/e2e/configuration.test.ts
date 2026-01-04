
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const execAsync = promisify(exec);

const CLI_PATH = path.resolve(__dirname, '../../dist/index.js');
const FIXTURE_DIR = path.resolve(__dirname, 'config-fixture');

describe('CLI: Configuration & Structure', () => {
    beforeAll(async () => {
        await fs.rm(FIXTURE_DIR, { recursive: true, force: true });
        await fs.mkdir(FIXTURE_DIR, { recursive: true });
    });

    afterAll(async () => {
        await fs.rm(FIXTURE_DIR, { recursive: true, force: true });
    });

    it('should support custom config path via -c flag', async () => {
        // Create custom config in a subfolder
        const configDir = path.join(FIXTURE_DIR, 'configs');
        await fs.mkdir(configDir, { recursive: true });
        
        // Target: "local" src directory relative to config
        // Output: "local" dist directory relative to config
        const config = `
version: 1
targets:
  - input: ["src/*.mmd"]
    outputDir: "dist"
    lenses:
      - name: custom
        layers: []
`;
        await fs.writeFile(path.join(configDir, 'custom.yml'), config);

        // Create src file INSIDE the config dir to ensure simple relative mirroring
        const srcDir = path.join(configDir, 'src');
        await fs.mkdir(srcDir, { recursive: true });
        await fs.writeFile(path.join(srcDir, 'test.mmd'), 'sequenceDiagram\nA->>B: Hi');

        // Execute with -c (Path relative to CWD=FIXTURE_DIR)
        await execAsync(`node ${CLI_PATH} generate -c configs/custom.yml`, { cwd: FIXTURE_DIR });

        // Verify Output
        // Expected: configs/dist/src/test.custom.mmd
        const expectedOutput = path.join(configDir, 'dist/src/test.custom.mmd');
        const exists = await fs.stat(expectedOutput).then(() => true).catch(() => false);
        expect(exists).toBe(true);
    });

    it('should mirror deep directory structures and respect ignores', async () => {
        const config = `
version: 1
targets:
  - input: ["src/**/*.mmd"]
    outputDir: "gen"
    ignore: ["**/ignored/**"]
    lenses:
      - name: deep
        layers: []
`;
        await fs.writeFile(path.join(FIXTURE_DIR, 'polagram.yml'), config);

        // Structure:
        // src/
        //   app/
        //     feature/
        //       flow.mmd
        //   ignored/
        //     secret.mmd
        
        const featureDir = path.join(FIXTURE_DIR, 'src/app/feature');
        const ignoredDir = path.join(FIXTURE_DIR, 'src/ignored');
        
        await fs.mkdir(featureDir, { recursive: true });
        await fs.mkdir(ignoredDir, { recursive: true });
        
        await fs.writeFile(path.join(featureDir, 'flow.mmd'), 'sequenceDiagram\nA->>B: Flow');
        await fs.writeFile(path.join(ignoredDir, 'secret.mmd'), 'sequenceDiagram\nA->>B: Secret');

        // Execute default config
        await execAsync(`node ${CLI_PATH} generate`, { cwd: FIXTURE_DIR });

        // Verify deep structured output
        const deepOutput = path.join(FIXTURE_DIR, 'gen/src/app/feature/flow.deep.mmd');
        expect(await fs.stat(deepOutput).then(() => true).catch(() => false)).toBe(true);

        // Verify ignore
        const ignoredOutput = path.join(FIXTURE_DIR, 'gen/src/ignored/secret.deep.mmd');
        expect(await fs.stat(ignoredOutput).then(() => true).catch(() => false)).toBe(false);
    });

    it('should not modify source files (no side effects)', async () => {
        // Setup config
        const config = `
version: 1
targets:
  - input: ["src/*.mmd"]
    outputDir: "gen"
    lenses:
      - name: check
        layers: []
`;
        await fs.writeFile(path.join(FIXTURE_DIR, 'polagram.yml'), config);

        // Setup Source File
        const srcDir = path.join(FIXTURE_DIR, 'src');
        await fs.mkdir(srcDir, { recursive: true });
        const srcFile = path.join(srcDir, 'immutable.mmd');
        const originalContent = 'sequenceDiagram\nA->>B: Immutable?';
        await fs.writeFile(srcFile, originalContent);

        // Capture mtime (resolution might be second-based on some FS, so we might need wait? 
        // Content check is more robust for "modification" than mtime if we suspect content rewriting)
        // Let's rely on content identity.
        
        // Execute
        await execAsync(`node ${CLI_PATH} generate`, { cwd: FIXTURE_DIR });

        // Verify Output Exists
        const output = path.join(FIXTURE_DIR, 'gen/src/immutable.check.mmd');
        expect(await fs.stat(output).then(() => true).catch(() => false)).toBe(true);

        // Verify Source Integrity (Side Effect Check)
        const currentContent = await fs.readFile(srcFile, 'utf-8');
        expect(currentContent).toBe(originalContent);
        
        // Ensure source file was NOT executed/deleted/renamed
        expect(await fs.stat(srcFile).then(() => true).catch(() => false)).toBe(true);
    });
});
