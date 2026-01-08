import { FocusFilter } from '../filters/focus';
import { MergeFilter } from '../filters/merge';
import { RemoveFilter } from '../filters/remove';
import { ResolveFilter } from '../filters/resolve';
import type {
    FocusLayer,
    Layer,
    MergeLayer,
    RemoveLayer,
    ResolveLayer,
    Transformer,
} from '../types';

/**
 * Type-safe factory function type for creating transformers.
 */
type TransformerFactory<T extends Layer = Layer> = (layer: T) => Transformer;

/**
 * Registry for transformer factories.
 * Provides type-safe registration and retrieval of transformers.
 */
class TransformerRegistry {
  private factories = new Map<string, TransformerFactory>();

  constructor() {
    // Register built-in transformers with type-safe wrappers
    this.registerTyped<ResolveLayer>('resolve', (layer) => new ResolveFilter(layer));
    this.registerTyped<FocusLayer>('focus', (layer) => new FocusFilter(layer));
    this.registerTyped<RemoveLayer>('remove', (layer) => new RemoveFilter(layer));
    this.registerTyped<MergeLayer>('merge', (layer) => new MergeFilter(layer));
  }

  /**
   * Type-safe registration for a specific layer type.
   */
  private registerTyped<T extends Layer>(
    action: T['action'],
    factory: TransformerFactory<T>,
  ): void {
    // Cast is safe here because we're using the action discriminant
    this.factories.set(action, factory as TransformerFactory);
  }

  /**
   * Register a custom transformer factory.
   */
  public register(action: string, factory: TransformerFactory): void {
    this.factories.set(action, factory);
  }

  /**
   * Get a transformer for the given layer.
   * @returns Transformer instance or null if no factory is registered
   */
  public get(layer: Layer): Transformer | null {
    const factory = this.factories.get(layer.action);
    if (!factory) return null;
    return factory(layer);
  }

  /**
   * Check if a transformer is registered for the given action.
   */
  public has(action: string): boolean {
    return this.factories.has(action);
  }
}

export const transformerRegistry = new TransformerRegistry();
