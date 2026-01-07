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
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('%%'))
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
        .removeParticipant('B')
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
        .removeParticipant(/^Debug.*/)
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
        .focusParticipant({ name: 'B' })
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
        .removeParticipant('D')
        .focusParticipant('B')
        .toMermaid();

      const normalized = normalize(result);
      expect(normalized).toContain('participant B');
      expect(normalized).not.toContain('participant D');
    });
  });

  describe('ResolveFragment', () => {
    it('should resolve (unwrap) fragments', () => {
      const code = `sequenceDiagram
    participant A
    participant B
    opt Option
        A->>B: Message
    end`;

      const result = Polagram.init(code).resolveFragment('Option').toMermaid();

      const normalized = normalize(result);
      expect(normalized).not.toContain('opt');
      expect(normalized).toContain('A->>B: Message');
    });
  });

  describe('toAST', () => {
    it('should return transformed AST', () => {
      const ast = Polagram.init(sampleCode).focusParticipant('B').toAST();

      expect(ast).toBeDefined();
      expect(ast.participants).toBeDefined();
      expect(ast.events).toBeDefined();
    });
  });

  describe('Lens API', () => {
    it('should apply a lens object', () => {
      const lens = {
        name: 'Test Lens',
        layers: [
          {
            action: 'remove' as const,
            selector: { kind: 'participant' as const, name: 'B' },
          },
        ],
      };

      const result = Polagram.init(sampleCode).applyLens(lens).toMermaid();

      const normalized = normalize(result);
      expect(normalized).not.toContain('participant B');
      expect(normalized).toContain('C->>A: Message 3');
    });

    it('should chain applyLens with other methods', () => {
      const lens = {
        name: 'Focus Lens',
        layers: [
          {
            action: 'focus' as const,
            selector: { kind: 'participant' as const, name: 'B' },
          },
        ],
      };

      // Original: A->B, B->C, C->A
      // Lens (Focus B): Keeps A->B, B->C. Removes C->A.
      // Chained (.removeMessage "Message 1"): Removes A->B.
      // Expected Result: Only B->C remains.

      const result = Polagram.init(sampleCode)
        .applyLens(lens)
        .removeMessage({ pattern: 'Message 1' })
        .toMermaid();

      const normalized = normalize(result);

      // Focus B effects
      expect(normalized).toContain('participant B');
      expect(normalized).not.toContain('C->>A: Message 3');

      // Remove Message 1 effects
      expect(normalized).not.toContain('A->>B: Message 1');

      // Remaining interaction
      expect(normalized).toContain('B->>C: Message 2');
    });

    it('should resolve loop in complex diagram', () => {
      const complexCode = `sequenceDiagram
    participant User
    participant Auth
    participant Logic
    participant DB
    
    loop Retry
        Logic->>DB: Query
    end`;

      // Debug: Just resolve
      const result = Polagram.init(complexCode)
        .resolveFragment({ condition: 'Retry' })
        .toMermaid();

      const normalized = normalize(result);
      expect(normalized).not.toContain('loop Retry');
      expect(normalized).toContain('Logic->>DB: Query');
    });

    it('should remove participant in complex diagram', () => {
      const complexCode = `sequenceDiagram
      participant User
      participant Auth
      participant Logic
      participant DB
      
      User->>Auth: Login
      Logic->>DB: Query`;

      // Debug: Just remove Auth
      const result = Polagram.init(complexCode)
        .removeParticipant('Auth')
        .toMermaid();

      const normalized = normalize(result);
      expect(normalized).not.toContain('participant Auth');
      expect(normalized).not.toContain('User->>Auth: Login');
      expect(normalized).toContain('Logic->>DB: Query');
    });

    it('should resolve loop AND remove participant', () => {
      const complexCode = `sequenceDiagram
    participant User
    participant Auth
    participant Logic
    participant DB
    
    User->>Auth: Login
    
    loop Retry
        Logic->>DB: Query
    end`;

      // Chain Resolve + Remove
      const result = Polagram.init(complexCode)
        .resolveFragment({ condition: 'Retry' })
        .removeParticipant('Auth')
        .toMermaid();

      const normalized = normalize(result);

      expect(normalized).not.toContain('loop Retry'); // Resolved
      expect(normalized).not.toContain('participant Auth'); // Removed
      expect(normalized).not.toContain('User->>Auth: Login'); // Interaction Removed
      expect(normalized).toContain('Logic->>DB: Query'); // Content Kept
    });

    it('should apply a complex lens with multiple layers', () => {
      const complexCode = `sequenceDiagram
    participant User
    participant Auth
    participant Logic
    participant DB
    
    User->>Auth: Login
    Auth->>DB: Check User
    DB-->>Auth: OK
    
    loop Retry
        Logic->>DB: Query
        DB-->>Logic: Result
    end
    
    Logic->>Logic: Debug: Calculation done`;

      const complexLens = {
        name: 'Clean Logic View',
        layers: [
          // 1. Unwrap the retry loop
          {
            action: 'resolve' as const,
            selector: { kind: 'fragment' as const, condition: 'Retry' },
          },
          // 2. Remove Auth layer
          {
            action: 'remove' as const,
            selector: { kind: 'participant' as const, name: 'Auth' },
          },
          // 3. Remove Debug logs
          {
            action: 'remove' as const,
            selector: {
              kind: 'message' as const,
              text: { pattern: '^Debug:' },
            },
          },
        ],
      };

      const result = Polagram.init(complexCode)
        .applyLens(complexLens)
        .toMermaid();

      const normalized = normalize(result);

      // If this fails again, the individual tests above will hint why.
      expect(normalized).toContain('Logic->>DB: Query');
      expect(normalized).not.toContain('loop Retry');
      expect(normalized).not.toContain('participant Auth');
    });

    it('should preserve unrelated elements (no side effects)', () => {
      const code = `sequenceDiagram
participant User
participant System
Note left of User: Keep this note
User->>User: Local action
opt Ignored
  User->>System: Interaction
end
%% This is a comment
System->>System: Self update`;

      // Action: Remove "System".
      const result = Polagram.init(code)
        .removeParticipant('System')
        .toMermaid();

      const normalized = normalize(result);

      // Verify Removal
      expect(normalized).not.toContain('participant System');
      expect(normalized).not.toContain('User->>System: Interaction');
      expect(normalized).not.toContain('System->>System: Self update');

      // Verify Preservation (Side Effect Check)
      expect(normalized).toContain('participant User');

      // TODO: Parser/Generator bug causes Note to be malformed as 'note over:' (missing content).
      // Verify that at least the node exists (even if text is lost - known issue)
      expect(normalized).toContain('note left of User: Keep this note');
      // expect(normalized).toContain('note over:');

      expect(normalized).toContain('User->>User: Local action');

      const indexParticipant = normalized.indexOf('participant User');
      const indexNote = normalized.indexOf('note left of User');
      expect(indexParticipant).toBeLessThan(indexNote);
    });
  });
});
