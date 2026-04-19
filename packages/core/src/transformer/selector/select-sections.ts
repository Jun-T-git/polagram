import type { SectionNode } from '../../ast';
import type { SectionSelector } from '../types';
import { Matcher } from './matcher';

/**
 * Resolves a SectionSelector against an ordered list of top-level sections,
 * returning the matching subset (preserving original source order).
 *
 * Shared by FocusSectionFilter and RemoveSectionFilter so both interpret the
 * selector identically.
 *
 * `between { from, to }` semantics:
 *   - Order of from/to does not matter (Math.min/max).
 *   - When the same name occurs multiple times, the FIRST occurrence is used.
 *   - When from === to, the range is just that section (inclusive=true) or
 *     empty (inclusive=false).
 *   - When either endpoint cannot be located, returns [].
 */
export function selectSections(
  sections: SectionNode[],
  selector: SectionSelector,
  matcher: Matcher = new Matcher(),
): SectionNode[] {
  if ('between' in selector && selector.between) {
    const { from, to, inclusive = true } = selector.between;

    const fromIdx = sections.findIndex(
      (s) => s.name !== undefined && matcher.matchText(s.name, from),
    );
    const toIdx = sections.findIndex(
      (s) => s.name !== undefined && matcher.matchText(s.name, to),
    );
    if (fromIdx === -1 || toIdx === -1) return [];

    const lo = Math.min(fromIdx, toIdx);
    const hi = Math.max(fromIdx, toIdx);
    return inclusive ? sections.slice(lo, hi + 1) : sections.slice(lo + 1, hi);
  }
  return sections.filter((s) => matcher.matchSection(s, selector));
}
