import type { PolagramRoot, SectionNode } from '../../ast';
import { selectSections } from '../selector/select-sections';
import type { RemoveLayer, SectionSelector } from '../types';

/**
 * Removes top-level SectionNodes that match the selector.
 *
 * Behavior:
 *  - Matched sections are dropped from `root.events`.
 *  - Preamble and unmatched sections are preserved untouched.
 *  - Orphan participants are pruned by the post-pipeline UnusedCleaner
 *    (symmetric with `remove:message`).
 */
export class RemoveSectionFilter {
  private selector: SectionSelector;

  constructor(layer: RemoveLayer) {
    if (layer.selector.kind !== 'section') {
      throw new Error(
        `RemoveSectionFilter expects a section selector, got '${layer.selector.kind}'.`,
      );
    }
    this.selector = layer.selector;
  }

  public transform(root: PolagramRoot): PolagramRoot {
    const sections = root.events.filter(
      (e): e is SectionNode => e.kind === 'section',
    );
    const removedIds = new Set(
      selectSections(sections, this.selector).map((s) => s.id),
    );
    return {
      ...root,
      events: root.events.filter(
        (e) => !(e.kind === 'section' && removedIds.has(e.id)),
      ),
    };
  }
}
