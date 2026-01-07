import { describe, expect, it } from 'vitest';
import { asFragment } from '../../../../test/helpers';
import type { PolagramRoot } from '../../../ast';
import { Lexer } from './lexer';
import { Parser } from './parser';

describe('Mermaid Parser', () => {
  const parse = (input: string): PolagramRoot => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    return parser.parse();
  };

  describe('Basic Document Structure', () => {
    it('should parse "sequenceDiagram" header', () => {
      const input = `sequenceDiagram`;
      const ast = parse(input);

      expect(ast.kind).toBe('root');
      expect(ast.meta.source).toBe('mermaid');
      expect(ast.participants).toEqual([]);
      expect(ast.events).toEqual([]);
    });

    it('should handle newlines around header', () => {
      const input = `
sequenceDiagram
`;
      const ast = parse(input);
      expect(ast.meta.source).toBe('mermaid');
    });
  });

  describe('Participant Definitions', () => {
    it('should parse simple participant', () => {
      const input = `
sequenceDiagram
participant Alice
participant Bob
`;
      const ast = parse(input);

      expect(ast.participants).toHaveLength(2);
      expect(ast.participants[0]).toMatchObject({
        id: 'Alice',
        name: 'Alice',
        type: 'participant',
      });
      expect(ast.participants[1]).toMatchObject({
        id: 'Bob',
        name: 'Bob',
        type: 'participant',
      });
    });

    it('should parse participant with multi-word alias', () => {
      const input = `
sequenceDiagram
participant API as API Server
participant DB as Database System
API->>DB: Query
`;
      const ast = parse(input);
      const api = ast.participants.find((p) => p.id === 'API');
      expect(api).toBeDefined();
      expect(api?.name).toBe('API Server');
    });
  });

  describe('Message Definitions', () => {
    it('should parse sync message and implicit participants', () => {
      const input = `
sequenceDiagram
A->B: Hello
`;
      const ast = parse(input);

      expect(ast.participants).toHaveLength(2);
      expect(ast.participants).toMatchObject([
        { id: 'A', name: 'A' },
        { id: 'B', name: 'B' },
      ]);

      expect(ast.events).toHaveLength(1);
      expect(ast.events[0]).toMatchObject({
        kind: 'message',
        from: 'A',
        to: 'B',
        text: 'Hello',
        type: 'sync',
        style: { line: 'solid', head: 'open' },
      });
    });

    it('should parse various arrow types', () => {
      const input = `
sequenceDiagram
A->>B: Arrow
A-->>B: Reply Arrow
A-->B: Dotted Open
A-xB: Cross
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(4);

      const m1 = ast.events[0];
      const m2 = ast.events[1];
      const m3 = ast.events[2];
      const m4 = ast.events[3];

      // ->> : sync, solid, arrow
      expect(m1).toMatchObject({
        kind: 'message',
        type: 'sync',
        style: { line: 'solid', head: 'arrow' },
      });

      // -->> : reply, dotted, arrow
      expect(m2).toMatchObject({
        kind: 'message',
        type: 'reply',
        style: { line: 'dotted', head: 'arrow' },
      });

      // --> : reply, dotted, open
      expect(m3).toMatchObject({
        kind: 'message',
        type: 'reply',
        style: { line: 'dotted', head: 'open' },
      });

      // -x : destroy, solid, cross
      expect(m4).toMatchObject({
        kind: 'message',
        type: 'destroy',
        style: { line: 'solid', head: 'cross' },
      });
    });

    it('should parse lifecycle activations in messages', () => {
      const input = `
sequenceDiagram
A->>+B: Activate Target
B-->>-A: Deactivate Source
`;
      const ast = parse(input);
      const m1 = ast.events[0];
      const m2 = ast.events[1];

      if (m1.kind !== 'message' || m2.kind !== 'message') {
        throw new Error('Expected message events');
      }

      expect(m1.lifecycle).toMatchObject({
        activateTarget: true,
        deactivateSource: false,
      });
      expect(m2.lifecycle).toMatchObject({
        activateTarget: false,
        deactivateSource: true,
      });
    });
  });

  describe('Lifecycle Definitions', () => {
    it('should parse standalone activate/deactivate', () => {
      const input = `
sequenceDiagram
activate A
deactivate A
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(2);
      expect(ast.events[0]).toMatchObject({
        kind: 'activation',
        participantId: 'A',
        action: 'activate',
      });
      expect(ast.events[1]).toMatchObject({
        kind: 'activation',
        participantId: 'A',
        action: 'deactivate',
      });
    });
  });

  describe('Note Definitions', () => {
    it('should parse note positions', () => {
      const input = `
sequenceDiagram
note left of A: Note Left
note right of A: Note Right
note over A: Note Over
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(3);
      expect(ast.events[0]).toMatchObject({
        kind: 'note',
        position: 'left',
        participantIds: ['A'],
        text: 'Note Left',
      });
      expect(ast.events[1]).toMatchObject({
        kind: 'note',
        position: 'right',
        participantIds: ['A'],
        text: 'Note Right',
      });
      expect(ast.events[2]).toMatchObject({
        kind: 'note',
        position: 'over',
        participantIds: ['A'],
        text: 'Note Over',
      });
    });

    it('should parse note over multiple participants', () => {
      const input = `sequenceDiagram\nnote over A,B: Shared Note`;
      const ast = parse(input);
      expect(ast.events[0]).toMatchObject({
        kind: 'note',
        position: 'over',
        participantIds: ['A', 'B'],
        text: 'Shared Note',
      });
    });
  });

  describe('Fragment Definitions', () => {
    it('should parse loop fragment', () => {
      const input = `
sequenceDiagram
loop Every minute
  A->B: Check
end
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);

      const fragment = ast.events[0];
      expect(fragment.kind).toBe('fragment');
      if (fragment.kind !== 'fragment') return; // type guard

      expect(fragment.operator).toBe('loop');
      expect(fragment.branches).toHaveLength(1);
      expect(fragment.branches[0].condition).toBe('Every minute');
      expect(fragment.branches[0].events).toHaveLength(1);
      expect(fragment.branches[0].events[0].kind).toBe('message');
    });

    it('should parse alt/else fragment', () => {
      const input = `
sequenceDiagram
alt Success
    A->B: OK
else Failure
    A->B: Error
end
`;
      const ast = parse(input);
      const fragment = asFragment(ast.events[0]);
      expect(fragment.kind).toBe('fragment');
      expect(fragment.operator).toBe('alt');
      expect(fragment.branches).toHaveLength(2);

      expect(fragment.branches[0].condition).toBe('Success');
      expect(fragment.branches[0].events).toHaveLength(1);

      expect(fragment.branches[1].condition).toBe('Failure');
      expect(fragment.branches[1].events).toHaveLength(1);
    });
  });

  describe('Box/Group Definitions', () => {
    it('should parse box definition with color and name', () => {
      const code = `
  sequenceDiagram
  box "Frontend" #eef
      participant A
      participant B
  end
  box Backend
      participant C
  end
  A->>C: Request
  C-->>A: Response
      `;

      const ast = parse(code);

      // Verify participants
      expect(ast.participants).toHaveLength(3);
      expect(ast.participants.map((p) => p.id)).toEqual(['A', 'B', 'C']);

      // Verify groups
      expect(ast.groups).toHaveLength(2);

      const group1 = ast.groups[0];
      expect(group1.name).toContain('Frontend');

      expect(group1.participantIds).toEqual(['A', 'B']);

      const group2 = ast.groups[1];
      expect(group2.name).toBe('Backend');
      expect(group2.participantIds).toEqual(['C']);
    });

    it('should handle messages inside box block', () => {
      const code = `
  sequenceDiagram
  participant U
  box App
      participant A
      U->>A: inside box
  end
      `;
      const ast = parse(code);
      expect(ast.events).toHaveLength(1);
      expect(ast.events[0].kind).toBe('message');
      expect(ast.groups[0].participantIds).toEqual(['A']);
    });
  });

  describe('Comments', () => {
    it('should ignore %% comments at the start of a line', () => {
      const input = `
sequenceDiagram
%% This is a comment
A->>B: Hello
%% Another comment
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);
      expect(ast.events[0]).toMatchObject({
        kind: 'message',
        from: 'A',
        to: 'B',
        text: 'Hello',
      });
    });

    it('should handle comments between statements', () => {
      const input = `
sequenceDiagram
participant Alice
%% Comment between participants
participant Bob
%% Comment before message
Alice->>Bob: Hi
`;
      const ast = parse(input);
      expect(ast.participants).toHaveLength(2);
      expect(ast.events).toHaveLength(1);
    });

    it('should handle comment-only diagram', () => {
      const input = `
sequenceDiagram
%% Only comments here
%% No actual content
`;
      const ast = parse(input);
      expect(ast.participants).toEqual([]);
      expect(ast.events).toEqual([]);
    });
  });

  describe('Parallel (par/and) Fragments', () => {
    it('should parse par with single branch', () => {
      const input = `
sequenceDiagram
par Alice to Bob
  A->>B: Hello
end
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);
      const fragment = ast.events[0];
      if (fragment.kind !== 'fragment') throw new Error('Expected fragment');
      expect(fragment.operator).toBe('par');
      expect(fragment.branches).toHaveLength(1);
      expect(fragment.branches[0].condition).toBe('Alice to Bob');
      expect(fragment.branches[0].events).toHaveLength(1);
    });

    it('should parse par with multiple and branches', () => {
      const input = `
sequenceDiagram
par Alice to Bob
  A->>B: Message 1
and Alice to John
  A->>J: Message 2
and Bob to John
  B->>J: Message 3
end
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);
      const fragment = ast.events[0];
      if (fragment.kind !== 'fragment') throw new Error('Expected fragment');
      expect(fragment.operator).toBe('par');
      expect(fragment.branches).toHaveLength(3);
      expect(fragment.branches[0].condition).toBe('Alice to Bob');
      expect(fragment.branches[1].condition).toBe('Alice to John');
      expect(fragment.branches[2].condition).toBe('Bob to John');
    });

    it('should parse nested par within loop', () => {
      const input = `
sequenceDiagram
loop Every minute
  par Task A
    A->>B: Do A
  and Task B
    A->>C: Do B
  end
end
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);
      const loop = ast.events[0];
      if (loop.kind !== 'fragment') throw new Error('Expected fragment');
      expect(loop.operator).toBe('loop');
      expect(loop.branches[0].events).toHaveLength(1);
      const par = loop.branches[0].events[0];
      if (par.kind !== 'fragment') throw new Error('Expected fragment');
      expect(par.operator).toBe('par');
      expect(par.branches).toHaveLength(2);
    });
  });

  describe('Break Fragments', () => {
    it('should parse break fragment', () => {
      const input = `
sequenceDiagram
A->>B: Request
break when condition fails
  B->>A: Error
end
A->>C: Continue
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(3);
      const fragment = ast.events[1];
      if (fragment.kind !== 'fragment') throw new Error('Expected fragment');
      expect(fragment.operator).toBe('break');
      expect(fragment.branches).toHaveLength(1);
      expect(fragment.branches[0].condition).toBe('when condition fails');
    });
  });

  describe('Critical Fragments', () => {
    it('should parse critical with option branches', () => {
      const input = `
sequenceDiagram
critical Establish connection
  A->>B: Connect
option Network error
  A->>B: Retry
option Timeout
  A->>B: Abort
end
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);
      const fragment = ast.events[0];
      if (fragment.kind !== 'fragment') throw new Error('Expected fragment');
      expect(fragment.operator).toBe('critical');
      expect(fragment.branches).toHaveLength(3);
      expect(fragment.branches[0].condition).toBe('Establish connection');
      expect(fragment.branches[1].condition).toBe('Network error');
      expect(fragment.branches[2].condition).toBe('Timeout');
    });

    it('should parse critical without options', () => {
      const input = `
sequenceDiagram
critical Transaction
  A->>B: Begin
  B->>A: Commit
end
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);
      const fragment = ast.events[0];
      if (fragment.kind !== 'fragment') throw new Error('Expected fragment');
      expect(fragment.operator).toBe('critical');
      expect(fragment.branches).toHaveLength(1);
    });
  });

  describe('Rect (Background Highlighting)', () => {
    it('should parse rect with rgb color', () => {
      const input = `
sequenceDiagram
rect rgb(200, 150, 255)
  A->>B: In highlight
end
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);
      const fragment = ast.events[0];
      if (fragment.kind !== 'fragment') throw new Error('Expected fragment');
      expect(fragment.operator).toBe('rect');
      expect(fragment.branches).toHaveLength(1);
      expect(fragment.branches[0].events).toHaveLength(1);
    });

    it('should parse rect with rgba color', () => {
      const input = `
sequenceDiagram
rect rgba(0, 0, 255, 0.1)
  A->>B: Transparent blue
  B->>A: Reply
end
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);
      const fragment = ast.events[0];
      if (fragment.kind !== 'fragment') throw new Error('Expected fragment');
      expect(fragment.branches[0].events).toHaveLength(2);
    });
  });

  describe('Participant Types', () => {
    it('should parse database participant', () => {
      const input = `
sequenceDiagram
participant DB as Database
A->>DB: Query
`;
      const ast = parse(input);
      expect(ast.participants).toHaveLength(2);
      // Note: Currently parsed as 'participant', future enhancement to detect type from context
    });

    it('should parse multiple participant types', () => {
      const input = `
sequenceDiagram
participant User
participant API as API Server
participant DB as Database
User->>API: Request
API->>DB: Query
`;
      const ast = parse(input);
      expect(ast.participants).toHaveLength(3);
      expect(ast.events).toHaveLength(2);
    });
  });
});
