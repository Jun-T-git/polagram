import { describe, expect, it } from 'vitest';
import { Polagram } from '../../src/api';
import type { SectionNode } from '../../src/ast';
import { PlantUMLGeneratorVisitor } from '../../src/generator/generators/plantuml';
import { ParserFactory } from '../../src/parser';
import { TransformationEngine } from '../../src/transformer/orchestration/engine';
import type { Layer } from '../../src/transformer/types';

const PUML_FOUR_PHASES = `@startuml
actor User
participant App
participant Auth
participant Diagnosis
participant Webhook

User -> App : open
== オンボーディング ==
App -> Auth : sign up
Auth -> App : token
== 診断判定 ==
App -> Diagnosis : start
Diagnosis -> App : result
== 日常利用 ==
User -> App : daily action
== Webhook ==
App -> Webhook : notify
Webhook --> App : ack
@enduml`;

function pipeline(input: string, layers: Layer[]): string {
  const parser = ParserFactory.getParser('plantuml');
  const ast = parser.parse(input);
  const engine = new TransformationEngine();
  const transformed = engine.transform(ast, layers);
  const gen = new PlantUMLGeneratorVisitor();
  return gen.generate(transformed);
}

function normalize(s: string): string {
  return s
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("'"))
    .join('\n');
}

function sectionNamesIn(s: string): string[] {
  return s
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^==.*==$/.test(l))
    .map((l) => l.replace(/^==\s*/, '').replace(/\s*==$/, ''));
}

