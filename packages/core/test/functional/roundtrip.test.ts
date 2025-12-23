
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { ParserFactory } from '../../src/parser';
import { MermaidGeneratorVisitor } from '../../src/visitor/generators/mermaid';

const FIXTURES_DIR = join(__dirname, '../fixtures/roundtrip');

/**
 * Normalizes Mermaid code for comparison.
 * - Trims whitespace
 * - Removes blank lines
 * - Unifies indentation (optional, but good for robustness)
 * - Ignores comments if necessary
 */
function normalize(code: string): string {
  return code
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('%%')) // Ignore detailed comments, but keep semantics
    .join('\n');
}

describe('Mermaid Roundtrip Tests', () => {
  const files = readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.mmd'));

  files.forEach(file => {
    it(`should roundtrip ${file} without information loss`, () => {
      const originalCode = readFileSync(join(FIXTURES_DIR, file), 'utf-8');
      
      // 1. Parse: Factory -> Strategy -> AST
      const parser = ParserFactory.getParser('mermaid');
      const ast = parser.parse(originalCode);

      // 2. Generate: Visitor -> Mermaid
      const generator = new MermaidGeneratorVisitor();
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
