
import { describe, expect, it } from 'vitest';
import { PolagraphRoot } from '../ast';
import { ParserFactory } from './index';
import { DiagramParser } from './interface';

describe('ParserFactory', () => {
    it('should retrieve registered parser', () => {
        const parser = ParserFactory.getParser('mermaid');
        expect(parser).toBeDefined();
        // Since we import implemented parser, we expect checking it conforms to interface
        expect(typeof parser.parse).toBe('function');
    });

    it('should throw error for unknown language', () => {
        expect(() => {
            ParserFactory.getParser('unknown-lang');
        }).toThrow("Parser for language 'unknown-lang' not found.");
    });

    it('should allow registering new parser', () => {
        const mockParser: DiagramParser = {
            parse: (_code: string): PolagraphRoot => ({ kind: 'root', meta: { version: '1.0.0', source: 'unknown' }, participants: [], groups: [], events: [] })
        };

        ParserFactory.register('test-lang', mockParser);
        const retrieved = ParserFactory.getParser('test-lang');
        expect(retrieved).toBe(mockParser);
    });
});
