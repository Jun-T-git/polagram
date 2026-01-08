import { describe, expect, it } from 'vitest';
import type { PolagramRoot } from '../../ast';
import { MergeFilter } from './merge';

describe('MergeFilter Complex Scenarios', () => {
  const createAst = (events: any[]): PolagramRoot => ({
    kind: 'root',
    meta: { version: '1.0', source: 'unknown' },
    participants: [
      { id: 'A', name: 'Service A', type: 'participant' },
      { id: 'B', name: 'Service B', type: 'participant' },
      { id: 'C', name: 'Service C', type: 'participant' },
      { id: 'User', name: 'User', type: 'actor' },
    ],
    groups: [],
    events,
  });

  const mergeABconfig = {
    action: 'merge' as const,
    into: { name: 'System' },
    selector: { kind: 'participant' as const, name: { pattern: 'Service [AB]' } },
  };

  it('Scenario: The Black Box - Hides all internal complexity', () => {
    // User -> A
    // A -> B (internal)
    // alt { B -> A (internal) }
    // start loop
    //   A -> B (internal)
    // end loop
    // B -> User
    //
    // Expectation:
    // User -> System
    // System -> User
    const events = [
      { kind: 'message', from: 'User', to: 'A', text: 'req' },
      { kind: 'message', from: 'A', to: 'B', text: 'internal1' },
      {
        kind: 'fragment', operator: 'alt', branches: [
          { events: [{ kind: 'message', from: 'B', to: 'A', text: 'internal2' }] },
        ]
      },
      {
        kind: 'fragment', operator: 'loop', branches: [
          { events: [{ kind: 'message', from: 'A', to: 'B', text: 'internal3' }] },
        ]
      },
      { kind: 'message', from: 'B', to: 'User', text: 'res' },
    ];

    const filter = new MergeFilter(mergeABconfig);
    const result = filter.transform(createAst(events)) as PolagramRoot;
    
    expect(result.events).toHaveLength(2);
    expect((result.events[0] as any).from).toBe('User');
    expect((result.events[0] as any).to).toBe('System');
    expect((result.events[1] as any).from).toBe('System');
    expect((result.events[1] as any).to).toBe('User');
  });

  it('Scenario: The Intermediary - Preserves external interactions in middle', () => {
    // A -> C (External)
    // C -> B (External)
    //
    // Expectation:
    // System -> C
    // C -> System
    const events = [
      { kind: 'message', from: 'A', to: 'C', text: 'req to C' },
      { kind: 'message', from: 'C', to: 'B', text: 'req to B' },
    ];

    const filter = new MergeFilter(mergeABconfig);
    const result = filter.transform(createAst(events)) as PolagramRoot;
    
    expect(result.events).toHaveLength(2);
    expect((result.events[0] as any).from).toBe('System');
    expect((result.events[0] as any).to).toBe('C');
    expect((result.events[1] as any).from).toBe('C');
    expect((result.events[1] as any).to).toBe('System');
  });

  it('Scenario: Deeply Nested Cleanups - Ripples empty fragment deletion', () => {
    // alt {
    //   loop {
    //     A -> B (internal -> deleted)
    //   } (loop becomes empty -> deleted)
    // } (alt becomes empty -> deleted)
    // A -> C (kept)
    //
    // Expectation:
    // System -> C
    const events = [
      {
        kind: 'fragment', operator: 'alt', branches: [
          {
            events: [
              {
                kind: 'fragment', operator: 'loop', branches: [
                  { events: [{ kind: 'message', from: 'A', to: 'B' }] }
                ]
              }
            ]
          }
        ]
      },
      { kind: 'message', from: 'A', to: 'C', text: 'kept' }
    ];

    const filter = new MergeFilter(mergeABconfig);
    const result = filter.transform(createAst(events)) as PolagramRoot;
    
    expect(result.events).toHaveLength(1);
    expect((result.events[0] as any).to).toBe('C');
  });

  it('Scenario: Mixed Note - Handles notes with mixed participants', () => {
      // Note over A, B, C
      // Expected: Note over System, C
      const events = [
          { kind: 'note', participantIds: ['A', 'B', 'C'], text: 'Mixed' }
      ];
      
      const filter = new MergeFilter(mergeABconfig);
      const result = filter.transform(createAst(events)) as PolagramRoot;
      
      expect(result.events).toHaveLength(1);
      const note = result.events[0] as any;
      expect(note.participantIds).toContain('System');
      expect(note.participantIds).toContain('C');
      expect(note.participantIds.length).toBe(2);
  });
});
