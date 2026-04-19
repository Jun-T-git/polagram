import type { EventNode, PolagramRoot, SectionNode } from '../../ast';
import { selectSections } from '../selector/select-sections';
import type { FocusLayer, SectionSelector } from '../types';

/**
 * Keeps only top-level SectionNodes that match the selector.
 *
 * Behavior:
 *  - Preamble (events before the first section) is dropped — `focus` means
 *    "narrow to this and only this".
 *  - Other (non-matching) sections are dropped.
 *  - Participant cleanup is delegated to the post-pipeline UnusedCleaner so
 *    composition with other filters (e.g. `merge`) remains order-independent.
 */
export class FocusSectionFilter {
  private selector: SectionSelector;

  constructor(layer: FocusLayer) {
    if (layer.selector.kind !== 'section') {
      throw new Error(
        `FocusSectionFilter expects a section selector, got '${layer.selector.kind}'.`,
      );
    }
    this.selector = layer.selector;
  }

  public transform(root: PolagramRoot): PolagramRoot {
    const sections = root.events.filter(
      (e): e is SectionNode => e.kind === 'section',
    );
    const kept: EventNode[] = selectSections(sections, this.selector);
    return { ...root, events: kept };
  }
}
