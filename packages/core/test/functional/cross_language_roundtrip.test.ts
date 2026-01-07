import { describe, expect, it } from 'vitest';
import { MermaidGeneratorVisitor } from '../../src/generator/generators/mermaid';
import { PlantUMLGeneratorVisitor } from '../../src/generator/generators/plantuml';
import { ParserFactory } from '../../src/parser';

describe('Cross-Language Roundtrip Tests', () => {
  describe('PlantUML to Mermaid', () => {
    it('should convert simple message flow', () => {
      const plantuml = `
@startuml
participant A
participant B
A -> B: Hello
B --> A: Reply
@enduml
`;
      // Parse PlantUML
      const parser = ParserFactory.getParser('plantuml');
      const ast = parser.parse(plantuml);

      // Generate Mermaid
      const mermaidGenerator = new MermaidGeneratorVisitor();
      const mermaidCode = mermaidGenerator.generate(ast);

      // Parse Mermaid back
      const mermaidParser = ParserFactory.getParser('mermaid');
      const mermaidAst = mermaidParser.parse(mermaidCode);

      // Verify structure is preserved
      expect(mermaidAst.participants).toHaveLength(2);
      expect(mermaidAst.events).toHaveLength(2);
      expect(mermaidAst.participants[0].id).toBe('A');
      expect(mermaidAst.participants[1].id).toBe('B');
    });

    it('should convert fragments (alt/else)', () => {
      const plantuml = `
@startuml
A -> B: Check
alt Success
  B --> A: OK
else Failure
  B --> A: Error
end
@enduml
`;
      const parser = ParserFactory.getParser('plantuml');
      const ast = parser.parse(plantuml);

      const mermaidGenerator = new MermaidGeneratorVisitor();
      const mermaidCode = mermaidGenerator.generate(ast);

      const mermaidParser = ParserFactory.getParser('mermaid');
      const mermaidAst = mermaidParser.parse(mermaidCode);

      // Verify fragment structure
      expect(mermaidAst.events).toHaveLength(2); // message + fragment
      const fragment = mermaidAst.events[1];
      if (fragment.kind !== 'fragment') throw new Error('Expected fragment');
      expect(fragment.operator).toBe('alt');
      expect(fragment.branches).toHaveLength(2);
    });

    it('should convert notes', () => {
      const plantuml = `
@startuml
participant A
note over A: A note here
A -> A: Self
@enduml
`;
      const parser = ParserFactory.getParser('plantuml');
      const ast = parser.parse(plantuml);

      const mermaidGenerator = new MermaidGeneratorVisitor();
      const mermaidCode = mermaidGenerator.generate(ast);

      expect(mermaidCode).toContain('note');
      expect(mermaidCode).toContain('A note here');
    });
  });

  describe('Mermaid to PlantUML', () => {
    it('should convert simple message flow', () => {
      const mermaid = `
sequenceDiagram
participant A
participant B
A->>B: Request
B-->>A: Response
`;
      const parser = ParserFactory.getParser('mermaid');
      const ast = parser.parse(mermaid);

      const plantumlGenerator = new PlantUMLGeneratorVisitor();
      const plantumlCode = plantumlGenerator.generate(ast);

      const plantumlParser = ParserFactory.getParser('plantuml');
      const plantumlAst = plantumlParser.parse(plantumlCode);

      expect(plantumlAst.participants).toHaveLength(2);
      expect(plantumlAst.events).toHaveLength(2);
    });

    it('should convert loop fragments', () => {
      const mermaid = `
sequenceDiagram
A->>B: Start
loop Retry
  B->>A: Ping
end
`;
      const parser = ParserFactory.getParser('mermaid');
      const ast = parser.parse(mermaid);

      const plantumlGenerator = new PlantUMLGeneratorVisitor();
      const plantumlCode = plantumlGenerator.generate(ast);

      expect(plantumlCode).toContain('loop Retry');
      expect(plantumlCode).toContain('end');
    });

    it('should convert par fragments to PlantUML', () => {
      const mermaid = `
sequenceDiagram
participant A
participant B
participant C
par Task1
  A->>B: Do1
and Task2
  A->>C: Do2
end
`;
      const parser = ParserFactory.getParser('mermaid');
      const ast = parser.parse(mermaid);

      // Verify AST has par with 2 branches
      const fragment = ast.events[0];
      if (fragment.kind !== 'fragment') throw new Error('Expected fragment');
      expect(fragment.operator).toBe('par');
      expect(fragment.branches).toHaveLength(2);

      // Generate PlantUML (note: PlantUML uses 'par' too)
      const plantumlGenerator = new PlantUMLGeneratorVisitor();
      const plantumlCode = plantumlGenerator.generate(ast);

      expect(plantumlCode).toContain('par');
    });
  });

  describe('Full Roundtrip (A -> B -> A)', () => {
    it('should preserve structure: Mermaid -> PlantUML -> Mermaid', () => {
      const originalMermaid = `
sequenceDiagram
participant Client
participant Server
Client->>Server: Request
Server-->>Client: Response
`;
      // Mermaid -> AST
      const mermaidParser = ParserFactory.getParser('mermaid');
      const ast1 = mermaidParser.parse(originalMermaid);

      // AST -> PlantUML
      const plantumlGenerator = new PlantUMLGeneratorVisitor();
      const plantumlCode = plantumlGenerator.generate(ast1);

      // PlantUML -> AST
      const plantumlParser = ParserFactory.getParser('plantuml');
      const ast2 = plantumlParser.parse(plantumlCode);

      // AST -> Mermaid
      const mermaidGenerator = new MermaidGeneratorVisitor();
      const finalMermaid = mermaidGenerator.generate(ast2);

      // Verify final AST matches original structure
      const finalAst = mermaidParser.parse(finalMermaid);
      expect(finalAst.participants).toHaveLength(2);
      expect(finalAst.events).toHaveLength(2);
      expect(finalAst.participants.map(p => p.id)).toEqual(['Client', 'Server']);
    });
  });
});
