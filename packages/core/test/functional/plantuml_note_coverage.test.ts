import { describe, expect, it } from 'vitest';
import { Polagram } from '../../src/api';

function normalize(code: string): string {
  return code
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("'"))
    .join('\n');
}

describe('PlantUML Note Coverage', () => {
  // 1. Position & Single Participant
  it('should generate note left of A', () => {
         const input = `@startuml
participant A
note left of A: hello
@enduml`;
    const result = Polagram.init(input, 'plantuml').toPlantUML();
    const norm = normalize(result);
    expect(norm).toContain('note left of A');
    expect(norm).toContain('hello');
    expect(norm).toContain('end note');
  });

  it('should generate note right of A', () => {
    const input = `@startuml
participant A
note right of A: hello
@enduml`;
    const result = Polagram.init(input, 'plantuml').toPlantUML();
    const norm = normalize(result);
    expect(norm).toContain('note right of A');
    expect(norm).toContain('hello');
    expect(norm).toContain('end note');
  });

  it('should generate note over A', () => {
    const input = `@startuml
participant A
note over A: hello
@enduml`;
    const result = Polagram.init(input, 'plantuml').toPlantUML();
    const norm = normalize(result);
    // note over does NOT take "of"
    expect(norm).toContain('note over A');
    expect(norm).toContain('hello');
    expect(norm).toContain('end note');
  });

  // 2. Multi Participant
  it('should generate note over A, B', () => {
    const input = `@startuml
participant A
participant B
note over A, B: hello
@enduml`;
    const result = Polagram.init(input, 'plantuml').toPlantUML();
    const norm = normalize(result);
    expect(norm).toContain('note over A, B');
    expect(norm).toContain('hello');
    expect(norm).toContain('end note');
  });

  // 3. Floating (no participant)
  it('should generate note left (floating)', () => {
    const input = `@startuml
note left
  floating
end note
@enduml`;
    const result = Polagram.init(input, 'plantuml').toPlantUML();
    const norm = normalize(result);
    expect(norm).toContain('note left');
    expect(norm).toContain('floating');
    expect(norm).toContain('end note');
  });

  it('should generate note right (floating) with block processing if needed', () => {
     // Force multiline
         const input = `@startuml
note right
  line1
  line2
end note
@enduml`;
    const result = Polagram.init(input, 'plantuml').toPlantUML();
    // Should use block syntax
    const norm = normalize(result);
    expect(norm).toContain('note right');
    expect(norm).toContain('line1');
    expect(norm).toContain('line2');
    expect(norm).toContain('end note');
    expect(norm).not.toContain('note right of');
    expect(norm).not.toContain(': line1');
  });
  
  // 4. Complex text content
  it('should handle multi-line text with participants', () => {
         const input = `@startuml
participant A
note left of A
  line1
  line2
end note
@enduml`;
    const result = Polagram.init(input, 'plantuml').toPlantUML();
    const norm = normalize(result);
    expect(norm).toContain('note left of A');
    expect(norm).toContain('line1');
    expect(norm).toContain('end note');
  });

});
