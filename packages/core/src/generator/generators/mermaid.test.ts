import { describe, expect, it } from 'vitest';
import type { MessageNode, PolagramRoot } from '../../ast';
import { MermaidGeneratorVisitor } from './mermaid';

describe('MermaidGeneratorVisitor', () => {
  it('should generate sequence diagram header', () => {
    const root: PolagramRoot = {
      kind: 'root',
      meta: { version: '1.0.0', source: 'mermaid' },
      participants: [],
      groups: [],
      events: [],
    };
    const visitor = new MermaidGeneratorVisitor();
    const output = visitor.generate(root);

    expect(output).toContain('sequenceDiagram');
  });

  it('should generate title if present', () => {
    const root: PolagramRoot = {
      kind: 'root',
      meta: { version: '1.0.0', source: 'mermaid', title: 'My Diagram' },
      participants: [],
      groups: [],
      events: [],
    };
    const visitor = new MermaidGeneratorVisitor();
    const output = visitor.generate(root);

    expect(output).toContain('title My Diagram');
  });

  it('should generate participants', () => {
    const root: PolagramRoot = {
      kind: 'root',
      meta: { version: '1.0.0', source: 'mermaid' },
      participants: [
        { id: 'A', name: 'Alice', type: 'participant' },
        { id: 'B', name: 'Bob', type: 'actor' },
      ],
      groups: [],
      events: [],
    };
    const visitor = new MermaidGeneratorVisitor();
    const output = visitor.generate(root);

    expect(output).toContain('participant A as Alice');
    expect(output).toContain('actor B as Bob');
  });

  it('should generate participant with multi-word name without extra quotes', () => {
    const root: PolagramRoot = {
      kind: 'root',
      meta: { version: '1.0.0', source: 'mermaid' },
      participants: [{ id: 'API', name: 'API Server', type: 'participant' }],
      groups: [],
      events: [],
    };
    const visitor = new MermaidGeneratorVisitor();
    const output = visitor.generate(root);

    // We expect it NOT to be quoted if the user wants clean text
    // But currently it IS quoted. checking what it does now vs what we want.
    // If we want to fix it, we should expect "API Server" plain.
    expect(output).toContain('participant API as API Server');
  });

  it('should generate messages', () => {
    const msg: MessageNode = {
      kind: 'message',
      id: '1',
      from: 'A',
      to: 'B',
      text: 'hello',
      type: 'sync',
      style: { line: 'solid', head: 'arrow' },
    };
    const root: PolagramRoot = {
      kind: 'root',
      meta: { version: '1.0.0', source: 'mermaid' },
      participants: [],
      groups: [],
      events: [msg],
    };
    const visitor = new MermaidGeneratorVisitor();
    const output = visitor.generate(root);

    expect(output).toContain('A->>B: hello');
  });

  it('should generate par/and fragments', () => {
    const root: PolagramRoot = {
      kind: 'root',
      meta: { version: '1.0.0', source: 'mermaid' },
      participants: [],
      groups: [],
      events: [
        {
          kind: 'fragment',
          id: 'frag_1',
          operator: 'par',
          branches: [
            {
              id: 'br_1',
              condition: 'Task A',
              events: [
                {
                  kind: 'message',
                  id: 'msg_1',
                  from: 'A',
                  to: 'B',
                  text: 'Do A',
                  type: 'sync',
                  style: { line: 'solid', head: 'arrow' },
                },
              ],
            },
            {
              id: 'br_2',
              condition: 'Task B',
              events: [
                {
                  kind: 'message',
                  id: 'msg_2',
                  from: 'A',
                  to: 'C',
                  text: 'Do B',
                  type: 'sync',
                  style: { line: 'solid', head: 'arrow' },
                },
              ],
            },
          ],
        },
      ],
    };
    const visitor = new MermaidGeneratorVisitor();
    const output = visitor.generate(root);

    expect(output).toContain('par Task A');
    expect(output).toContain('A->>B: Do A');
    expect(output).toContain('and Task B');
    expect(output).toContain('A->>C: Do B');
    expect(output).toContain('end');
  });

  describe('visitSection — name sanitization', () => {
    it('strips newlines so a malicious section name cannot break out of the comment', () => {
      // Mermaid renders `%% ...` as a comment for the rest of the line. A
      // newline in the section name would terminate the comment and let the
      // tail parse as a real diagram statement.
      const root: PolagramRoot = {
        kind: 'root',
        meta: { version: '1.0.0', source: 'mermaid' },
        participants: [{ id: 'A', name: 'A', type: 'participant' }],
        groups: [],
        events: [
          {
            kind: 'section',
            id: 's1',
            name: 'safe\nA->>A: pwn',
            events: [],
          },
        ],
      };
      const visitor = new MermaidGeneratorVisitor();
      const output = visitor.generate(root);
      // The injected message must not appear as its own statement.
      expect(output.split('\n').some((l) => l.trim() === 'A->>A: pwn')).toBe(false);
      // The section comment line must remain a single line.
      const sectionMarkers = output.split('\n').filter((l) => l.includes('%% =='));
      expect(sectionMarkers).toHaveLength(1);
    });
  });
});
