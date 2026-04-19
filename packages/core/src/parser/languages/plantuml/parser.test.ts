import { describe, expect, it } from 'vitest';
import { asFragment, asNote } from '../../../../test/helpers';
import type { PolagramRoot } from '../../../ast';
import { Lexer } from './lexer';
import { Parser } from './parser';

describe('PlantUML Parser', () => {
  const parse = (input: string): PolagramRoot => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    return parser.parse();
  };

  describe('Basic Document Structure', () => {
    it('should parse @startuml/@enduml block', () => {
      const input = `
@startuml
@enduml
`;
      const ast = parse(input);

      expect(ast.kind).toBe('root');
      expect(ast.meta.source).toBe('plantuml');
    });

    it('should parse title', () => {
      const input = `
@startuml
title My Diagram
@enduml
`;
      const ast = parse(input);
      expect(ast.meta.title).toBe('My Diagram');
    });
  });

  describe('Participants & Types', () => {
    it('should parse various participant types', () => {
      const input = `
@startuml
actor User
database DB
participant "Service Wrapper" as Svc
@enduml
`;
      const ast = parse(input);

      expect(ast.participants).toHaveLength(3);
      expect(ast.participants[0]).toMatchObject({
        id: 'User',
        name: 'User',
        type: 'actor',
      });
      expect(ast.participants[1]).toMatchObject({
        id: 'DB',
        name: 'DB',
        type: 'database',
      });
      expect(ast.participants[2]).toMatchObject({
        id: 'Svc',
        name: 'Service Wrapper',
        type: 'participant',
      });
    });
  });

  describe('Messages & Arrows', () => {
    it('should parse sync and reply messages', () => {
      const input = `
@startuml
A -> B : Sync Call
B --> A : Reply
A -> A : Internal
@enduml
`;
      const ast = parse(input);

      expect(ast.events).toHaveLength(3);

      expect(ast.events[0]).toMatchObject({
        kind: 'message',
        from: 'A',
        to: 'B',
        text: 'Sync Call',
        type: 'sync',
        style: { line: 'solid', head: 'arrow' },
      });

      expect(ast.events[1]).toMatchObject({
        kind: 'message',
        from: 'B',
        to: 'A',
        text: 'Reply',
        type: 'reply',
        style: { line: 'dotted', head: 'arrow' }, // PlantUML --> is dotted arrow
      });

      expect(ast.events[2]).toMatchObject({
        kind: 'message',
        from: 'A',
        to: 'A',
        text: 'Internal',
      });
    });
  });

  describe('Lifecycle', () => {
    it('should parse activate and deactivate', () => {
      const input = `
@startuml
activate A
A -> B
deactivate A
@enduml
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(3);
      expect(ast.events[0]).toMatchObject({
        kind: 'activation',
        participantId: 'A',
        action: 'activate',
      });
      expect(ast.events[1]).toMatchObject({
        kind: 'message',
        from: 'A',
        to: 'B',
      });
      expect(ast.events[2]).toMatchObject({
        kind: 'activation',
        participantId: 'A',
        action: 'deactivate',
      });
    });
  });

  describe('Notes', () => {
    it('should parse notes with position', () => {
      const input = `
@startuml
note left of A : Note Left
note right of A : Note Right
note over A : Note Over
note over A, B : Shared Note
@enduml
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(4);
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
      expect(ast.events[3]).toMatchObject({
        kind: 'note',
        position: 'over',
        participantIds: ['A', 'B'],
        text: 'Shared Note',
      });
    });
  });

  describe('Fragments', () => {
    it('should parse alt/else/end', () => {
      const input = `
@startuml
alt success
  A -> B : OK
else failure
  A -> B : Fail
end
@enduml
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);
      const fragment = asFragment(ast.events[0]);
      expect(fragment.kind).toBe('fragment');
      expect(fragment.operator).toBe('alt');
      expect(fragment.branches).toHaveLength(2);
      expect(fragment.branches[0].condition).toBe('success');
      expect(fragment.branches[0].events).toHaveLength(1);
      expect(fragment.branches[1].condition).toBe('failure');
      expect(fragment.branches[1].events).toHaveLength(1);
    });

    it('should parse opt/loop', () => {
      const input = `
@startuml
opt maybe
  A -> B : Maybe
end
loop forever
  A -> B : Repeat
end
@enduml
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(2);
      expect(ast.events[0].kind).toBe('fragment');
      expect(asFragment(ast.events[0]).operator).toBe('opt');
      expect(ast.events[1].kind).toBe('fragment');
      expect(asFragment(ast.events[1]).operator).toBe('loop');
    });
  });

  describe('Grouping', () => {
    it('should parse box with participants', () => {
      const input = `
@startuml
box "Internal Service" #LightBlue
  participant A
  participant B
end box
participant C
@enduml
`;
      const ast = parse(input);
      expect(ast.groups).toHaveLength(1);
      const box = ast.groups[0];
      expect(box.kind).toBe('group');
      expect(box.name).toBe('Internal Service');
      expect(box.style?.backgroundColor).toBe('#LightBlue');
      expect(box.participantIds).toEqual(['A', 'B']);

      expect(ast.participants).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should ignore single line comments', () => {
      const input = `
@startuml
' This is a comment
A -> B : Hello ' Another comment? No, this is part of string usually?
' Comment line
@enduml
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);
      expect(ast.events[0]).toMatchObject({
        text: "Hello ' Another comment? No, this is part of string usually?",
      });
    });

    it('should parse nested fragments', () => {
      const input = `
@startuml
alt outer
  A -> B : Outer
  loop inner
    A -> B : Inner
  end
end
@enduml
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);
      const outer = asFragment(ast.events[0]);
      expect(outer.operator).toBe('alt');

      const outerEvents = outer.branches[0].events;
      expect(outerEvents).toHaveLength(2);
      expect(outerEvents[0].kind).toBe('message');

      const inner = asFragment(outerEvents[1]);
      expect(inner.kind).toBe('fragment');
      expect(inner.operator).toBe('loop');
      expect(inner.branches[0].events).toHaveLength(1);
    });
    it('should parse multi-line notes', () => {
      const input = `
@startuml
note left of A
  Line 1
  Line 2
end note
@enduml
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);
      expect(ast.events[0]).toMatchObject({
        kind: 'note',
        position: 'left',
        participantIds: ['A'],
        // text should contain lines. trim() might remove leading/trailing.
        // We probably want to preserve internal newlines.
      });
      const text = asNote(ast.events[0]).text;
      expect(text).toContain('Line 1');
      expect(text).toContain('Line 2');
    });

    it('should parse note containing PlantUML keywords', () => {
      const input = `
@startuml
note over A: This is an alt and loop test end
@enduml
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);
      const note = ast.events[0];
      expect(note).toMatchObject({
        kind: 'note',
        text: 'This is an alt and loop test end',
      });
    });

    it('should parse multi-line note with keywords', () => {
      const input = `
@startuml
note over A
  The loop will repeat
  alt conditions here
  end of description
end note
@enduml
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);
      const text = asNote(ast.events[0]).text;
      expect(text).toContain('loop');
      expect(text).toContain('alt');
      expect(text).toContain('end of description');
    });
  });

  describe('Sections (folded from "== Title ==" dividers)', () => {
    it('should fold events after a divider into a SectionNode at the top level', () => {
      const input = `
@startuml
A -> B : Message 1
== Section Break ==
A -> B : Message 2
@enduml
`;
      const ast = parse(input);
      // [preamble message, SectionNode { events: [message] }]
      expect(ast.events).toHaveLength(2);

      expect(ast.events[0]).toMatchObject({ kind: 'message', text: 'Message 1' });

      expect(ast.events[1].kind).toBe('section');
      const section = ast.events[1] as Extract<typeof ast.events[number], { kind: 'section' }>;
      expect(section.name).toBe('Section Break');
      expect(section.events).toHaveLength(1);
      expect(section.events[0]).toMatchObject({ kind: 'message', text: 'Message 2' });
    });

    it('should produce one SectionNode per "==" with events grouped under each', () => {
      const input = `
@startuml
A -> B : intro
== One ==
A -> B : in one
== Two ==
A -> B : in two
B --> A : also two
== Three ==
A -> B : in three
@enduml
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(4); // [preamble, sec1, sec2, sec3]

      expect(ast.events[0]).toMatchObject({ kind: 'message', text: 'intro' });

      const s1 = ast.events[1];
      expect(s1.kind).toBe('section');
      if (s1.kind !== 'section') throw new Error('not section');
      expect(s1.name).toBe('One');
      expect(s1.events).toHaveLength(1);

      const s2 = ast.events[2];
      if (s2.kind !== 'section') throw new Error('not section');
      expect(s2.name).toBe('Two');
      expect(s2.events).toHaveLength(2);

      const s3 = ast.events[3];
      if (s3.kind !== 'section') throw new Error('not section');
      expect(s3.name).toBe('Three');
      expect(s3.events).toHaveLength(1);
    });

    it('should produce a SectionNode with empty events for back-to-back dividers', () => {
      const input = `
@startuml
== Empty ==
== Next ==
A -> B : msg
@enduml
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(2);
      const empty = ast.events[0];
      if (empty.kind !== 'section') throw new Error('not section');
      expect(empty.name).toBe('Empty');
      expect(empty.events).toHaveLength(0);

      const next = ast.events[1];
      if (next.kind !== 'section') throw new Error('not section');
      expect(next.name).toBe('Next');
      expect(next.events).toHaveLength(1);
    });

    it('should produce a trailing SectionNode with empty events when nothing follows the last divider', () => {
      const input = `
@startuml
A -> B : msg
== Tail ==
@enduml
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(2);
      const tail = ast.events[1];
      if (tail.kind !== 'section') throw new Error('not section');
      expect(tail.name).toBe('Tail');
      expect(tail.events).toHaveLength(0);
    });

    it('should accept dividers without text (==== ) as anonymous sections', () => {
      const input = `
@startuml
A -> B : First
====
A -> B : Second
@enduml
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(2);
      const sec = ast.events[1];
      if (sec.kind !== 'section') throw new Error('not section');
      expect(sec.name).toBeUndefined();
      expect(sec.events).toHaveLength(1);
    });

    it('should NOT promote a divider inside a fragment to a SectionNode (top-level only)', () => {
      const input = `
@startuml
alt outer
  A -> B : before
  == Inner Divider ==
  A -> B : after
end
@enduml
`;
      const ast = parse(input);
      expect(ast.events).toHaveLength(1);
      const frag = asFragment(ast.events[0]);
      const innerEvents = frag.branches[0].events;
      // Fragment internals keep DividerNode unchanged
      expect(innerEvents.some((e) => e.kind === 'section')).toBe(false);
      expect(innerEvents.some((e) => e.kind === 'divider')).toBe(true);
    });
  });

  describe('Additional Participant Types', () => {
    it('should parse boundary, control, entity participants', () => {
      const input = `
@startuml
boundary UserInterface
control BusinessLogic
entity DataStore
UserInterface -> BusinessLogic : Request
BusinessLogic -> DataStore : Query
@enduml
`;
      const ast = parse(input);
      expect(ast.participants).toHaveLength(3);
      expect(ast.participants[0]).toMatchObject({
        id: 'UserInterface',
        type: 'boundary',
      });
      expect(ast.participants[1]).toMatchObject({
        id: 'BusinessLogic',
        type: 'control',
      });
      expect(ast.participants[2]).toMatchObject({
        id: 'DataStore',
        type: 'entity',
      });
    });

    it('should parse collections and queue participants', () => {
      const input = `
@startuml
collections Workers
queue MessageQueue
Workers -> MessageQueue : Enqueue
@enduml
`;
      const ast = parse(input);
      expect(ast.participants).toHaveLength(2);
      expect(ast.participants[0]).toMatchObject({
        id: 'Workers',
        type: 'collections',
      });
      expect(ast.participants[1]).toMatchObject({
        id: 'MessageQueue',
        type: 'queue',
      });
    });
  });
});
