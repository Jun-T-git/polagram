import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { Polagram } from '../../src/api';

const CROSS_FORMAT_DIR = join(__dirname, '../fixtures/cross-format');

function normalize(code: string): string {
  return code
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith("'") && !line.startsWith('%%'))
    .join('\n');
}

describe('Cross-Format Fixture Tests', () => {
  describe('PlantUML to Mermaid', () => {
    const dir = join(CROSS_FORMAT_DIR, 'plantuml-to-mermaid');
    const files = readdirSync(dir).filter(f => f.endsWith('.puml'));
    
    files.forEach(file => {
      const baseName = file.replace('.puml', '');
      
      it(`should convert ${baseName} from PlantUML to Mermaid`, () => {
        const input = readFileSync(join(dir, file), 'utf-8');
        const expected = readFileSync(join(dir, `${baseName}_expected.mmd`), 'utf-8');
        
        const result = Polagram.init(input, 'plantuml').toMermaid();
        
        const normResult = normalize(result);
        const normExpected = normalize(expected);
        
        if (normResult !== normExpected) {
          console.log(`--- Result (${baseName}) ---\n${normResult}`);
          console.log(`--- Expected (${baseName}) ---\n${normExpected}`);
        }
        
        expect(normResult).toBe(normExpected);
      });
    });
  });
  
  describe('Mermaid to PlantUML', () => {
    const dir = join(CROSS_FORMAT_DIR, 'mermaid-to-plantuml');
    const files = readdirSync(dir).filter(f => f.endsWith('.mmd'));
    
    files.forEach(file => {
      const baseName = file.replace('.mmd', '');
      
      it(`should convert ${baseName} from Mermaid to PlantUML`, () => {
        const input = readFileSync(join(dir, file), 'utf-8');
        const expected = readFileSync(join(dir, `${baseName}_expected.puml`), 'utf-8');
        
        const result = Polagram.init(input, 'mermaid').toPlantUML();
        
        const normResult = normalize(result);
        const normExpected = normalize(expected);
        
        if (normResult !== normExpected) {
          console.log(`--- Result (${baseName}) ---\n${normResult}`);
          console.log(`--- Expected (${baseName}) ---\n${normExpected}`);
        }
        
        expect(normResult).toBe(normExpected);
      });
    });
  });
});
