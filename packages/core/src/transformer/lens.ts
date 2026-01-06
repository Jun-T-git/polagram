import type { PolagramRoot } from '../ast';
import { TransformationEngine } from './orchestration/engine';
import type { Layer, Lens } from './types';

/**
 * Type Guard to validate if an object is a valid Lens.
 * Acts as an Anti-Corruption Layer.
 */
export function validateLens(lens: unknown): lens is Lens {
  if (typeof lens !== 'object' || lens === null) {
    return false;
  }

  const l = lens as Record<string, unknown>;

  // Check name (optional string)
  if (Reflect.has(l, 'name') && typeof l.name !== 'string') {
    return false;
  }

  // Check layers (required array)
  if (!Array.isArray(l.layers)) {
    return false;
  }

  // Validate each layer
  for (const layer of l.layers) {
    if (!validateLayer(layer)) {
      return false;
    }
  }

  return true;
}

function validateLayer(layer: unknown): layer is Layer {
  if (typeof layer !== 'object' || layer === null) {
    return false;
  }

  const l = layer as Record<string, unknown>;

  // Check action
  if (typeof l.action !== 'string') {
    return false;
  }
  const validActions = ['focus', 'remove', 'resolve'];
  if (!validActions.includes(l.action)) {
    return false;
  }

  // Check selector
  if (typeof l.selector !== 'object' || l.selector === null) {
    return false;
  }

  // Simple check for selector structure
  const s = l.selector as Record<string, unknown>;
  if (typeof s.kind !== 'string') {
    return false;
  }

  return true;
}

/**
 * Apply a lens object to the AST.
 * Facade for the TransformationEngine.
 */
export function applyLens(root: PolagramRoot, lens: Lens): PolagramRoot {
  const engine = new TransformationEngine();
  return engine.transform(root, lens.layers);
}
