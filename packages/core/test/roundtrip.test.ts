import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { generateMermaid } from '../src/generators/mermaid';

// Note: This test suite depends on the Parser being implemented.
// If the Lexer/Parser is not yet fully functional, these tests will fail or cannot be run.
// However, the test structure is valid for the "Design" phase of the request.
// For now, I will try to import the parser.
import { Lexer } from '../src/lexer';
import { Parser } from '../src/parser';
const FIXTURES_DIR = join(__dirname, 'fixtures/roundtrip');

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
      
      // 1. Parse: Mermaid -> AST
      const lexer = new Lexer(originalCode);
      const parser = new Parser(lexer);
      const ast = parser.parse();

      // 2. Generate: AST -> Mermaid
      const generatedCode = generateMermaid(ast);

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
