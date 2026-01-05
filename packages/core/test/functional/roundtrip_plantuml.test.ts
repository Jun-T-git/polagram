
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { PlantUMLGeneratorVisitor } from '../../src/generator/generators/plantuml';
import { ParserFactory } from '../../src/parser';

const FIXTURES_DIR = join(__dirname, '../fixtures/roundtrip');

/**
 * Normalizes PlantUML code for comparison.
 * - Trims whitespace
 * - Removes blank lines
 * - Ignores comments
 */
function normalize(code: string): string {
  return code
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith("'")) // Ignore PlantUML comments
    .join('\n');
}

describe('PlantUML Roundtrip Tests', () => {
  const files = readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.puml'));

  files.forEach(file => {
    it(`should roundtrip ${file} without information loss`, () => {
      const originalCode = readFileSync(join(FIXTURES_DIR, file), 'utf-8');
      
      // 1. Parse: Factory -> Strategy -> AST
      const parser = ParserFactory.getParser('plantuml');
      const ast = parser.parse(originalCode);

      // 2. Generate: Visitor -> PlantUML
      const generator = new PlantUMLGeneratorVisitor();
      const generatedCode = generator.generate(ast);

      // 3. Compare (Normalize both to avoid trivial whitespace diffs)
      const normOriginal = normalize(originalCode);
      const normGenerated = normalize(generatedCode);

      // Helpful failure message showing diff
      if (normOriginal !== normGenerated) {
        console.log(`--- Original (${file}) ---\n${normOriginal}`);
        console.log(`--- Generated (${file}) ---\n${normGenerated}`);
      }

      expect(normGenerated).toBe(normOriginal);
    });
  });
});
