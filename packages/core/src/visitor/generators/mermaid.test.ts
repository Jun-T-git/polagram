
import { describe, expect, it } from 'vitest';
import { AyatoriRoot, MessageNode } from '../../ast';
import { MermaidGeneratorVisitor } from './mermaid';

describe('MermaidGeneratorVisitor', () => {
    it('should generate sequence diagram header', () => {
        const root: AyatoriRoot = { kind: 'root', meta: { version: '1.0.0', source: 'mermaid' }, participants: [], groups: [], events: [] };
        const visitor = new MermaidGeneratorVisitor();
        const output = visitor.generate(root);
        
        expect(output).toContain('sequenceDiagram');
    });

    it('should generate title if present', () => {
        const root: AyatoriRoot = { kind: 'root', meta: { version: '1.0.0', source: 'mermaid', title: 'My Diagram' }, participants: [], groups: [], events: [] };
        const visitor = new MermaidGeneratorVisitor();
        const output = visitor.generate(root);
        
        expect(output).toContain('title My Diagram');
    });

    it('should generate participants', () => {
        const root: AyatoriRoot = { 
            kind: 'root', 
            meta: { version: '1.0.0', source: 'mermaid' }, 
            participants: [
                { id: 'A', name: 'Alice', type: 'participant' },
                { id: 'B', name: 'Bob', type: 'actor' }
            ], 
            groups: [], 
            events: [] 
        };
        const visitor = new MermaidGeneratorVisitor();
        const output = visitor.generate(root);
        
        expect(output).toContain('participant A as Alice');
        expect(output).toContain('actor B as Bob');
    });

    it('should generate messages', () => {
         const msg: MessageNode = { 
            kind: 'message', 
            id: '1', 
            from: 'A', 
            to: 'B', 
            text: 'hello', 
            type: 'sync', 
            style: { line: 'solid', head: 'arrow' } 
        };
        const root: AyatoriRoot = { 
            kind: 'root', 
            meta: { version: '1.0.0', source: 'mermaid' }, 
            participants: [], 
            groups: [], 
            events: [msg] 
        };
        const visitor = new MermaidGeneratorVisitor();
        const output = visitor.generate(root);
        
        expect(output).toContain('A->>B: hello');
    });
});
