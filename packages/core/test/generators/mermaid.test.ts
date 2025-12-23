import { describe, expect, it } from 'vitest';
import type { AyatoriRoot } from '../../src/ast';
import { generateMermaid } from '../../src/generators/mermaid';

describe('Mermaid Generator', () => {
  it('should generate basic sequence diagram', () => {
    const ast: AyatoriRoot = {
      kind: 'root',
      meta: { version: '1', source: 'mermaid' },
      participants: [
        { id: 'A', name: 'Alice', type: 'participant' },
        { id: 'B', name: 'Bob', type: 'participant' }
      ],
      groups: [],
      events: [
        {
          kind: 'message',
          id: 'm1',
          from: 'A',
          to: 'B',
          text: 'Hello',
          type: 'sync',
          style: { line: 'solid', head: 'arrow' }
        },
        {
          kind: 'message',
          id: 'm2',
          from: 'B',
          to: 'A',
          text: 'Hi',
          type: 'reply',
          style: { line: 'dotted', head: 'arrow' }
        }
      ]
    };

    const code = generateMermaid(ast);
    // Expectation checks
    expect(code).toContain('sequenceDiagram');
    expect(code).toContain('participant A as Alice');
    expect(code).toContain('participant B as Bob');
    expect(code).toContain('A->>B: Hello');
    expect(code).toContain('B-->>A: Hi');
  });

  it('should handle loop fragments', () => {
      const ast: AyatoriRoot = {
      kind: 'root',
      meta: { version: '1', source: 'mermaid' },
      participants: [
        { id: 'A', name: 'A', type: 'participant' },
        { id: 'B', name: 'B', type: 'participant' }
      ],
      groups: [],
      events: [
        {
          kind: 'fragment',
          id: 'f1',
          operator: 'loop',
          branches: [
            {
              id: 'b1',
              condition: 'Check',
              events: [
                {
                   kind: 'message',
                   id: 'm1',
                   from: 'A',
                   to: 'B',
                   text: 'Ping',
                   type: 'sync',
                   style: { line: 'solid', head: 'arrow' }
                }
              ]
            }
          ]
        }
      ]
    };
    
    const code = generateMermaid(ast);
    expect(code).toMatch(/loop Check/);
    expect(code).toMatch(/A->>B: Ping/);
    expect(code).toMatch(/end/);
  });

  it('should handle alt/else fragments', () => {
    const ast: AyatoriRoot = {
      kind: 'root',
      meta: { version: '1', source: 'mermaid' },
      participants: [{ id: 'A', name: 'A', type: 'participant' }],
      groups: [],
      events: [
        {
          kind: 'fragment',
          id: 'f1',
          operator: 'alt',
          branches: [
            { id: 'b1', condition: 'Success', events: [] },
            { id: 'b2', condition: 'Errors', events: [] }
          ]
        }
      ]
    };
    
    const code = generateMermaid(ast);
    expect(code).toMatch(/alt Success/);
    expect(code).toMatch(/else Errors/);
    expect(code).toMatch(/end/);
  });

  it('should handle notes', () => {
    const ast: AyatoriRoot = {
      kind: 'root',
      meta: { version: '1', source: 'mermaid' },
      participants: [],
      groups: [],
      events: [
        {
          kind: 'note',
          id: 'n1',
          text: 'My Note',
          position: 'right',
          participantIds: ['A']
        },
        {
          kind: 'note',
          id: 'n2',
          text: 'Over Note',
          position: 'over',
          participantIds: ['A', 'B']
        }
      ]
    };

    const code = generateMermaid(ast);
    expect(code).toContain('note right of A: My Note');
    expect(code).toContain('note over A,B: Over Note');
  });

  it('should handle activation', () => {
    const ast: AyatoriRoot = {
      kind: 'root',
      meta: { version: '1', source: 'mermaid' },
      participants: [],
      groups: [],
      events: [
        {
          kind: 'activation',
          participantId: 'A',
          action: 'activate'
        },
        {
          kind: 'activation',
          participantId: 'A',
          action: 'deactivate'
        }
      ]
    };

    const code = generateMermaid(ast);
    expect(code).toContain('activate A');
    expect(code).toContain('deactivate A');
  });

  it('should handle lifecycle shorthand', () => {
    const ast: AyatoriRoot = {
      kind: 'root',
      meta: { version: '1', source: 'mermaid' },
      participants: [{ id: 'A', name: 'A', type: 'participant' }, { id: 'B', name: 'B', type: 'participant' }],
      groups: [],
      events: [
        {
          kind: 'message',
          id: 'm1',
          from: 'A',
          to: 'B',
          text: 'Open',
          type: 'sync',
          style: { line: 'solid', head: 'arrow' },
          lifecycle: { activateTarget: true }
        },
        {
          kind: 'message',
          id: 'm2',
          from: 'B',
          to: 'A',
          text: 'Close',
          type: 'reply',
          style: { line: 'dotted', head: 'arrow' },
          lifecycle: { deactivateSource: true }
        }
      ]
    };
    const code = generateMermaid(ast);
    expect(code).toContain('A->>+B: Open');
    expect(code).toContain('B-->>-A: Close');
  });
});
