
import { describe, expect, it } from 'vitest';
import type { NoteNode, PolagramRoot } from '../../ast';
import type { FocusLayer, MergeLayer, RemoveLayer } from '../types';
import { FocusFilter } from './focus';
import { MergeFilter } from './merge';
import { RemoveFilter } from './remove';

describe('Filter Consistency (Note Survival)', () => {
  const createAst = (noteParticipantIds: string[]): PolagramRoot => ({
    kind: 'root',
    meta: { version: '1', source: 'unknown' },
    participants: [
      { id: 'A', name: 'A', type: 'participant' },
      { id: 'B', name: 'B', type: 'participant' },
      { id: 'C', name: 'C', type: 'participant' },
    ],
    groups: [],
    events: [
      {
        kind: 'note',
        id: 'n1',
        text: 'Test Note',
        position: 'over',
        participantIds: noteParticipantIds,
      } as NoteNode,
    ],
  });

  // Scenario 1: Remove
  // Note over A, B. Remove A. -> Note over B.
  it('Remove: keeps note if at least one participant remains (A removed)', () => {
    const root = createAst(['A', 'B']);
    const layer: RemoveLayer = {
      action: 'remove',
      selector: { kind: 'participant', name: 'A' },
    };
    const result = new RemoveFilter(layer).transform(root);

    expect(result.events).toHaveLength(1);
    const note = result.events[0] as NoteNode;
    expect(note.participantIds).toEqual(['B']);
  });

  it('Remove: deletes note if ALL participants are removed', () => {
    const root = createAst(['A']);
    const layer: RemoveLayer = {
      action: 'remove',
      selector: { kind: 'participant', name: 'A' },
    };
    const result = new RemoveFilter(layer).transform(root);

    expect(result.events).toHaveLength(0);
  });

  // Scenario 2: Focus
  // Note over A, B. Focus B. -> Note over B.
  it('Focus: keeps note and trims IDs if at least one participant is focused', () => {
    const root = createAst(['A', 'B']);
    const layer: FocusLayer = {
      action: 'focus',
      selector: { kind: 'participant', name: 'B' },
    };
    const result = new FocusFilter(layer).transform(root);

    expect(result.events).toHaveLength(1);
    const note = result.events[0] as NoteNode;
    expect(note.participantIds).toEqual(['B']);
  });

  // Scenario 3 & 4: Merge
  // Note over A, B. Merge A, B into C. -> Note over C.
  it('Merge: keeps internal note and maps to target (Merge A, B -> C)', () => {
    const root = createAst(['A', 'B']);
    const layer: MergeLayer = {
      action: 'merge',
      selector: { kind: 'participant', name: /(A|B)/ }, // Regex match for both
      into: { name: 'C' },
    };
    const result = new MergeFilter(layer).transform(root);

    expect(result.events).toHaveLength(1);
    const note = result.events[0] as NoteNode;
    // Both A and B map to C. uniqueIds should be ['C'].
    // Note implementation detail: targetId is determined by "into".
    // If id not provided, it might generate one?
    // In merge.ts logic: if into.id not present, use name sanitized or joined IDs.
    // 'C' is safe.
    expect(note.participantIds).toEqual(['C']);
  });

  it('Merge: maps single participant note (Merge A -> C)', () => {
    const root = createAst(['A']);
    const layer: MergeLayer = {
      action: 'merge',
      selector: { kind: 'participant', name: 'A' },
      into: { name: 'C' },
    };
    const result = new MergeFilter(layer).transform(root);

    expect(result.events).toHaveLength(1);
    const note = result.events[0] as NoteNode;
    expect(note.participantIds).toEqual(['C']);
  });
  // --- ReferenceNode Scenarios (Should match Note behavior) ---

  it('Remove: keeps ref if at least one participant remains', () => {
    const root = createAst(['A', 'B']);
    // Add a ref node
    root.events.push({
      kind: 'ref',
      id: 'r1',
      text: 'Ref',
      participantIds: ['A', 'B'],
    });

    const layer: RemoveLayer = {
      action: 'remove',
      selector: { kind: 'participant', name: 'A' },
    };
    const result = new RemoveFilter(layer).transform(root);

    // Should have 1 note (from createAst) + 1 ref
    expect(result.events).toHaveLength(2);
    
    const note = result.events[0] as NoteNode;
    expect(note.participantIds).toEqual(['B']);

    const ref = result.events[1] as any; // Cast for now
    expect(ref.kind).toBe('ref');
    expect(ref.participantIds).toEqual(['B']);
  });

  it('Focus: keeps ref and trims IDs', () => {
    const root = createAst(['A', 'B']);
     root.events.push({
      kind: 'ref',
      id: 'r1',
      text: 'Ref',
      participantIds: ['A', 'B'],
    });

    const layer: FocusLayer = {
      action: 'focus',
      selector: { kind: 'participant', name: 'B' },
    };
    const result = new FocusFilter(layer).transform(root);

    expect(result.events).toHaveLength(2);
    const ref = result.events[1] as any;
    expect(ref.participantIds).toEqual(['B']);
  });

  it('Merge: keeps internal ref and maps to target', () => {
    const root = createAst(['A', 'B']);
     root.events.push({
      kind: 'ref',
      id: 'r1',
      text: 'Ref',
      participantIds: ['A', 'B'],
    });

    const layer: MergeLayer = {
      action: 'merge',
      selector: { kind: 'participant', name: /(A|B)/ },
      into: { name: 'C' },
    };
    const result = new MergeFilter(layer).transform(root);

    expect(result.events).toHaveLength(2);
    const ref = result.events[1] as any;
    expect(ref.participantIds).toEqual(['C']);
  });
  it('Merge: updates groups (Box) with new target ID', () => {
    const root = createAst(['A', 'B']);
    // Add a group containing A and B
    root.groups.push({
      kind: 'group',
      id: 'g1',
      name: 'Services',
      participantIds: ['A', 'B'],
    });

    const layer: MergeLayer = {
      action: 'merge',
      selector: { kind: 'participant', name: /(A|B)/ },
      into: { name: 'C' },
    };
    const result = new MergeFilter(layer).transform(root);

    expect(result.groups).toHaveLength(1);
    const group = result.groups[0];
    // A and B should be mapped to C, deduplicated
    expect(group.participantIds).toEqual(['C']);
  });
});
