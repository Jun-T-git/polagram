import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { MermaidGeneratorVisitor } from '../../src/generator/generators/mermaid';
import { ParserFactory } from '../../src/parser';
import { TransformationEngine } from '../../src/transformer/orchestration/engine';
import { TransformRule } from '../../src/transformer/types';

const FIXTURES_DIR = join(__dirname, '../fixtures/transform');

function normalize(code: string): string {
  return code
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('%%'))
    .join('\n');
}

function runTest(subDir: string, fileName: string, rules: TransformRule[]) {
  const inputPath = join(FIXTURES_DIR, subDir, `${fileName}.mmd`);
  const expectedPath = join(FIXTURES_DIR, subDir, `${fileName}_expected.mmd`);
  
  const inputCode = readFileSync(inputPath, 'utf-8');
  const expectedCode = readFileSync(expectedPath, 'utf-8');

  // 1. Parse
  const parser = ParserFactory.getParser('mermaid');
  const ast = parser.parse(inputCode);

  // 2. Transform
  const engine = new TransformationEngine();
  const transformedAst = engine.transform(ast, rules);

  // 3. Generate
  const generator = new MermaidGeneratorVisitor();
  const generatedCode = generator.generate(transformedAst);

  // 4. Compare
  const normGenerated = normalize(generatedCode);
  const normExpected = normalize(expectedCode);

  if (normGenerated !== normExpected) {
    console.log(`--- Transformed Output (${subDir}/${fileName}) ---\n${normGenerated}`);
    console.log(`--- Expected Output (${subDir}/${fileName}) ---\n${normExpected}`);
  }

  expect(normGenerated).toBe(normExpected);
}

describe('Transformer Functional Tests', () => {
  describe('Focus', () => {
    it('should focus on participant B', () => {
      runTest('focus', '01_simple', [{
        action: 'focus',
        selector: { kind: 'participant', text: 'B' }
      }]);
    });
  });

  describe('Remove', () => {
    it('should remove participant B', () => {
      runTest('remove', '01_simple', [{
        action: 'remove',
        selector: { kind: 'participant', text: 'B' }
      }]);
    });
  });

  describe('Unwrap', () => {
    it('should unwrap option blocks', () => {
      runTest('unwrap', '01_opt', [{
        action: 'unwrap',
        selector: { kind: 'branch', text: 'Option' }
      }]);
    });
  });
});
