
import { describe, expect, it } from 'vitest';
import { MessageNode, Participant } from '../../ast';
import { Matcher } from './matcher';

describe('Matcher', () => {
  const matcher = new Matcher();

  describe('Text Matching', () => {
    // We test via matchParticipant since matchText is private
    it('matches string as partial match', () => {
      const p: Participant = { type: 'participant', name: 'UserLogService', id: 'p1' };
      expect(matcher.match(p, { kind: 'participant', text: 'Log' })).toBe(true);
      expect(matcher.match(p, { kind: 'participant', text: 'Admin' })).toBe(false);
    });

    it('matches RegExp', () => {
      const p: Participant = { type: 'participant', name: 'UserLogService', id: 'p1' };
      expect(matcher.match(p, { kind: 'participant', text: /Log/ })).toBe(true);
      expect(matcher.match(p, { kind: 'participant', text: /^User/ })).toBe(true);
      expect(matcher.match(p, { kind: 'participant', text: /^Service/ })).toBe(false);
    });

    it('matches Serializable Object', () => {
      const p: Participant = { type: 'participant', name: 'UserLogService', id: 'p1' };
      expect(matcher.match(p, { kind: 'participant', text: { pattern: 'Log' } })).toBe(true);
      expect(matcher.match(p, { kind: 'participant', text: { pattern: '^user', flags: 'i' } })).toBe(true);
    });
  });

  describe('Participant Matching', () => {
    it('matches by ID', () => {
      const p: Participant = { type: 'participant', name: 'User', id: 'user_01' };
      expect(matcher.match(p, { kind: 'participant', id: 'user_01' })).toBe(true);
      expect(matcher.match(p, { kind: 'participant', id: 'other' })).toBe(false);
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
            head: 'arrow'
        }
    };

    it('matches by text', () => {
      expect(matcher.match(msg, { kind: 'message', text: 'Login' })).toBe(true);
    });

    it('matches by from/to', () => {
      expect(matcher.match(msg, { kind: 'message', from: 'user' })).toBe(true);
      expect(matcher.match(msg, { kind: 'message', to: 'db' })).toBe(false);
    });
  });
});
