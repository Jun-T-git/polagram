import { describe, expect, it } from 'vitest';
import type {
  ActivationNode,
  MessageNode,
  NoteNode,
  PolagramRoot,
} from '../../ast';
import { UnusedCleaner } from './prune-unused';

describe('UnusedCleaner', () => {
  const createAst = (participants: any[], events: any[]): PolagramRoot => ({
    kind: 'root',
    meta: { version: '1', source: 'unknown' },
    participants,
    groups: [],
    events,
  });

  it('removes participants that are not referenced in messages', () => {
    const p1 = { id: 'A', name: 'Alice', type: 'participant' as const };
    const p2 = { id: 'B', name: 'Bob', type: 'participant' as const };
    const p3 = { id: 'C', name: 'Charlie', type: 'participant' as const }; // Unused

    const msg: MessageNode = {
      kind: 'message',
      id: 'm1',
      text: 'Hi',
      from: 'A',
      to: 'B',
      type: 'sync',
      style: { line: 'solid', head: 'arrow' },
    };

    const root = createAst([p1, p2, p3], [msg]);
    const result = new UnusedCleaner().transform(root);

    expect(result.participants).toHaveLength(2);
    expect(result.participants.map((p) => p.id)).toEqual(['A', 'B']);
  });

  it('keeps participants referenced in activations', () => {
    const p1 = { id: 'A', name: 'Alice', type: 'participant' as const };
    const act: ActivationNode = {
      kind: 'activation',
      participantId: 'A',
      action: 'activate',
    };

    const root = createAst([p1], [act]);
    const result = new UnusedCleaner().transform(root);

    expect(result.participants).toHaveLength(1);
  });

  it('keeps participants referenced in notes', () => {
    const p1 = { id: 'A', name: 'Alice', type: 'participant' as const };
    const note: NoteNode = {
      kind: 'note',
      id: 'n1',
      text: 'Note',
      position: 'over',
      participantIds: ['A'],
    };

    const root = createAst([p1], [note]);
    const result = new UnusedCleaner().transform(root);

    expect(result.participants).toHaveLength(1);
  });

  it('cleans up groups removing unused members', () => {
    const p1 = { id: 'A', name: 'Alice', type: 'participant' as const };
    const p2 = { id: 'B', name: 'Bob', type: 'participant' as const }; // Unused

    const group = {
      kind: 'group' as const,
      id: 'g1',
      name: 'G',
      participantIds: ['A', 'B'],
    };

    const msg: MessageNode = {
      kind: 'message',
      id: 'm1',
      text: 'Hi',
      from: 'A',
      to: 'A',
      type: 'sync',
      style: { line: 'solid', head: 'arrow' },
    };

    const root: PolagramRoot = {
      kind: 'root' as const,
      meta: { version: '1', source: 'unknown' as const },
      participants: [p1, p2],
      groups: [group],
      events: [msg],
    };

    const result = new UnusedCleaner().transform(root);

    expect(result.participants.map((p) => p.id)).toEqual(['A']);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].participantIds).toEqual(['A']);
  });

  it('removes group entirely if becomes empty', () => {
    const p2 = { id: 'B', name: 'Bob', type: 'participant' as const }; // Unused
    const group = {
      kind: 'group' as const,
      id: 'g1',
      name: 'G',
      participantIds: ['B'],
    };

    const root: PolagramRoot = {
      kind: 'root' as const,
      meta: { version: '1', source: 'unknown' as const },
      participants: [p2],
      groups: [group],
      events: [],
    };

    const result = new UnusedCleaner().transform(root);
    expect(result.groups).toHaveLength(0);
  });
});
