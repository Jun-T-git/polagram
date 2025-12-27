
import { FocusFilter } from '../filters/focus';
import { RemoveFilter } from '../filters/remove';
import { ResolveFilter } from '../filters/resolve';
import { Layer, Transformer } from '../types';

type TransformerFactory = (layer: Layer) => Transformer;

class TransformerRegistry {
    private factories = new Map<string, TransformerFactory>();

    constructor() {
        // Register defaults
        this.register('resolve', (layer) => new ResolveFilter(layer as any));
        this.register('focus', (layer) => new FocusFilter(layer as any));
        this.register('remove', (layer) => new RemoveFilter(layer as any));
    }

    public register(action: string, factory: TransformerFactory) {
        this.factories.set(action, factory);
    }

    public get(layer: Layer): Transformer | null {
        const factory = this.factories.get(layer.action);
        if (!factory) return null;
        return factory(layer);
    }
}

export const transformerRegistry = new TransformerRegistry();
