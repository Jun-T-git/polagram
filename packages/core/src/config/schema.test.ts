import { describe, expect, it } from 'vitest';
import { validateConfig } from './schema';

describe('Config Schema Validation', () => {
  it('should validate a correct configuration', () => {
    const input = {
      version: 1,
      targets: [
        {
          input: ['src/*.mmd'],
          outputDir: 'dist',
          lenses: [
            {
              name: 'Success',
              layers: [
                {
                  action: 'resolve',
                  selector: { kind: 'fragment', condition: 'Success' },
                },
              ],
            },
          ],
        },
      ],
    };

    const config = validateConfig(input);
    expect(config.version).toBe(1);
    expect(config.targets[0].lenses[0].name).toBe('Success');
  });

  it('should throw error for missing required fields', () => {
    const input = {
      // missing version
      targets: [],
    };

    expect(() => validateConfig(input)).toThrow(
      'Invalid Polagram Configuration',
    );
    // Zod message might vary, just checking it fails is often enough,
    // but let's check for the path at least.
    expect(() => validateConfig(input)).toThrow('[version]:');
  });

  it('should validate fragment selector correctly', () => {
    const input = {
      version: 1,
      targets: [
        {
          input: ['src/*.mmd'],
          outputDir: 'dist',
          lenses: [
            {
              name: 'Test',
              layers: [
                {
                  action: 'resolve',
                  selector: { kind: 'fragment', condition: 'Success' },
                },
              ],
            },
          ],
        },
      ],
    };
    expect(() => validateConfig(input)).not.toThrow();
  });

  it('should validate merge layer correctly', () => {
    const input = {
      version: 1,
      targets: [
        {
          input: ['src/*.mmd'],
          outputDir: 'dist',
          lenses: [
            {
              name: 'Test',
              layers: [
                {
                  action: 'merge',
                  into: { name: 'Managed' },
                  selector: { kind: 'participant', name: 'A' },
                },
              ],
            },
          ],
        },
      ],
    };
    expect(() => validateConfig(input)).not.toThrow();
  });

  it('should fail if selector kind is missing', () => {
    const input = {
      version: 1,
      targets: [
        {
          input: ['src/*.mmd'],
          outputDir: 'dist',
          lenses: [
            {
              name: 'Test',
              layers: [
                {
                  action: 'focus',
                  selector: { condition: 'Success' }, // Missing kind: 'fragment'
                },
              ],
            },
          ],
        },
      ],
    };
    // Expect failure because checking against union requires discrimination
    expect(() => validateConfig(input)).toThrow();
  });

  describe('Section selector', () => {
    const wrap = (selector: unknown, action: 'focus' | 'remove' = 'focus') => ({
      version: 1,
      targets: [
        {
          input: ['src/*.puml'],
          outputDir: 'dist',
          lenses: [{ name: 'L', layers: [{ action, selector }] }],
        },
      ],
    });

    it('accepts focus + section selector by name', () => {
      expect(() =>
        validateConfig(wrap({ kind: 'section', name: 'Onboarding' })),
      ).not.toThrow();
    });

    it('accepts focus + section selector by names list', () => {
      expect(() =>
        validateConfig(
          wrap({ kind: 'section', names: ['A', { pattern: 'B' }] }),
        ),
      ).not.toThrow();
    });

    it('accepts focus + section selector by between range (inclusive default)', () => {
      expect(() =>
        validateConfig(
          wrap({
            kind: 'section',
            between: { from: 'A', to: 'D' },
          }),
        ),
      ).not.toThrow();
    });

    it('accepts focus + section selector by between range (inclusive=false)', () => {
      expect(() =>
        validateConfig(
          wrap({
            kind: 'section',
            between: { from: 'A', to: 'D', inclusive: false },
          }),
        ),
      ).not.toThrow();
    });

    it('accepts remove + section selector', () => {
      expect(() =>
        validateConfig(wrap({ kind: 'section', name: 'Webhook' }, 'remove')),
      ).not.toThrow();
    });

    it('rejects mutually exclusive options (name + between)', () => {
      expect(() =>
        validateConfig(
          wrap({
            kind: 'section',
            name: 'X',
            between: { from: 'A', to: 'B' },
          }),
        ),
      ).toThrow();
    });

    it('rejects mutually exclusive options (names + between)', () => {
      expect(() =>
        validateConfig(
          wrap({
            kind: 'section',
            names: ['A'],
            between: { from: 'A', to: 'B' },
          }),
        ),
      ).toThrow();
    });

    it('rejects an empty selector ({ kind: section } with no mode)', () => {
      // Without exactly one mode, intent is ambiguous (matches all sections?
      // none?). Force the user to be explicit.
      expect(() => validateConfig(wrap({ kind: 'section' }))).toThrow();
    });
  });

  it('should validate participant selector with complex matcher', () => {
    const input = {
      version: 1,
      targets: [
        {
          input: ['src/*.mmd'],
          outputDir: 'dist',
          lenses: [
            {
              name: 'Test',
              layers: [
                {
                  action: 'focus',
                  selector: {
                    kind: 'participant',
                    name: { pattern: 'User.*', flags: 'i' },
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    expect(() => validateConfig(input)).not.toThrow();
  });
});
