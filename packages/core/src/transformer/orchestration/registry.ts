
import { FocusFragmentFilter } from '../filters/focus-fragment';
import { FocusParticipantFilter } from '../filters/focus-participant';
import { HideParticipantFilter } from '../filters/hide-participant';
import { TransformRule, Transformer } from '../types';

type TransformerFactory = (rule: TransformRule) => Transformer;

class TransformerRegistry {
    private factories = new Map<string, TransformerFactory>();

    constructor() {
        // Register defaults
        this.register('focusFragment', (rule) => new FocusFragmentFilter(rule));
        this.register('hideParticipant', (rule) => new HideParticipantFilter(rule));
        this.register('focusParticipant', (rule) => new FocusParticipantFilter(rule));
    }

    public register(action: string, factory: TransformerFactory) {
        this.factories.set(action, factory);
    }

    public get(rule: TransformRule): Transformer | null {
        // Map public action + selector to internal implementation key
        let key = '';
        
        if (rule.action === 'focus') {
            if (rule.selector.kind === 'participant') key = 'focusParticipant';
            else if (rule.selector.kind === 'fragment') key = 'focusFragment';
        } else if (rule.action === 'hide') {
            if (rule.selector.kind === 'participant') key = 'hideParticipant';
        }

        const factory = this.factories.get(key);
        if (!factory) return null;
        return factory(rule);
    }
}

export const transformerRegistry = new TransformerRegistry();
