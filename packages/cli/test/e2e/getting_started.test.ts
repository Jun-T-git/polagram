
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const execAsync = promisify(exec);

// Path to the CLI executable (built js)
const CLI_PATH = path.resolve(__dirname, '../../dist/index.js');
const FIXTURE_DIR = path.resolve(__dirname, 'getting-started-fixture');

describe('CLI: Getting Started Guide', () => {
    beforeAll(async () => {
        // clean up
        await fs.rm(FIXTURE_DIR, { recursive: true, force: true });
        await fs.mkdir(FIXTURE_DIR, { recursive: true });

        // 1. Create polagram.yml (from docs)
        const config = `
version: 1
targets:
  - input: ["diagram.mmd"]
    outputDir: "generated"
    lenses:
      - name: clean-view
        layers:
          # 1. Hide the Logger participant (Remove)
          - action: remove
            selector:
              kind: participant
              name: Logger
              
          # 2. Focus only on critical path participants (Focus)
          # Note: In our test diagram, we'll use "API" as the focused element
          - action: focus
            selector:
              kind: participant
              name: API
              
          # 3. Simplify success scenarios (Resolve)
          - action: resolve
            selector:
              kind: fragment
              condition:
                pattern: "Success:.*"
`;
        await fs.writeFile(path.join(FIXTURE_DIR, 'polagram.yml'), config);

        // 2. Create diagram.mmd (Compatible with the config above)
        const diagram = `
sequenceDiagram
    participant User
    participant API
    participant Logger
    
    User->>API: Request
    API->>Logger: Log Request
    
    alt Success: User found
        API-->>User: 200 OK
    else Error
        API-->>User: 404 Not Found
    end
`;
        await fs.writeFile(path.join(FIXTURE_DIR, 'diagram.mmd'), diagram);
    });

    afterAll(async () => {
        await fs.rm(FIXTURE_DIR, { recursive: true, force: true });
    });

    it('should generate "clean-view" diagram successfully', async () => {
        // 3. Run CLI
        const { stdout, stderr } = await execAsync(`node ${CLI_PATH} generate`, {
            cwd: FIXTURE_DIR
        });

        // Debug output
        if (stderr) console.error('STDERR:', stderr);
        // console.log('STDOUT:', stdout);

        // 4. Verify Output File Exists
        // Expected name: setup says input "diagram.mmd", lens name "clean-view"
        // Default suffix logic: .<lens-name>.mmd -> diagram.clean-view.mmd
        const outputPath = path.join(FIXTURE_DIR, 'generated/diagram.clean-view.mmd');
        
        await expect(fs.stat(outputPath)).resolves.toBeDefined();

        // 5. Verify Content
        const content = await fs.readFile(outputPath, 'utf-8');
        
        // Logger should be removed
        // (Note: as discovered in Core tests, participant definition might remain, but interactions should be gone)
        expect(content).not.toContain('API->>Logger');
        
        // Focus API: User interactions with API should remain.
        expect(content).toContain('User->>API: Request');
        
        // Success fragment should be resolved (unwrapped)
        expect(content).not.toContain('alt Success: User found');
        expect(content).not.toContain('else Error');
        expect(content).toContain('API-->>User: 200 OK');
        // Error case should be gone
        expect(content).not.toContain('API-->>User: 404 Not Found');


        // Strict Verification: Snapshot ensures NO other unintended changes occurred
        // (e.g. formatting, comments, ordering, unrelated nodes)
        await expect(content).toMatchFileSnapshot(path.resolve(__dirname, 'getting_started.snapshot.mmd'));
    });
});
