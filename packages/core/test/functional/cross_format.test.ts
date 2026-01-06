import { describe, expect, it } from 'vitest';
import { Polagram } from '../../src/api';

describe('Cross-Format Conversion Tests', () => {
  describe('PlantUML to Mermaid', () => {
    it('should convert basic PlantUML to Mermaid', () => {
      const plantuml = `
@startuml
participant A
participant B
A -> B: Hello
B --> A: World
@enduml
`;

      const result = Polagram.init(plantuml, 'plantuml').toMermaid();

      expect(result).toContain('sequenceDiagram');
      expect(result).toContain('participant A');
      expect(result).toContain('participant B');
      expect(result).toContain('A->>B: Hello');
      expect(result).toContain('B-->>A: World');
    });

    it('should convert PlantUML fragments to Mermaid', () => {
      const plantuml = `
@startuml
participant A
participant B

alt Success
    A -> B: Request
    B --> A: 200 OK
else Error
    A -> B: Request
    B --> A: 500 Error
end
@enduml
`;

      const result = Polagram.init(plantuml, 'plantuml').toMermaid();

      expect(result).toContain('alt Success');
      expect(result).toContain('else Error');
      expect(result).toContain('end');
    });

    it('should convert PlantUML activations to Mermaid', () => {
      const plantuml = `
@startuml
participant A
participant B

A -> B: Request
activate B
B --> A: Response
deactivate B
@enduml
`;

      const result = Polagram.init(plantuml, 'plantuml').toMermaid();

      expect(result).toContain('activate B');
      expect(result).toContain('deactivate B');
    });
  });

  describe('Mermaid to PlantUML', () => {
    it('should convert basic Mermaid to PlantUML', () => {
      const mermaid = `
sequenceDiagram
    participant A
    participant B
    A->>B: Hello
    B-->>A: World
`;

      const result = Polagram.init(mermaid, 'mermaid').toPlantUML();

      expect(result).toContain('@startuml');
      expect(result).toContain('@enduml');
      expect(result).toContain('participant A');
      expect(result).toContain('participant B');
      expect(result).toContain('A -> B: Hello');
      expect(result).toContain('B --> A: World');
    });

    it('should convert Mermaid fragments to PlantUML', () => {
      const mermaid = `
sequenceDiagram
    participant A
    participant B
    
    loop Retry
        A->>B: Ping
        B-->>A: Pong
    end
`;

      const result = Polagram.init(mermaid, 'mermaid').toPlantUML();

      expect(result).toContain('loop Retry');
      expect(result).toContain('end');
    });
  });

  describe('Transformation with Cross-Format Output', () => {
    it('should apply transformations and convert PlantUML to Mermaid', () => {
      const plantuml = `
@startuml
participant Client
participant Logger
participant API

Client -> API: Request
API -> Logger: Log
Logger --> API: OK
API --> Client: Response
@enduml
`;

      const result = Polagram.init(plantuml, 'plantuml')
        .removeParticipant({ name: 'Logger' })
        .toMermaid();

      expect(result).toContain('sequenceDiagram');
      expect(result).not.toContain('Logger');
      expect(result).toContain('Client->>API: Request');
      expect(result).toContain('API-->>Client: Response');
    });

    it('should apply transformations and convert Mermaid to PlantUML', () => {
      const mermaid = `
sequenceDiagram
    participant Client
    participant Logger
    participant API
    
    Client->>API: Request
    API->>Logger: Log
    Logger-->>API: OK
    API-->>Client: Response
`;

      const result = Polagram.init(mermaid, 'mermaid')
        .removeParticipant({ name: 'Logger' })
        .toPlantUML();

      expect(result).toContain('@startuml');
      expect(result).not.toContain('Logger');
      expect(result).toContain('Client -> API: Request');
      expect(result).toContain('API --> Client: Response');
    });
  });
});
