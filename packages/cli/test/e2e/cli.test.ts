import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const execAsync = promisify(exec);

const CLI_PATH = path.resolve(__dirname, '../../dist/index.js');
const FIXTURE_DIR = path.resolve(__dirname, 'temp-fixture');

describe('CLI E2E', () => {
    beforeAll(async () => {
        // Setup Teardown
        await fs.rm(FIXTURE_DIR, { recursive: true, force: true });
        await fs.mkdir(FIXTURE_DIR, { recursive: true });

        // Create polagram.yml
        const config = `
version: 1
targets:
  - input: ["src/**/*.mmd"]
    outputDir: "dist"
    lenses:
      - name: "success"
        suffix: ".success"
        layers:
          - action: resolve
            selector: { kind: "fragment", condition: "Success" }
`;
        await fs.writeFile(path.join(FIXTURE_DIR, 'polagram.yml'), config);

        // Create Source File
        const mmd = `
sequenceDiagram
    participant User
    participant API
    alt Success
        User->>API: Req
        API-->>User: Res
    else Error
        API-->>User: 500
    end
`;
        const srcDir = path.join(FIXTURE_DIR, 'src');
        await fs.mkdir(srcDir, { recursive: true });
        await fs.writeFile(path.join(srcDir, 'test.mmd'), mmd);
    });

    afterAll(async () => {
        // Cleanup
        await fs.rm(FIXTURE_DIR, { recursive: true, force: true });
    });

    it('should generate transformed diagrams with correct directory structure', async () => {
        // Run CLI
        // We use node directly to execute the built js
        const { stdout, stderr } = await execAsync(`node ${CLI_PATH} run`, {
            cwd: FIXTURE_DIR
        });

        console.log('CLI Output:', stdout);
        if (stderr) console.error('CLI Error:', stderr);

        // Verify Output Exists
        const outputPath = path.join(FIXTURE_DIR, 'dist/src/test.success.mmd');
        const exists = await fs.stat(outputPath).then(() => true).catch(() => false);
        expect(exists).toBe(true);

        // Verify Content
        const content = await fs.readFile(outputPath, 'utf-8');
        expect(content).toContain('User->>API: Req');
        expect(content).not.toContain('alt Success'); // Fragments should be unwrapped
    });
});
