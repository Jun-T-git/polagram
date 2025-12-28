
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { PolagramRoot } from '../ast';
import { applyLens, validateLens } from './lens';

describe('Lens API', () => {
    describe('validateLens', () => {
        it('should return true for valid lens object', () => {
            const valid = {
                name: 'Test Lens',
                layers: [
                    { action: 'focus', selector: { kind: 'participant', name: 'Bob' } }
                ]
            };
            expect(validateLens(valid)).toBe(true);
        });

        it('should return false for invalid structure', () => {
            expect(validateLens(null)).toBe(false);
            expect(validateLens({ name: 123 })).toBe(false); // Invalid name
            expect(validateLens({ layers: 'not-array' })).toBe(false);
        });

        it('should return false for invalid rule action', () => {
            const invalid = {
                layers: [{ action: 'destroyWorld', selector: { kind: 'participant' } }]
            };
            expect(validateLens(invalid)).toBe(false);
        });
    });

    describe('Integration with js-yaml (Usage Layer)', () => {
        it('should parse YAML and apply lens correctly', () => {
            const yamlStr = `
name: My Transformation
layers:
  - action: focus
    selector:
      kind: participant
      name: Bob
`;
            // 1. Adapter Layer: Parse YAML
            const parsed = yaml.load(yamlStr);

            // 2. Anti-Corruption Layer: Validate
            if (!validateLens(parsed)) {
                throw new Error('Validation failed');
            }

            // 3. Facade: Apply
            // Mocking a simple AST
            const mockRoot: PolagramRoot = {
                kind: 'root',
                meta: { version: '1.0', source: 'mermaid', title: 'test' },
                participants: [
                    { id: 'Bob', name: 'Bob', type: 'participant' }
                ],
                groups: [],
                events: [],
            };

            const result = applyLens(mockRoot, parsed);
            
            // Just verifying it runs without error and returns an AST (Transformation logic is tested elsewhere)
            expect(result).toBeDefined();
            expect(result.kind).toBe('root');
        });
    });
});
