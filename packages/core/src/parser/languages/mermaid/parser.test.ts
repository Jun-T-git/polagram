import { describe, expect, it } from 'vitest';
import type { AyatoriRoot } from '../../../ast';
import { Lexer } from './lexer';
import { Parser } from './parser';

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

  describe('Box/Group Definitions', () => {
    it('should parse box definition with color and name', () => {
      const code = `
  sequenceDiagram
  box "Frontend" #eef
      participant A
      participant B
  end
  box Backend
      participant C
  end
  A->>C: Request
  C-->>A: Response
      `;
  
      const ast = parse(code);
  
      // Verify participants
      expect(ast.participants).toHaveLength(3);
      expect(ast.participants.map(p => p.id)).toEqual(['A', 'B', 'C']);
  
      // Verify groups
      expect(ast.groups).toHaveLength(2);
  
      const group1 = ast.groups[0];
      expect(group1.name).toContain('Frontend'); 
      
      expect(group1.participantIds).toEqual(['A', 'B']);
  
      const group2 = ast.groups[1];
      expect(group2.name).toBe('Backend');
      expect(group2.participantIds).toEqual(['C']);
    });
  
    it('should handle messages inside box block', () => {
      const code = `
  sequenceDiagram
  participant U
  box App
      participant A
      U->>A: inside box
  end
      `;
      const ast = parse(code);
      expect(ast.events).toHaveLength(1);
      expect(ast.events[0].kind).toBe('message');
      expect(ast.groups[0].participantIds).toEqual(['A']);
    });
  });
});
