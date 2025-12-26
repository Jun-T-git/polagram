import { describe, expect, it } from 'vitest';
import { Polagram } from '../../src/api';

const sampleCode = `sequenceDiagram
    participant A
    participant B
    participant C
    A->>B: Message 1
    B->>C: Message 2
    C->>A: Message 3`;

function normalize(code: string): string {
  return code
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('%%'))
    .join('\n');
}

describe('Fluent API Tests', () => {
  describe('Basic Chaining', () => {
    it('should support focus with string selector', () => {
      const result = Polagram.init(sampleCode)
        .focusParticipant('B')
        .toMermaid();
      
      expect(normalize(result)).toContain('participant B');
      expect(normalize(result)).toContain('A->>B: Message 1');
      expect(normalize(result)).toContain('B->>C: Message 2');
    });

    it('should support remove with string selector', () => {
      const result = Polagram.init(sampleCode)
        .hideParticipant('B')
        .toMermaid();
      
      const normalized = normalize(result);
      expect(normalized).not.toContain('participant B');
      expect(normalized).toContain('C->>A: Message 3');
    });
  });

  describe('RegExp Selectors', () => {
    it('should support focus with RegExp', () => {
      const code = `sequenceDiagram
    participant PaymentService
    participant DebugLogger
    participant InventoryService
    PaymentService->>InventoryService: Check stock`;

      const result = Polagram.init(code)
        .focusParticipant(/.*Service$/)
        .toMermaid();
      
      const normalized = normalize(result);
      expect(normalized).toContain('PaymentService');
      expect(normalized).toContain('InventoryService');
      expect(normalized).not.toContain('DebugLogger');
    });

    it('should support remove with RegExp', () => {
      const code = `sequenceDiagram
    participant PaymentService
    participant DebugLogger
    participant ErrorLogger
    PaymentService->>DebugLogger: Log
    PaymentService->>ErrorLogger: Error`;

      const result = Polagram.init(code)
        .hideParticipant(/^Debug.*/)
        .toMermaid();
      
      const normalized = normalize(result);
      expect(normalized).not.toContain('DebugLogger');
      expect(normalized).toContain('PaymentService');
      expect(normalized).toContain('ErrorLogger');
    });
  });

  describe('Object Selectors', () => {
    it('should support focus with object selector', () => {
      const result = Polagram.init(sampleCode)
        .focusParticipant({ text: 'B' })
        .toMermaid();
      
      expect(normalize(result)).toContain('participant B');
    });
  });

  describe('Method Chaining', () => {
    it('should support multiple transformations', () => {
      const code = `sequenceDiagram
    participant A
    participant B
    participant C
    participant D
    A->>B: Message 1
    B->>C: Message 2
    C->>D: Message 3
    D->>A: Message 4`;

      const result = Polagram.init(code)
        .hideParticipant('D')
        .focusParticipant('B')
        .toMermaid();
      
      const normalized = normalize(result);
      expect(normalized).toContain('participant B');
      expect(normalized).not.toContain('participant D');
    });
  });

  describe('Unwrap', () => {
    it('should unwrap fragments', () => {
      const code = `sequenceDiagram
    participant A
    participant B
    opt Option
        A->>B: Message
    end`;

      const result = Polagram.init(code)
        .focusFragment('Option')
        .toMermaid();
      
      const normalized = normalize(result);
      expect(normalized).not.toContain('opt');
      expect(normalized).toContain('A->>B: Message');
    });
  });

  describe('toAST', () => {
    it('should return transformed AST', () => {
      const ast = Polagram.init(sampleCode)
        .focusParticipant('B')
        .toAST();
      
      expect(ast).toBeDefined();
      expect(ast.participants).toBeDefined();
      expect(ast.events).toBeDefined();
    });
  });
});