describe('Section feature — end-to-end pipeline (PlantUML only)', () => {
  describe('UC1: focus on a single section by name', () => {
    it('keeps only the matched section in the output', () => {
      const out = pipeline(PUML_FOUR_PHASES, [
        {
          action: 'focus',
          selector: { kind: 'section', name: 'オンボーディング' },
        },
      ]);

      expect(sectionNamesIn(out)).toEqual(['オンボーディング']);
      expect(normalize(out)).toContain('Auth -> App: token');
      expect(normalize(out)).not.toContain('Diagnosis');
      expect(normalize(out)).not.toContain('Webhook');
      expect(normalize(out)).not.toContain('daily action');
      // Preamble (before first divider) is dropped by focus.
      expect(normalize(out)).not.toContain('User -> App: open');
    });

    it('prunes participants that are not used in the focused section (via UnusedCleaner)', () => {
      const out = pipeline(PUML_FOUR_PHASES, [
        {
          action: 'focus',
          selector: { kind: 'section', name: 'オンボーディング' },
        },
      ]);

      // App and Auth are referenced in the kept section. Others should be gone.
      const lines = normalize(out);
      expect(lines).toContain('participant App');
      expect(lines).toContain('participant Auth');
      expect(lines).not.toContain('participant Diagnosis');
      expect(lines).not.toContain('participant Webhook');
      expect(lines).not.toContain('actor User');
    });
  });

  describe('UC2: focus on a contiguous range via between', () => {
    it('keeps the inclusive range from..to', () => {
      const out = pipeline(PUML_FOUR_PHASES, [
        {
          action: 'focus',
          selector: {
            kind: 'section',
            between: { from: 'オンボーディング', to: '日常利用' },
          },
        },
      ]);
      expect(sectionNamesIn(out)).toEqual([
        'オンボーディング',
        '診断判定',
        '日常利用',
      ]);
    });

    it('respects inclusive=false (drops the boundary sections)', () => {
      const out = pipeline(PUML_FOUR_PHASES, [
        {
          action: 'focus',
          selector: {
            kind: 'section',
            between: {
              from: 'オンボーディング',
              to: '日常利用',
              inclusive: false,
            },
          },
        },
      ]);
      expect(sectionNamesIn(out)).toEqual(['診断判定']);
    });
  });

  describe('UC3: remove a section', () => {
    it('drops the matched section, keeps preamble and other sections', () => {
      const out = pipeline(PUML_FOUR_PHASES, [
        {
          action: 'remove',
          selector: { kind: 'section', name: 'Webhook' },
        },
      ]);

      expect(sectionNamesIn(out)).toEqual([
        'オンボーディング',
        '診断判定',
        '日常利用',
      ]);
      // Preamble survives.
      expect(normalize(out)).toContain('User -> App: open');
      // Webhook participant is now orphan and pruned by UnusedCleaner.
      expect(normalize(out)).not.toContain('participant Webhook');
    });
  });

  describe('UC4: focus:section + merge:participant composition', () => {
    // Diagram with multiple distinct participants inside one section so that
    // a merge produces visible cross-boundary edges (not just self-loops).
    const PUML_UC4 = `@startuml
actor User
participant App
participant Auth
participant DB

User -> App : open
== オンボーディング ==
User -> App : start signup
App -> Auth : verify
Auth -> DB : check
DB -> Auth : ok
Auth -> App : token
App -> User : welcome
== Cleanup ==
User -> App : exit
@enduml`;

    it('focuses on the section, then merges internal participants — composition is order-independent for these two', () => {
      const merged = pipeline(PUML_UC4, [
        {
          action: 'focus',
          selector: { kind: 'section', name: 'オンボーディング' },
        },
        {
          action: 'merge',
          into: { name: 'Internal', id: 'Internal' },
          selector: {
            kind: 'participant',
            name: { pattern: '^(App|Auth|DB)$' },
          },
        },
      ]);

      expect(sectionNamesIn(merged)).toEqual(['オンボーディング']);

      const norm = normalize(merged);
      // Cross-boundary edges (User <-> Internal) survive after merge.
      expect(norm).toContain('User -> Internal: start signup');
      expect(norm).toContain('Internal -> User: welcome');
      // App, Auth, DB collapsed into Internal — the App/Auth/DB inter-traffic
      // becomes Internal->Internal self-loops which merge collapses by design.
      expect(norm).not.toContain('App -> Auth');
      expect(norm).not.toContain('Auth -> DB');
      // Cleanup section was dropped by focus; Cleanup-only events absent.
      expect(norm).not.toContain('exit');
      // Participants list reflects merge + cleanup.
      expect(norm).toContain('participant Internal');
      expect(norm).not.toContain('participant App');
      expect(norm).not.toContain('participant Auth');
      expect(norm).not.toContain('participant DB');
    });

    it('produces the same final AST regardless of layer order (focus first vs merge first)', () => {
      const focusFirst = pipeline(PUML_UC4, [
        {
          action: 'focus',
          selector: { kind: 'section', name: 'オンボーディング' },
        },
        {
          action: 'merge',
          into: { name: 'Internal', id: 'Internal' },
          selector: {
            kind: 'participant',
            name: { pattern: '^(App|Auth|DB)$' },
          },
        },
      ]);
      const mergeFirst = pipeline(PUML_UC4, [
        {
          action: 'merge',
          into: { name: 'Internal', id: 'Internal' },
          selector: {
            kind: 'participant',
            name: { pattern: '^(App|Auth|DB)$' },
          },
        },
        {
          action: 'focus',
          selector: { kind: 'section', name: 'オンボーディング' },
        },
      ]);
      expect(normalize(focusFirst)).toBe(normalize(mergeFirst));
    });
  });

  describe('AST shape sanity', () => {
    it('produces SectionNode objects with section names matching source dividers', () => {
      const parser = ParserFactory.getParser('plantuml');
      const ast = parser.parse(PUML_FOUR_PHASES);
      const sectionNames = ast.events
        .filter((e): e is SectionNode => e.kind === 'section')
        .map((s) => s.name);
      expect(sectionNames).toEqual([
        'オンボーディング',
        '診断判定',
        '日常利用',
        'Webhook',
      ]);
    });
  });

  describe('Mermaid + section selector (lossy on output, no crash)', () => {
    it('Mermaid input with no sections + section selector produces empty events (focus) or unchanged (remove)', () => {
      const mmd = `sequenceDiagram\n  participant A\n  participant B\n  A->>B: hi`;
      const parser = ParserFactory.getParser('mermaid');
      const ast = parser.parse(mmd);
      const engine = new TransformationEngine();

      const focused = engine.transform(ast, [
        {
          action: 'focus',
          selector: { kind: 'section', name: 'X' },
        },
      ]);
      expect(focused.events).toHaveLength(0);

      const removed = engine.transform(ast, [
        {
          action: 'remove',
          selector: { kind: 'section', name: 'X' },
        },
      ]);
      // No sections present → nothing to remove → original events kept (1 message).
      expect(removed.events).toHaveLength(1);
    });
  });

  describe('Fluent API: focusSection / removeSection', () => {
    it('focusSection accepts a bare string and produces equivalent output to the layer form', () => {
      // Use the fluent API
      const fluent = Polagram.init(PUML_FOUR_PHASES, 'plantuml')
        .focusSection('オンボーディング')
        .toPlantUML();

      // Compare with the explicit layer form
      const direct = pipeline(PUML_FOUR_PHASES, [
        {
          action: 'focus',
          selector: { kind: 'section', name: 'オンボーディング' },
        },
      ]);

      expect(normalize(fluent)).toBe(normalize(direct));
    });

    it('removeSection accepts a SectionSelector with names list', () => {
      const fluent = Polagram.init(PUML_FOUR_PHASES, 'plantuml')
        .removeSection({
          kind: 'section',
          names: ['Webhook', '日常利用'],
        })
        .toPlantUML();

      const direct = pipeline(PUML_FOUR_PHASES, [
        {
          action: 'remove',
          selector: { kind: 'section', names: ['Webhook', '日常利用'] },
        },
      ]);

      expect(normalize(fluent)).toBe(normalize(direct));
    });

    it('focusSection accepts a between range', () => {
      const fluent = Polagram.init(PUML_FOUR_PHASES, 'plantuml')
        .focusSection({
          kind: 'section',
          between: { from: 'オンボーディング', to: '日常利用' },
        })
        .toPlantUML();

      expect(sectionNamesIn(fluent)).toEqual([
        'オンボーディング',
        '診断判定',
        '日常利用',
      ]);
    });
  });
});
