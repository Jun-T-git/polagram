import { describe, expect, it } from 'vitest';
import { Polagram } from '../../src/api';

function normalize(code: string): string {
  return code
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("'"))
    .join('\n');
}

describe('Advanced Feature Tests', () => {
  describe('Participant Types', () => {
    it('should handle actor type', () => {
      const code = `@startuml
actor User
participant System
User -> System: Request
@enduml`;

      const result = Polagram.init(code, 'plantuml').toPlantUML();
      expect(normalize(result)).toContain('actor User');
    });

    it('should handle database type', () => {
      const code = `@startuml
participant API
database DB
API -> DB: Query
@enduml`;

      const result = Polagram.init(code, 'plantuml').toPlantUML();
      expect(normalize(result)).toContain('database DB');
    });
  });

  describe('Message Selectors', () => {
    it('should remove messages by from selector', () => {
      const code = `@startuml
participant A
participant B
participant C
A -> B: Message 1
B -> C: Message 2
C -> A: Message 3
@enduml`;

      const result = Polagram.init(code, 'plantuml')
        .removeMessage({ from: 'A' })
        .toPlantUML();

      const normalized = normalize(result);
      expect(normalized).not.toContain('A -> B: Message 1');
      expect(normalized).toContain('B -> C: Message 2');
      expect(normalized).toContain('C -> A: Message 3');
    });

    it('should remove messages by to selector', () => {
      const code = `@startuml
participant A
participant B
participant C
A -> B: Message 1
B -> C: Message 2
C -> B: Message 3
@enduml`;

      const result = Polagram.init(code, 'plantuml')
        .removeMessage({ to: 'B' })
        .toPlantUML();

      const normalized = normalize(result);
      expect(normalized).not.toContain('A -> B: Message 1');
      expect(normalized).toContain('B -> C: Message 2');
      expect(normalized).not.toContain('C -> B: Message 3');
    });

    it('should remove messages by pattern', () => {
      const code = `@startuml
participant A
participant B
A -> B: Log: Debug message
A -> B: Process data
A -> B: Log: Info message
@enduml`;

      const result = Polagram.init(code, 'plantuml')
        .removeMessage({ pattern: '^Log:' })
        .toPlantUML();

      const normalized = normalize(result);
      expect(normalized).not.toContain('Log: Debug message');
      expect(normalized).toContain('Process data');
      expect(normalized).not.toContain('Log: Info message');
    });
  });

  describe('Cross-format Participant Types', () => {
    it('should convert PlantUML actor to Mermaid', () => {
      const code = `@startuml
actor User
participant System
User -> System: Request
@enduml`;

      const result = Polagram.init(code, 'plantuml').toMermaid();
      const normalized = normalize(result);

      expect(normalized).toContain('sequenceDiagram');
      expect(normalized).toContain('actor User');
      expect(normalized).toContain('participant System');
    });

    it('should convert PlantUML database to Mermaid', () => {
      const code = `@startuml
participant API
database DB
API -> DB: Query
@enduml`;

      const result = Polagram.init(code, 'plantuml').toMermaid();
      const normalized = normalize(result);

      expect(normalized).toContain('sequenceDiagram');
      expect(normalized).toContain('participant API');
      expect(normalized).toContain('participant DB');
    });
  });

  describe('Complex Transformations', () => {
    it('should handle multiple participant types with transformations', () => {
      const code = `@startuml
actor User
participant WebUI
participant API
database DB
participant Logger

User -> WebUI: Click
WebUI -> API: Request
API -> Logger: Log
API -> DB: Query
DB --> API: Data
API --> WebUI: Response
WebUI --> User: Display
@enduml`;

      const result = Polagram.init(code, 'plantuml')
        .removeParticipant('Logger')
        .focusParticipant(/API|DB/)
        .toPlantUML();

      const normalized = normalize(result);
      expect(normalized).toContain('participant API');
      expect(normalized).toContain('database DB');
      expect(normalized).not.toContain('Logger');
      expect(normalized).toContain('API -> DB: Query');
    });
  });
});
