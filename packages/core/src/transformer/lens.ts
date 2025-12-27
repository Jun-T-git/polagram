
import { PolagramRoot } from '../ast';
import { TransformationEngine } from './orchestration/engine';
import { TransformLens, TransformRule } from './types';

/**
 * Type Guard to validate if an object is a valid TransformLens.
 * Acts as an Anti-Corruption Layer.
 */
export function validateLens(lens: unknown): lens is TransformLens {
    if (typeof lens !== 'object' || lens === null) {
        return false;
    }

    const l = lens as Record<string, unknown>;

    // Check name (optional string)
    if (Reflect.has(l, 'name') && typeof l.name !== 'string') {
        return false;
    }

    // Check rules (required array)
    if (!Array.isArray(l.rules)) {
        return false;
    }

    // Validate each rule
    for (const rule of l.rules) {
        if (!validateRule(rule)) {
            return false;
        }
    }

    return true;
}

function validateRule(rule: unknown): rule is TransformRule {
    if (typeof rule !== 'object' || rule === null) {
        return false;
    }
    
    const r = rule as Record<string, unknown>;

    // Check action
    if (typeof r.action !== 'string') {
        return false;
    }
    const validActions = ['focus', 'hide'];
    if (!validActions.includes(r.action)) {
        return false;
    }

    // Check selector
    if (typeof r.selector !== 'object' || r.selector === null) {
        return false;
    }

    // Simple check for selector structure (could be deeper)
    const s = r.selector as Record<string, unknown>;
    if (typeof s.kind !== 'string') {
        return false;
    }

    return true;
}

/**
 * Apply a lens object to the AST.
 * Facade for the TransformationEngine.
 */
export function applyLens(root: PolagramRoot, lens: TransformLens): PolagramRoot {
    const engine = new TransformationEngine();
    return engine.transform(root, lens.rules);
}
