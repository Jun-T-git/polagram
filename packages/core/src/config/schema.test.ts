import { describe, expect, it } from 'vitest';
import { validateConfig } from './schema';

describe('Config Schema Validation', () => {
    it('should validate a correct configuration', () => {
        const input = {
            version: 1,
            targets: [
                {
                    input: ['src/*.mmd'],
                    outputDir: 'dist',
                    lenses: [
                        {
                            name: 'Success',
                            layers: [
                                {
                                    action: 'resolve',
                                    selector: { kind: 'fragment', condition: 'Success' }
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const config = validateConfig(input);
        expect(config.version).toBe(1);
        expect(config.targets[0].lenses[0].name).toBe('Success');
    });

    it('should throw error for missing required fields', () => {
        const input = {
            // missing version
            targets: []
        };

        expect(() => validateConfig(input)).toThrow('Invalid Polagram Configuration');
        // Zod message might vary, just checking it fails is often enough, 
        // but let's check for the path at least.
        expect(() => validateConfig(input)).toThrow('[version]:');
    });

    it('should validate fragment selector correctly', () => {
        const input = {
            version: 1,
            targets: [{
                input: ['src/*.mmd'],
                outputDir: 'dist',
                lenses: [{
                    name: 'Test',
                    layers: [{
                        action: 'focus',
                        selector: { kind: 'fragment', condition: 'Success' }
                    }]
                }]
            }]
        };
        expect(() => validateConfig(input)).not.toThrow();
    });

    it('should fail if selector kind is missing', () => {
        const input = {
            version: 1,
            targets: [{
                input: ['src/*.mmd'],
                outputDir: 'dist',
                lenses: [{
                    name: 'Test',
                    layers: [{
                        action: 'focus',
                        selector: { condition: 'Success' } // Missing kind: 'fragment'
                    }]
                }]
            }]
        };
        // Expect failure because checking against union requires discrimination
        expect(() => validateConfig(input)).toThrow();
    });

    it('should validate participant selector with complex matcher', () => {
         const input = {
            version: 1,
            targets: [{
                input: ['src/*.mmd'],
                outputDir: 'dist',
                lenses: [{
                    name: 'Test',
                    layers: [{
                        action: 'focus',
                        selector: { 
                            kind: 'participant', 
                            name: { pattern: 'User.*', flags: 'i' }
                        }
                    }]
                }]
            }]
        };
        expect(() => validateConfig(input)).not.toThrow();
    });
});
