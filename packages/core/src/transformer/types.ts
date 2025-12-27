export type TextMatcher = string | RegExp | { pattern: string; flags?: string };

// -- Selectors --

export type Selector = 
  | ParticipantSelector
  | MessageSelector
  | FragmentSelector
  | GroupSelector;

export interface ParticipantSelector {
  kind: 'participant';
  text?: TextMatcher;
  id?: string;
  class?: TextMatcher;
}

export interface MessageSelector {
  kind: 'message';
  text?: TextMatcher;
  from?: string;
  to?: string; 
  class?: TextMatcher;
}

export interface FragmentSelector {
  kind: 'fragment';
  text?: TextMatcher;
  id?: string;
  class?: TextMatcher;
}

export interface GroupSelector {
  kind: 'group';
  text: TextMatcher;
}

// -- Rules --

export interface TransformRule {
  action: 'focus' | 'hide';
  selector: Selector;
}


import { PolagramRoot } from '../ast';

// -- Engine --

export interface Transformer {
    transform(root: PolagramRoot): PolagramRoot;
}

// -- Lens API --

export interface TransformLens {
    name?: string;
    rules: TransformRule[];
}
