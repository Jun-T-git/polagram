import { describe, expect, it } from 'vitest';
import type {
  EventNode,
  MessageNode,
  Participant,
  PolagramRoot,
  SectionNode,
} from '../../ast';
import type { FocusLayer, SectionSelector } from '../types';
import { FocusSectionFilter } from './focus-section';

const participants: Participant[] = [
  { id: 'A', name: 'A', type: 'participant' },
  { id: 'B', name: 'B', type: 'participant' },
  { id: 'C', name: 'C', type: 'participant' },
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

const focus = (selector: SectionSelector) => {
  const layer: FocusLayer = { action: 'focus', selector };
  return new FocusSectionFilter(layer);
};

describe('FocusSectionFilter', () => {
  describe('UC1: single section by name', () => {
    it('keeps only the matched section, drops preamble and other sections', () => {
      const preamble = msg('p1', 'A', 'B', 'preamble');
      const s1 = section('s1', 'Onboarding', [
        msg('m1', 'A', 'B', 'in onboarding'),
      ]);
      const s2 = section('s2', 'Diagnostic', [msg('m2', 'A', 'C', 'in diag')]);

      const root = buildRoot([preamble, s1, s2]);
      const result = focus({ kind: 'section', name: 'Onboarding' }).transform(
        root,
      );

      expect(result.events).toHaveLength(1);
      const kept = result.events[0];
      if (kept.kind !== 'section') throw new Error('not section');
      expect(kept.name).toBe('Onboarding');
      expect(kept.events).toHaveLength(1);
    });

    it('returns empty events when no section matches', () => {
      const s1 = section('s1', 'Onboarding', [msg('m1', 'A', 'B', 'in')]);
      const root = buildRoot([s1]);

      const result = focus({ kind: 'section', name: 'Missing' }).transform(
        root,
      );

      expect(result.events).toHaveLength(0);
    });

    it('matches by regex pattern', () => {
      const s1 = section('s1', 'オンボーディング', [msg('m1', 'A', 'B', 'x')]);
      const s2 = section('s2', 'Webhook', [msg('m2', 'B', 'C', 'y')]);
      const root = buildRoot([s1, s2]);

      const result = focus({
        kind: 'section',
        name: { pattern: 'ボーディング' },
      }).transform(root);

      expect(result.events).toHaveLength(1);
      const kept = result.events[0];
      if (kept.kind !== 'section') throw new Error('not section');
      expect(kept.name).toBe('オンボーディング');
    });
  });

  describe('UC2: contiguous range via between', () => {
    const s1 = section('s1', '初回アクセス', [msg('m1', 'A', 'B', '1')]);
    const s2 = section('s2', 'オンボーディング', [msg('m2', 'A', 'B', '2')]);
    const s3 = section('s3', '診断判定', [msg('m3', 'A', 'C', '3')]);
    const s4 = section('s4', 'オンボーディング完了', [
      msg('m4', 'A', 'B', '4'),
    ]);
    const s5 = section('s5', '日常利用', [msg('m5', 'B', 'C', '5')]);

    it('keeps the inclusive range from..to (default inclusive=true)', () => {
      const root = buildRoot([s1, s2, s3, s4, s5]);
      const result = focus({
        kind: 'section',
        between: {
          from: '初回アクセス',
          to: 'オンボーディング完了',
        },
      }).transform(root);

      const names = result.events.map((e) =>
        e.kind === 'section' ? e.name : null,
      );
      expect(names).toEqual([
        '初回アクセス',
        'オンボーディング',
        '診断判定',
        'オンボーディング完了',
      ]);
    });

    it('respects inclusive=false (drops the boundary sections)', () => {
      const root = buildRoot([s1, s2, s3, s4, s5]);
      const result = focus({
        kind: 'section',
        between: {
          from: '初回アクセス',
          to: 'オンボーディング完了',
          inclusive: false,
        },
      }).transform(root);

      const names = result.events.map((e) =>
        e.kind === 'section' ? e.name : null,
      );
      expect(names).toEqual(['オンボーディング', '診断判定']);
    });

    it('returns empty when from or to is not found', () => {
      const root = buildRoot([s1, s2]);
      const result = focus({
        kind: 'section',
        between: { from: '初回アクセス', to: '存在しない' },
      }).transform(root);
      expect(result.events).toHaveLength(0);
    });
  });

  describe('UC1+UC2: any-of via names', () => {
    it('keeps every section whose name matches any in the list (preserving order)', () => {
      const s1 = section('s1', 'A', [msg('m1', 'A', 'B', 'a')]);
      const s2 = section('s2', 'B', [msg('m2', 'A', 'B', 'b')]);
      const s3 = section('s3', 'C', [msg('m3', 'A', 'B', 'c')]);

      const root = buildRoot([s1, s2, s3]);
      const result = focus({
        kind: 'section',
        names: ['A', 'C'],
      }).transform(root);

      expect(
        result.events.map((e) => (e.kind === 'section' ? e.name : null)),
      ).toEqual(['A', 'C']);
    });
  });

  describe('Defensive narrowing', () => {
    it('throws if constructed with a non-section selector (mis-routed)', () => {
      const bad: FocusLayer = {
        action: 'focus',
        selector: { kind: 'participant', name: 'A' },
      };
      expect(() => new FocusSectionFilter(bad)).toThrow(
        /expects a section selector/,
      );
    });
  });

  describe('Participant cleanup', () => {
    it('does not directly prune participants (delegated to UnusedCleaner)', () => {
      // Symmetric with FocusFilter: the filter only restricts events; the
      // engine's UnusedCleaner is what removes orphan participants. Verified
      // end-to-end by the functional engine tests.
      const s1 = section('s1', 'Phase 1', [msg('m1', 'A', 'B', 'AB')]);
      const s2 = section('s2', 'Phase 2', [msg('m2', 'A', 'C', 'AC')]);

      const root = buildRoot([s1, s2]);
      const result = focus({ kind: 'section', name: 'Phase 1' }).transform(
        root,
      );

      expect(result.participants.map((p) => p.id).sort()).toEqual([
        'A',
        'B',
        'C',
      ]);
    });
  });
});
