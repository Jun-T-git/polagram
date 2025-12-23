import { describe, expect, it } from 'vitest';
import type { AyatoriRoot } from '../src/ast';
import { Lexer } from '../src/lexer';
import { Parser } from '../src/parser';

describe('Mermaid Parser', () => {
  const parse = (input: string): AyatoriRoot => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    return parser.parse();
  };

  describe('Basic Document Structure', () => {
    it('should parse "sequenceDiagram" header', () => {
      const input = `sequenceDiagram`;
      const ast = parse(input);

      expect(ast.kind).toBe('root');
      expect(ast.meta.source).toBe('mermaid');
      expect(ast.participants).toEqual([]);
      expect(ast.events).toEqual([]);
    });

    it('should handle newlines around header', () => {
      const input = `
sequenceDiagram
`;
      const ast = parse(input);
      expect(ast.meta.source).toBe('mermaid');
    });
  });

  describe('Participant Definitions', () => {
    it('should parse simple participant', () => {
      const input = `
sequenceDiagram
participant Alice
participant Bob
`;
      const ast = parse(input);
      
      expect(ast.participants).toHaveLength(2);
      expect(ast.participants[0]).toMatchObject({
        id: 'Alice',
        name: 'Alice',
        type: 'participant'
      });
      expect(ast.participants[1]).toMatchObject({
        id: 'Bob',
        name: 'Bob',
        type: 'participant'
      });
    });
  });

  describe('Message Definitions', () => {
    it('should parse sync message and implicit participants', () => {
      const input = `
sequenceDiagram
A->B: Hello
`;
      const ast = parse(input);

      expect(ast.participants).toHaveLength(2);
      expect(ast.participants).toMatchObject([
        { id: 'A', name: 'A' },
        { id: 'B', name: 'B' }
      ]);

      expect(ast.events).toHaveLength(1);
      expect(ast.events[0]).toMatchObject({
        kind: 'message',
        from: 'A',
        to: 'B',
        text: 'Hello',
        type: 'sync',
        style: { line: 'solid', head: 'open' }
      });
    });
  });

  describe('Fragment Definitions', () => {
    it('should parse loop fragment', () => {
      const input = `
sequenceDiagram
loop Every minute
  A->B: Check
end
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);
      
      const fragment = ast.events[0];
      expect(fragment.kind).toBe('fragment');
      if (fragment.kind !== 'fragment') return; // type guard
      
      expect(fragment.operator).toBe('loop');
      expect(fragment.branches).toHaveLength(1);
      expect(fragment.branches[0].condition).toBe('Every minute');
      expect(fragment.branches[0].events).toHaveLength(1);
      expect(fragment.branches[0].events[0].kind).toBe('message');
    });
  });
});
