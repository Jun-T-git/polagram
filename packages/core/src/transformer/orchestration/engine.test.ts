import { describe, expect, it, vi } from 'vitest';
import type { FragmentNode, MessageNode, PolagramRoot } from '../../ast';
import type { FocusLayer } from '../types';
import { TransformationEngine } from './engine';

describe('TransformationEngine (Pipeline Integration)', () => {
  const createAst = (participants: any[], events: any[]): PolagramRoot => ({
    kind: 'root',
    meta: { version: '1', source: 'unknown' },
    participants,
    groups: [],
    events,
  });

  const msgAB: MessageNode = {
    kind: 'message',
    id: 'm1',
    text: 'A->B',
    from: 'A0',
    to: 'B0',
    type: 'sync',
    style: { line: 'solid', head: 'arrow' },
  };
  const msgCD: MessageNode = {
    kind: 'message',
    id: 'm2',
    text: 'C->D',
    from: 'C0',
    to: 'D0',
    type: 'sync',
    style: { line: 'solid', head: 'arrow' },
  };

  // Participants
  const pA = { id: 'A0', name: 'A', type: 'participant' as const };
  const pB = { id: 'B0', name: 'B', type: 'participant' as const };
  const pC = { id: 'C0', name: 'C', type: 'participant' as const };
  const pD = { id: 'D0', name: 'D', type: 'participant' as const };

  it('runs FocusParticipant -> StructureCleaner pipeline correctly', () => {
    const fragment: FragmentNode = {
      kind: 'fragment',
      id: 'f1',
      operator: 'alt',
      branches: [
        { id: 'b1', condition: 'keep', events: [msgAB] },
        { id: 'b2', condition: 'drop', events: [msgCD] },
      ],
    };

    const root = createAst([pA, pB, pC, pD], [fragment]);

    // Rule: Focus A. (Should keep msgAB, remove msgCD)
    const layer: FocusLayer = {
      action: 'focus',
      selector: { kind: 'participant', name: 'A' },
    };

    const result = new TransformationEngine().transform(root, [layer]);

    // 1. Filter (Focus) should have cleared events in b2 but left empty branch
    // 2. Cleaner (Structure) should have removed b2

    const resFrag = result.events[0] as FragmentNode;
    expect(resFrag.branches).toHaveLength(1);
    expect(resFrag.branches[0].id).toBe('b1'); // b2 is gone

    // 3. Cleaner (Unused) should have removed C and D
    expect(result.participants.map((p) => p.id).sort()).toEqual(['A0', 'B0']);
  });

  it('handles unknown actions gracefully (identity)', () => {
    const root = createAst([pA], [msgAB]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // @ts-expect-error - purposefully passing invalid action
    const result = new TransformationEngine().transform(root, [
      { action: 'invalid' },
    ]);

    expect(result).toEqual(root); // Logic remains identity, but object reference changes due to CoW cleaners
    // Actually structure cleaner typically returns new object.
    // But main point is it didn't crash.

    expect(warnSpy).toHaveBeenCalledWith('Unknown action: invalid');
    warnSpy.mockRestore();
  });
});
