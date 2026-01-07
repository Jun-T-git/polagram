import { describe, expect, it } from 'vitest';
import type { PolagramRoot } from '../../ast';
import { PlantUMLGeneratorVisitor } from './plantuml';

describe('PlantUML Generator', () => {
  const generator = new PlantUMLGeneratorVisitor();

  it('should generate basic document structure', () => {
    const ast: PolagramRoot = {
      kind: 'root',
      meta: { version: '1.0.0', source: 'plantuml', title: 'My Diagram' },
      participants: [],
      groups: [],
      events: [],
    };
    const code = generator.generate(ast);
    expect(code).toContain('@startuml');
    expect(code).toContain('title My Diagram');
    expect(code).toContain('@enduml');
  });

  it('should generate participants', () => {
    const ast: PolagramRoot = {
      kind: 'root',
      meta: { version: '1.0.0', source: 'plantuml' },
      participants: [
        { id: 'User', name: 'User', type: 'actor' },
        { id: 'DB', name: 'DB', type: 'database' },
        { id: 'Svc', name: 'Service', type: 'participant' },
      ],
      groups: [],
      events: [],
    };
    const code = generator.generate(ast);
    expect(code).toContain('actor User');
    expect(code).toContain('database DB');
    expect(code).toContain('participant "Service" as Svc');
  });

  it('should generate messages', () => {
    const ast: PolagramRoot = {
      kind: 'root',
      meta: { version: '1.0.0', source: 'plantuml' },
      participants: [
        { id: 'A', name: 'A', type: 'participant' },
        { id: 'B', name: 'B', type: 'participant' },
      ],
      groups: [],
      events: [
        {
          kind: 'message',
          id: 'm1',
          from: 'A',
          to: 'B',
          text: 'Sync',
          type: 'sync',
          style: { line: 'solid', head: 'arrow' },
        },
        {
          kind: 'message',
          id: 'm2',
          from: 'B',
          to: 'A',
          text: 'Reply',
          type: 'reply',
          style: { line: 'dotted', head: 'arrow' },
        },
        {
          kind: 'message',
          id: 'm3',
          from: 'A',
          to: 'A',
          text: 'Self',
          type: 'sync',
          style: { line: 'solid', head: 'arrow' },
        },
      ],
    };
    const code = generator.generate(ast);
    expect(code).toContain('A -> B: Sync');
    expect(code).toContain('B --> A: Reply');
    expect(code).toContain('A -> A: Self');
  });

  it('should generate fragments', () => {
    const ast: PolagramRoot = {
      kind: 'root',
      meta: { version: '1.0.0', source: 'plantuml' },
      participants: [],
      groups: [],
      events: [
        {
          kind: 'fragment',
          id: 'f1',
          operator: 'alt',
          branches: [
            {
              id: 'b1',
              condition: 'success',
              events: [
                {
                  kind: 'message',
                  id: 'm1',
                  from: 'A',
                  to: 'B',
                  text: 'OK',
                  type: 'sync',
                  style: { line: 'solid', head: 'arrow' },
                },
              ],
            },
            {
              id: 'b2',
              condition: 'failure',
              events: [
                {
                  kind: 'message',
                  id: 'm2',
                  from: 'A',
                  to: 'B',
                  text: 'Fail',
                  type: 'sync',
                  style: { line: 'solid', head: 'arrow' },
                },
              ],
            },
          ],
        },
      ],
    };
    const code = generator.generate(ast);
    expect(code).toContain('alt success');
    expect(code).toContain('A -> B: OK');
    expect(code).toContain('else failure');
    expect(code).toContain('A -> B: Fail');
    expect(code).toContain('end');
  });

  it('should generate notes', () => {
    const ast: PolagramRoot = {
      kind: 'root',
      meta: { version: '1.0.0', source: 'plantuml' },
      participants: [{ id: 'A', name: 'A', type: 'participant' }],
      groups: [],
      events: [
        {
          kind: 'note',
          id: 'n1',
          text: 'My Note',
          position: 'right',
          participantIds: ['A'],
        },
        {
          kind: 'note',
          id: 'n2',
          text: 'Over Note',
          position: 'over',
          participantIds: ['A'],
        },
        {
          kind: 'note',
          id: 'n3',
          text: 'Line 1\nLine 2',
          position: 'left',
          participantIds: ['A'],
        },
      ],
    };
    const code = generator.generate(ast);
    
    // Check block syntax
    expect(code).toContain('note right of A');
    expect(code).toContain('    My Note');
    expect(code).toContain('end note');

    expect(code).toContain('note over A');
    expect(code).toContain('    Over Note');
    // end note is repeated

    // Check multi-line
    expect(code).toContain('note left of A');
    expect(code).toContain('    Line 1');
    expect(code).toContain('    Line 2');
  });

  it('should generate lifecycle events', () => {
    const ast: PolagramRoot = {
      kind: 'root',
      meta: { version: '1.0.0', source: 'plantuml' },
      participants: [{ id: 'A', name: 'A', type: 'participant' }],
      groups: [],
      events: [
        { kind: 'activation', participantId: 'A', action: 'activate' },
        // Some message presumably
        { kind: 'activation', participantId: 'A', action: 'deactivate' },
      ],
    };
    const code = generator.generate(ast);
    expect(code).toContain('activate A');
    expect(code).toContain('deactivate A');
  });

  it('should generate groups', () => {
    const ast: PolagramRoot = {
      kind: 'root',
      meta: { version: '1.0.0', source: 'plantuml' },
      participants: [
        { id: 'A', name: 'A', type: 'participant' },
        { id: 'B', name: 'B', type: 'participant' },
        { id: 'C', name: 'C', type: 'participant' },
      ],
      groups: [
        {
          kind: 'group',
          id: 'g1',
          name: 'Box1',
          type: 'box',
          participantIds: ['A', 'B'],
          style: { backgroundColor: '#LightBlue' },
        },
      ],
      events: [],
    };
    const code = generator.generate(ast);
    // Expect Box1 to contain A and B
    // C should be outside

    // Exact order depends on implementation, but box should be there
    expect(code).toContain('box "Box1" #LightBlue');
    expect(code).toContain('participant A');
    expect(code).toContain('participant B');
    expect(code).toContain('end box');
    expect(code).toContain('participant C');
  });
});
