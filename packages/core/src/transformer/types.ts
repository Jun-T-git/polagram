import { FragmentOperator, PolagramRoot } from '../ast';

// -- Selectors --

export type TextMatcher = string | RegExp | { pattern: string; flags?: string };

export interface FragmentSelector {
    kind?: 'fragment';
    condition?: TextMatcher;
    operator?: FragmentOperator | FragmentOperator[];
}

export interface ParticipantSelector {
    kind?: 'participant';
    name?: TextMatcher;
    id?: TextMatcher;
    stereotype?: TextMatcher;
}

export interface MessageSelector {
    kind?: 'message';
    text?: TextMatcher;
    from?: TextMatcher;
    to?: TextMatcher;
}

export interface GroupSelector {
    kind?: 'group';
    name?: TextMatcher;
}

// -- Layers --

export type Layer = 
    | ResolveLayer 
    | FocusLayer 
    | RemoveLayer;

export interface ResolveLayer {
    action: 'resolve';
    selector: FragmentSelector;
}

export interface FocusLayer {
    action: 'focus';
    selector: ParticipantSelector;
}

export interface RemoveLayer {
    action: 'remove';
    selector: ParticipantSelector | MessageSelector | GroupSelector;
}

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
