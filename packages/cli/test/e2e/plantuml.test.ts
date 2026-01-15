import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const execAsync = promisify(exec);

const CLI_PATH = path.resolve(__dirname, '../../dist/index.js');
const FIXTURE_DIR = path.resolve(__dirname, 'plantuml-e2e-fixture');

describe('PlantUML E2E Tests', () => {
  beforeAll(async () => {
    await fs.rm(FIXTURE_DIR, { recursive: true, force: true });
    await fs.mkdir(FIXTURE_DIR, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(FIXTURE_DIR, { recursive: true, force: true });
  });

  it('should process PlantUML files with transformations', async () => {
    // Create test PlantUML file
    const plantumlContent = `@startuml
participant Client
participant Logger
participant API

Client -> API: Request
API -> Logger: Log
Logger --> API: OK
API --> Client: Response
@enduml`;

    await fs.writeFile(path.join(FIXTURE_DIR, 'test.puml'), plantumlContent);

    // Create polagram.yml
    const config = `version: 1
targets:
  - input: ["*.puml"]
    outputDir: "generated"
    lenses:
      - name: "clean"
        layers:
          - action: remove
            selector: { kind: "participant", name: "Logger" }
`;
    await fs.writeFile(path.join(FIXTURE_DIR, 'polagram.yml'), config);

    // Run CLI
    await execAsync(`node ${CLI_PATH} generate --config polagram.yml`, {
      cwd: FIXTURE_DIR,
    });

    // Verify output
    const outputFile = path.join(FIXTURE_DIR, 'generated', 'test.clean.puml');
    const output = await fs.readFile(outputFile, 'utf-8');

    expect(output).toContain('participant Client');
    expect(output).toContain('participant API');
    expect(output).not.toContain('participant Logger');
    expect(output).toContain('Client -> API: Request');
    expect(output).toContain('API --> Client: Response');
  });

  it('should convert PlantUML to Mermaid via outputFormat', async () => {
    // Create test PlantUML file
    const plantumlContent = `@startuml
participant A
participant B
A -> B: Hello
B --> A: World
@enduml`;

    await fs.writeFile(path.join(FIXTURE_DIR, 'test.puml'), plantumlContent);

    // Create polagram.yml with outputFormat
    const config = `version: 1
targets:
  - input: ["*.puml"]
    outputDir: "generated"
    outputFormat: mermaid
    lenses:
      - name: "converted"
        layers: []
`;
    await fs.writeFile(path.join(FIXTURE_DIR, 'polagram.yml'), config);

    // Run CLI
    await execAsync(`node ${CLI_PATH} generate --config polagram.yml`, {
      cwd: FIXTURE_DIR,
    });

    // Verify output is Mermaid format
    const outputFile = path.join(
      FIXTURE_DIR,
      'generated',
      'test.converted.mmd',
    );
    const output = await fs.readFile(outputFile, 'utf-8');

    expect(output).toContain('sequenceDiagram');
    expect(output).toContain('participant A');
    expect(output).toContain('participant B');
    expect(output).toContain('A->>B: Hello');
    expect(output).toContain('B-->>A: World');
  });
});
