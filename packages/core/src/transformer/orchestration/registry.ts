
import { FocusFilter } from '../filters/focus';
import { RemoveFilter } from '../filters/remove';
import { UnwrapFilter } from '../filters/unwrap';
import { TransformRule, Transformer } from '../types';

type TransformerFactory = (rule: TransformRule) => Transformer;

class TransformerRegistry {
    private factories = new Map<string, TransformerFactory>();

    constructor() {
        // Register defaults
        this.register('unwrap', (rule) => new UnwrapFilter(rule));
        this.register('remove', (rule) => new RemoveFilter(rule));
        this.register('focus', (rule) => new FocusFilter(rule));
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
