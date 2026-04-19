import { describe, expect, it } from 'vitest';
import type {
  EventNode,
  MessageNode,
  Participant,
  PolagramRoot,
  SectionNode,
} from '../../ast';
import type { RemoveLayer, SectionSelector } from '../types';
import { RemoveSectionFilter } from './remove-section';

const participants: Participant[] = [
  { id: 'A', name: 'A', type: 'participant' },
  { id: 'B', name: 'B', type: 'participant' },
];

const msg = (
  id: string,
  from: string,
  to: string,
  text: string,
): MessageNode => ({
  kind: 'message',
  id,
  from,
  to,
  text,
  type: 'sync',
  style: { line: 'solid', head: 'arrow' },
});

const section = (
  id: string,
  name: string,
  events: EventNode[],
): SectionNode => ({
  kind: 'section',
  id,
  name,
  events,
});

const buildRoot = (events: EventNode[]): PolagramRoot => ({
  kind: 'root',
  meta: { version: '1', source: 'plantuml' },
  participants: [...participants],
  groups: [],
  events,
});

const remove = (selector: SectionSelector) => {
  const layer: RemoveLayer = { action: 'remove', selector };
  return new RemoveSectionFilter(layer);
};

describe('RemoveSectionFilter', () => {
  it('UC3: removes the matched section but keeps preamble and other sections', () => {
    const preamble = msg('p1', 'A', 'B', 'preamble');
    const s1 = section('s1', 'Onboarding', [msg('m1', 'A', 'B', 'in')]);
    const s2 = section('s2', 'Webhook', [msg('m2', 'A', 'B', 'webhook')]);
    const s3 = section('s3', 'Cleanup', [msg('m3', 'A', 'B', 'clean')]);

    const root = buildRoot([preamble, s1, s2, s3]);
    const result = remove({ kind: 'section', name: 'Webhook' }).transform(root);

    const sectionNames = result.events
      .filter((e): e is SectionNode => e.kind === 'section')
      .map((s) => s.name);
    expect(sectionNames).toEqual(['Onboarding', 'Cleanup']);

    // Preamble survives.
    expect(result.events[0].kind).toBe('message');
  });

  it('removes sections matched by names list', () => {
    const s1 = section('s1', 'A', [msg('m1', 'A', 'B', 'a')]);
    const s2 = section('s2', 'B', [msg('m2', 'A', 'B', 'b')]);
    const s3 = section('s3', 'C', [msg('m3', 'A', 'B', 'c')]);

    const root = buildRoot([s1, s2, s3]);
    const result = remove({
      kind: 'section',
      names: ['A', 'C'],
    }).transform(root);

    const names = result.events
      .filter((e): e is SectionNode => e.kind === 'section')
      .map((s) => s.name);
    expect(names).toEqual(['B']);
  });

  it('removes the inclusive between range', () => {
    const s1 = section('s1', '初回アクセス', [msg('m1', 'A', 'B', '1')]);
    const s2 = section('s2', 'オンボーディング', [msg('m2', 'A', 'B', '2')]);
    const s3 = section('s3', '診断判定', [msg('m3', 'A', 'B', '3')]);
    const s4 = section('s4', '日常利用', [msg('m4', 'A', 'B', '4')]);

    const root = buildRoot([s1, s2, s3, s4]);
    const result = remove({
      kind: 'section',
      between: { from: 'オンボーディング', to: '診断判定' },
    }).transform(root);

    const names = result.events
      .filter((e): e is SectionNode => e.kind === 'section')
      .map((s) => s.name);
    expect(names).toEqual(['初回アクセス', '日常利用']);
  });

  it('throws if constructed with a non-section selector (mis-routed)', () => {
    const bad: RemoveLayer = {
      action: 'remove',
      selector: { kind: 'participant', name: 'A' },
    };
    expect(() => new RemoveSectionFilter(bad)).toThrow(
      /expects a section selector/,
    );
  });

  it('does not auto-cleanup orphan participants (remove leaves the rest as-is)', () => {
    // Symmetric with how `remove:message` does not prune participants —
    // `remove:section` is "drop this, keep the rest" not "narrow down".
    const cParticipant: Participant = {
      id: 'C',
      name: 'C',
      type: 'participant',
    };
    const s1 = section('s1', 'Keep', [msg('m1', 'A', 'B', 'k')]);
    const s2 = section('s2', 'Drop', [msg('m2', 'A', 'C', 'd')]);
    const root: PolagramRoot = {
      kind: 'root',
      meta: { version: '1', source: 'plantuml' },
      participants: [...participants, cParticipant],
      groups: [],
      events: [s1, s2],
    };

    const result = remove({ kind: 'section', name: 'Drop' }).transform(root);
    // RemoveSectionFilter itself doesn't touch participants. Pruning of
    // unused C happens in the post-pipeline UnusedCleaner (verified separately
    // via the engine integration test).
    expect(result.participants.map((p) => p.id).sort()).toEqual([
      'A',
      'B',
      'C',
    ]);
  });
});
