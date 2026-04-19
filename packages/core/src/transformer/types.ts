import type { FragmentOperator, PolagramRoot } from '../ast';

// -- Selectors --

export type TextMatcher = string | RegExp | { pattern: string; flags?: string };

export interface FragmentSelector {
  kind: 'fragment';
  condition?: TextMatcher;
  operator?: FragmentOperator | FragmentOperator[];
}

export interface ParticipantSelector {
  kind: 'participant';
  name?: TextMatcher;
  id?: TextMatcher;
  stereotype?: TextMatcher;
}

export interface MessageSelector {
  kind: 'message';
  text?: TextMatcher;
  from?: TextMatcher;
  to?: TextMatcher;
  // For now, these are direct references or regexes
}

export interface GroupSelector {
  kind: 'group';
  name?: TextMatcher;
}

export interface SectionBetween {
  from: TextMatcher;
  to: TextMatcher;
  /** Defaults to true. When false, the from/to boundary sections are dropped from the range. */
  inclusive?: boolean;
}

/**
 * Selects top-level SectionNodes (folded from PlantUML "== Title ==" dividers).
 *
 * Specify EXACTLY ONE of:
 *   - `name`: a single section by exact text or pattern
 *   - `names`: any-of list (non-contiguous selection)
 *   - `between { from, to, inclusive? }`: contiguous range. Order of from/to
 *     does not matter — selection is in source order. If from === to, the
 *     range is just that section (or empty when inclusive=false). When
 *     multiple sections share a name, the FIRST occurrence is used.
 *
 * Discriminated by which mode is set — TypeScript prevents mixing modes at
 * compile time. The Zod schema enforces the same invariant at runtime for
 * YAML config inputs.
 *
 * PlantUML-only: Mermaid has no native section construct, so this selector
 * matches nothing on Mermaid input.
 */
export type SectionSelector =
  | { kind: 'section'; name: TextMatcher; names?: never; between?: never }
  | { kind: 'section'; names: TextMatcher[]; name?: never; between?: never }
  | {
      kind: 'section';
      between: SectionBetween;
      name?: never;
      names?: never;
    };

// -- Layers --

export interface ResolveLayer {
  action: 'resolve';
  selector: FragmentSelector;
}

export interface FocusLayer {
  action: 'focus';
  selector: ParticipantSelector | SectionSelector;
}

export interface RemoveLayer {
  action: 'remove';
  selector:
    | ParticipantSelector
    | MessageSelector
    | GroupSelector
    | SectionSelector;
}

export interface MergeLayer {
  action: 'merge';
  into?: {
    name?: string;
    id?: string;
    stereotype?: string;
  };
  selector: ParticipantSelector;
}

export type Layer = ResolveLayer | FocusLayer | RemoveLayer | MergeLayer;

// -- Lens --

export interface Lens {
  name?: string;
  description?: string;
  layers: Layer[];
}

// -- Engine --

export interface Transformer {
  transform(root: PolagramRoot): PolagramRoot;
}
