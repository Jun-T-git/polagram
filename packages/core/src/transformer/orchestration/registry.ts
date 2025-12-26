
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
        const factory = this.factories.get(rule.action);
        if (!factory) return null;
        return factory(rule);
    }
}

export const transformerRegistry = new TransformerRegistry();
