
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const execAsync = promisify(exec);

const CLI_PATH = path.resolve(__dirname, '../../dist/index.js');
const FIXTURE_DIR = path.resolve(__dirname, 'error-handling-fixture');

describe('CLI: Error Handling', () => {
    beforeAll(async () => {
        await fs.mkdir(FIXTURE_DIR, { recursive: true });
    });

    afterAll(async () => {
        await fs.rm(FIXTURE_DIR, { recursive: true, force: true });
    });

    beforeEach(async () => {
        // Clean directory contents between tests
        const files = await fs.readdir(FIXTURE_DIR);
        for (const file of files) {
            await fs.rm(path.join(FIXTURE_DIR, file), { recursive: true, force: true });
        }
    });

    it('should fail when config file is missing', async () => {
        // No polagram.yml created
        try {
            await execAsync(`node ${CLI_PATH} generate`, { cwd: FIXTURE_DIR });
            expect.fail('Command should have failed');
        } catch (error: any) {
            expect(error.code).not.toBe(0);
            expect(error.stderr).toContain('Fatal error');
        }
    });

    it('should fail when config schema is invalid', async () => {
        const invalidConfig = `
version: 1
# Targets missing
lenses: []
`;
        await fs.writeFile(path.join(FIXTURE_DIR, 'polagram.yml'), invalidConfig);

        try {
            await execAsync(`node ${CLI_PATH} generate`, { cwd: FIXTURE_DIR });
            expect.fail('Command should have failed');
        } catch (error: any) {
            expect(error.code).not.toBe(0);
            expect(error.stderr).toContain('Invalid Polagram Configuration');
        }
    });

    it('should continue processing other files when one file fails', async () => {
        // Setup valid config
        const config = `
version: 1
targets:
  - input: ["*.mmd"]
    outputDir: "gen"
    lenses:
      - name: demo
        layers: []
`;
        await fs.writeFile(path.join(FIXTURE_DIR, 'polagram.yml'), config);

        // 1. Valid file
        await fs.writeFile(path.join(FIXTURE_DIR, 'valid.mmd'), 'sequenceDiagram\nA->>B: Hi');

        // 2. "Fail" file (content is fine, but we will block output)
        await fs.writeFile(path.join(FIXTURE_DIR, 'fail.mmd'), 'sequenceDiagram\nA->>B: Fail');

        // Pre-create output dir and BLOCK the output file for 'fail.mmd'
        const outputDir = path.join(FIXTURE_DIR, 'gen');
        await fs.mkdir(outputDir, { recursive: true });
        
        const blockedOutputFile = path.join(outputDir, 'fail.demo.mmd');
        await fs.writeFile(blockedOutputFile, 'initial content');
        await fs.chmod(blockedOutputFile, 0o444); // Read-only

        try {
            await execAsync(`node ${CLI_PATH} generate`, { cwd: FIXTURE_DIR });
            expect.fail('Command should have failed due to write error');
        } catch (error: any) {
            // Assert exit code 1 (set by catch block in CLI)
            expect(error.code).toBe(1);
            
            // Verify 'fail.mmd' caused an error log
            expect(error.stderr).toMatch(/Error processing .*fail\.mmd/);

            // Verify 'valid.mmd' WAS generated (Logic continued)
            const validOutput = path.join(outputDir, 'valid.demo.mmd');
            await expect(fs.stat(validOutput)).resolves.toBeDefined();
        } finally {
            // Restore permissions so cleanup works
            try {
               await fs.chmod(blockedOutputFile, 0o666); 
            } catch {}
        }
    });
});
