export type TextMatcher = string | RegExp | { pattern: string; flags?: string };

// -- Selectors --

export type Selector = 
  | ParticipantSelector
  | MessageSelector
  | BranchSelector
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

export interface BranchSelector {
  kind: 'branch';
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
  action: 'focusFragment' | 'hideParticipant' | 'focusParticipant';
  selector: Selector;
}


import { PolagramRoot } from '../ast';

// -- Engine --

export interface Transformer {
    transform(root: PolagramRoot): PolagramRoot;
}
