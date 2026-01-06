import { describe, expect, it } from 'vitest';
import { Polagram } from '../../src/api';

const samplePlantUML = `@startuml
participant A
participant B
participant C
A -> B: Message 1
B -> C: Message 2
C -> A: Message 3
@enduml`;

function normalize(code: string): string {
  return code
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("'"))
    .join('\n');
}

describe('PlantUML Fluent API Tests', () => {
  describe('Basic Chaining', () => {
    it('should support focus with string selector', () => {
      const result = Polagram.init(samplePlantUML, 'plantuml')
        .focusParticipant('B')
        .toPlantUML();

      expect(normalize(result)).toContain('participant B');
      expect(normalize(result)).toContain('A -> B: Message 1');
      expect(normalize(result)).toContain('B -> C: Message 2');
    });

    it('should support remove with string selector', () => {
      const result = Polagram.init(samplePlantUML, 'plantuml')
        .removeParticipant('B')
        .toPlantUML();

      const normalized = normalize(result);
      expect(normalized).not.toContain('participant B');
      expect(normalized).toContain('C -> A: Message 3');
    });
  });

  describe('RegExp Selectors', () => {
    it('should support focus with RegExp', () => {
      const code = `@startuml
participant PaymentService
participant DebugLogger
participant InventoryService
PaymentService -> InventoryService: Check stock
@enduml`;

      const result = Polagram.init(code, 'plantuml')
        .focusParticipant(/.*Service$/)
        .toPlantUML();

      const normalized = normalize(result);
      expect(normalized).toContain('PaymentService');
      expect(normalized).toContain('InventoryService');
      expect(normalized).not.toContain('DebugLogger');
    });

    it('should support remove with RegExp', () => {
      const code = `@startuml
participant PaymentService
participant DebugLogger
participant ErrorLogger
PaymentService -> DebugLogger: Log
PaymentService -> ErrorLogger: Error
@enduml`;

      const result = Polagram.init(code, 'plantuml')
        .removeParticipant(/^Debug.*/)
        .toPlantUML();

      const normalized = normalize(result);
      expect(normalized).not.toContain('DebugLogger');
      expect(normalized).toContain('PaymentService');
      expect(normalized).toContain('ErrorLogger');
    });
  });

  describe('Object Selectors', () => {
    it('should support focus with object selector', () => {
      const result = Polagram.init(samplePlantUML, 'plantuml')
        .focusParticipant({ name: 'B' })
        .toPlantUML();

      expect(normalize(result)).toContain('participant B');
    });
  });

  describe('Method Chaining', () => {
    it('should support multiple transformations', () => {
      const code = `@startuml
participant A
participant B
participant C
participant D
A -> B: Message 1
B -> C: Message 2
C -> D: Message 3
D -> A: Message 4
@enduml`;

      const result = Polagram.init(code, 'plantuml')
        .removeParticipant('D')
        .focusParticipant('B')
        .toPlantUML();

      const normalized = normalize(result);
      expect(normalized).toContain('participant B');
      expect(normalized).not.toContain('participant D');
    });
  });

  describe('ResolveFragment', () => {
    it('should resolve (unwrap) fragments', () => {
      const code = `@startuml
participant A
participant B
opt Option
    A -> B: Message
end
@enduml`;

      const result = Polagram.init(code, 'plantuml')
        .resolveFragment('Option')
        .toPlantUML();

      const normalized = normalize(result);
      expect(normalized).not.toContain('opt');
      expect(normalized).toContain('A -> B: Message');
    });

    it('should resolve alt fragments', () => {
      const code = `@startuml
participant A
participant B
alt Success
    A -> B: OK
else Failure
    A -> B: Error
end
@enduml`;

      const result = Polagram.init(code, 'plantuml')
        .resolveFragment({ condition: 'Success' })
        .toPlantUML();

      const normalized = normalize(result);
      expect(normalized).not.toContain('alt Success');
      expect(normalized).toContain('A -> B: OK');
      expect(normalized).not.toContain('A -> B: Error');
    });
  });

  describe('toAST', () => {
    it('should return transformed AST', () => {
      const ast = Polagram.init(samplePlantUML, 'plantuml')
        .focusParticipant('B')
        .toAST();

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

      const result = Polagram.init(samplePlantUML, 'plantuml')
        .applyLens(lens)
        .toPlantUML();

      const normalized = normalize(result);
      expect(normalized).not.toContain('participant B');
      expect(normalized).toContain('C -> A: Message 3');
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

      const result = Polagram.init(samplePlantUML, 'plantuml')
        .applyLens(lens)
        .removeMessage({ pattern: 'Message 1' })
        .toPlantUML();

      const normalized = normalize(result);
      expect(normalized).toContain('participant B');
      expect(normalized).not.toContain('C -> A: Message 3');
      expect(normalized).not.toContain('A -> B: Message 1');
      expect(normalized).toContain('B -> C: Message 2');
    });

    it('should resolve loop in complex diagram', () => {
      const complexCode = `@startuml
participant User
participant Auth
participant Logic
participant DB

loop Retry
    Logic -> DB: Query
end
@enduml`;

      const result = Polagram.init(complexCode, 'plantuml')
        .resolveFragment({ condition: 'Retry' })
        .toPlantUML();

      const normalized = normalize(result);
      expect(normalized).not.toContain('loop Retry');
      expect(normalized).toContain('Logic -> DB: Query');
    });

    it('should remove participant in complex diagram', () => {
      const complexCode = `@startuml
participant User
participant Auth
participant Logic
participant DB

User -> Auth: Login
Logic -> DB: Query
@enduml`;

      const result = Polagram.init(complexCode, 'plantuml')
        .removeParticipant('Auth')
        .toPlantUML();

      const normalized = normalize(result);
      expect(normalized).not.toContain('participant Auth');
      expect(normalized).not.toContain('User -> Auth: Login');
      expect(normalized).toContain('Logic -> DB: Query');
    });

    it('should resolve loop AND remove participant', () => {
      const complexCode = `@startuml
participant User
participant Auth
participant Logic
participant DB

User -> Auth: Login

loop Retry
    Logic -> DB: Query
end
@enduml`;

      const result = Polagram.init(complexCode, 'plantuml')
        .resolveFragment({ condition: 'Retry' })
        .removeParticipant('Auth')
        .toPlantUML();

      const normalized = normalize(result);
      expect(normalized).not.toContain('loop Retry');
      expect(normalized).not.toContain('participant Auth');
      expect(normalized).not.toContain('User -> Auth: Login');
      expect(normalized).toContain('Logic -> DB: Query');
    });

    it('should apply a complex lens with multiple layers', () => {
      const complexCode = `@startuml
participant User
participant Auth
participant Logic
participant DB

User -> Auth: Login
Auth -> DB: Check User
DB --> Auth: OK

loop Retry
    Logic -> DB: Query
    DB --> Logic: Result
end

Logic -> Logic: Debug: Calculation done
@enduml`;

      const complexLens = {
        name: 'Clean Logic View',
        layers: [
          {
            action: 'resolve' as const,
            selector: { kind: 'fragment' as const, condition: 'Retry' },
          },
          {
            action: 'remove' as const,
            selector: { kind: 'participant' as const, name: 'Auth' },
          },
          {
            action: 'remove' as const,
            selector: {
              kind: 'message' as const,
              text: { pattern: '^Debug:' },
            },
          },
        ],
      };

      const result = Polagram.init(complexCode, 'plantuml')
        .applyLens(complexLens)
        .toPlantUML();

      const normalized = normalize(result);
      expect(normalized).toContain('Logic -> DB: Query');
      expect(normalized).not.toContain('loop Retry');
      expect(normalized).not.toContain('participant Auth');
    });
  });

  describe('Cross-format output', () => {
    it('should convert PlantUML to Mermaid after transformation', () => {
      const result = Polagram.init(samplePlantUML, 'plantuml')
        .removeParticipant('B')
        .toMermaid();

      const normalized = normalize(result);
      expect(normalized).toContain('sequenceDiagram');
      expect(normalized).not.toContain('participant B');
      expect(normalized).toContain('C->>A: Message 3');
    });

    it('should support complex transformation with Mermaid output', () => {
      const code = `@startuml
participant User
participant Logger
participant API

User -> API: Request
API -> Logger: Log
Logger --> API: OK
API --> User: Response
@enduml`;

      const result = Polagram.init(code, 'plantuml')
        .removeParticipant('Logger')
        .toMermaid();

      const normalized = normalize(result);
      expect(normalized).toContain('sequenceDiagram');
      expect(normalized).not.toContain('Logger');
      expect(normalized).toContain('User->>API: Request');
      expect(normalized).toContain('API-->>User: Response');
    });
  });
});
