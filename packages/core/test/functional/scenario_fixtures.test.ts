import { readFileSync, readdirSync } from 'fs';
import { load as loadYaml } from 'js-yaml';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { Polagram } from '../../src/api';

const SCENARIOS_DIR = join(__dirname, '../fixtures/scenarios');

function normalize(code: string): string {
  return code
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith("'") && !line.startsWith('%%'))
    .join('\n');
}

describe('Scenario Fixture Tests', () => {
  const scenarios = readdirSync(SCENARIOS_DIR);
  
  scenarios.forEach(scenario => {
    it(`should execute ${scenario} scenario correctly`, () => {
      const scenarioDir = join(SCENARIOS_DIR, scenario);
      
      // Read files
      const inputFiles = readdirSync(scenarioDir).filter(f => f.startsWith('input.'));
      if (inputFiles.length === 0) {
        throw new Error(`No input file found in ${scenario}`);
      }
      
      const inputFile = inputFiles[0];
      const format = inputFile.endsWith('.puml') ? 'plantuml' : 'mermaid';
      const extension = inputFile.split('.')[1];
      
      const input = readFileSync(join(scenarioDir, inputFile), 'utf-8');
      const configPath = join(scenarioDir, 'config.yml');
      const config: any = loadYaml(readFileSync(configPath, 'utf-8'));
      const expected = readFileSync(join(scenarioDir, `expected.${extension}`), 'utf-8');
      
      // Apply transformation
      let builder = Polagram.init(input, format);
      
      // Apply lens from config
      if (config.layers) {
        builder = builder.applyLens({ name: config.name, layers: config.layers });
      }
      
      // Generate output in same format
      const result = format === 'plantuml' ? builder.toPlantUML() : builder.toMermaid();
      
      // Compare
      const normResult = normalize(result);
      const normExpected = normalize(expected);
      
      if (normResult !== normExpected) {
        console.log(`--- Result (${scenario}) ---\n${normResult}`);
        console.log(`--- Expected (${scenario}) ---\n${normExpected}`);
      }
      
      expect(normResult).toBe(normExpected);
    });
  });
});
