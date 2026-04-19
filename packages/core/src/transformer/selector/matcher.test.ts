import { describe, expect, it } from 'vitest';
import type { MessageNode, Participant } from '../../ast';
import { Matcher } from './matcher';

describe('Matcher', () => {
  const matcher = new Matcher();

  describe('Text Matching', () => {
    // We test via matchParticipant since matchText is private
    it('matches string as exact match', () => {
      const p: Participant = {
        type: 'participant',
        name: 'UserLogService',
        id: 'p1',
      };
      expect(
        matcher.matchParticipant(p, {
          kind: 'participant',
          name: 'UserLogService',
        }),
      ).toBe(true);
      expect(
        matcher.matchParticipant(p, { kind: 'participant', name: 'Log' }),
      ).toBe(false);
    });

    it('matches RegExp', () => {
      const p: Participant = {
        type: 'participant',
        name: 'UserLogService',
        id: 'p1',
      };
      expect(
        matcher.matchParticipant(p, { kind: 'participant', name: /Log/ }),
      ).toBe(true);
      expect(
        matcher.matchParticipant(p, { kind: 'participant', name: /^User/ }),
      ).toBe(true);
      expect(
        matcher.matchParticipant(p, { kind: 'participant', name: /^Service/ }),
      ).toBe(false);
    });

    it('matches Serializable Object', () => {
      const p: Participant = {
        type: 'participant',
        name: 'UserLogService',
        id: 'p1',
      };
      expect(
        matcher.matchParticipant(p, {
          kind: 'participant',
          name: { pattern: 'Log' },
        }),
      ).toBe(true);
      expect(
        matcher.matchParticipant(p, {
          kind: 'participant',
          name: { pattern: '^user', flags: 'i' },
        }),
      ).toBe(true);
    });
  });

  describe('Participant Matching', () => {
    it('matches by ID', () => {
      const p: Participant = {
        type: 'participant',
        name: 'User',
        id: 'user_01',
      };
      expect(
        matcher.matchParticipant(p, { kind: 'participant', id: 'user_01' }),
      ).toBe(true);
      expect(
        matcher.matchParticipant(p, { kind: 'participant', id: 'other' }),
      ).toBe(false);
    });
  });

  describe('Message Matching', () => {
    const msg: MessageNode = {
      kind: 'message',
      text: 'Login Request',
      from: 'user',
      to: 'api',
      id: 'm1',
      type: 'sync',
      style: {
        line: 'solid',
        head: 'arrow',
      },
    };

    it('matches by text', () => {
      expect(
        matcher.matchMessage(msg, { kind: 'message', text: 'Login Request' }),
      ).toBe(true);
      expect(
        matcher.matchMessage(msg, { kind: 'message', text: 'Login' }),
      ).toBe(false);
    });

    it('matches by from/to', () => {
      expect(matcher.matchMessage(msg, { kind: 'message', from: 'user' })).toBe(
        true,
      );
      expect(matcher.matchMessage(msg, { kind: 'message', to: 'db' })).toBe(
        false,
      );
    });
  });

  describe('Branch Matching', () => {
    const branch = { id: 'b1', condition: 'valid', events: [] };

    it('matches by operator', () => {
      // Operator matching is against the PARENT fragment's operator
      expect(
        matcher.matchBranch(
          branch,
          { kind: 'fragment', operator: 'alt' },
          'alt',
        ),
      ).toBe(true);
      expect(
        matcher.matchBranch(
          branch,
          { kind: 'fragment', operator: 'loop' },
          'alt',
        ),
      ).toBe(false);
      expect(
        matcher.matchBranch(
          branch,
          { kind: 'fragment', operator: ['alt', 'opt'] },
          'alt',
        ),
      ).toBe(true);
    });

    it('matches by condition', () => {
      expect(
        matcher.matchBranch(
          branch,
          { kind: 'fragment', condition: 'valid' },
          'alt',
        ),
      ).toBe(true);
      expect(
        matcher.matchBranch(
          branch,
          { kind: 'fragment', condition: 'invalid' },
          'alt',
        ),
      ).toBe(false);
    });

    it('returns false if branch has no condition but selector requires one', () => {
      const noCondBranch = { id: 'b2', events: [] };
      expect(
        matcher.matchBranch(
          noCondBranch,
          { kind: 'fragment', condition: 'needed' },
          'alt',
        ),
      ).toBe(false);
    });
  });

  describe('Section Matching', () => {
    const named = { kind: 'section' as const, id: 's1', name: 'Onboarding', events: [] };
    const unnamed = { kind: 'section' as const, id: 's2', events: [] };

    it('matches by name (exact string)', () => {
      expect(
        matcher.matchSection(named, { kind: 'section', name: 'Onboarding' }),
      ).toBe(true);
      expect(
        matcher.matchSection(named, { kind: 'section', name: 'Other' }),
      ).toBe(false);
    });

    it('matches by name (regex pattern)', () => {
      expect(
        matcher.matchSection(named, { kind: 'section', name: { pattern: 'board' } }),
      ).toBe(true);
      expect(
        matcher.matchSection(named, { kind: 'section', name: /^On/ }),
      ).toBe(true);
    });

    it('matches by names list (any-of)', () => {
      expect(
        matcher.matchSection(named, {
          kind: 'section',
          names: ['Other', 'Onboarding'],
        }),
      ).toBe(true);
      expect(
        matcher.matchSection(named, {
          kind: 'section',
          names: ['Other', 'Stuff'],
        }),
      ).toBe(false);
    });

    it('returns false for unnamed sections when a name matcher is given', () => {
      expect(
        matcher.matchSection(unnamed, { kind: 'section', name: 'X' }),
      ).toBe(false);
    });

    // Note: the empty selector `{ kind: 'section' }` is rejected at compile
    // time (discriminated union requires exactly one of name/names/between)
    // and at runtime by the Zod schema's refine. There is no "matches every
    // section" fallback — that ambiguity was removed deliberately.
  });
});
