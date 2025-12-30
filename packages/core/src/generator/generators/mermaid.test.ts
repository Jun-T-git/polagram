
import { describe, expect, it } from 'vitest';
import { MessageNode, PolagraphRoot } from '../../ast';
import { MermaidGeneratorVisitor } from './mermaid';

describe('MermaidGeneratorVisitor', () => {
    it('should generate sequence diagram header', () => {
        const root: PolagraphRoot = { kind: 'root', meta: { version: '1.0.0', source: 'mermaid' }, participants: [], groups: [], events: [] };
        const visitor = new MermaidGeneratorVisitor();
        const output = visitor.generate(root);
        
        expect(output).toContain('sequenceDiagram');
    });

    it('should generate title if present', () => {
        const root: PolagraphRoot = { kind: 'root', meta: { version: '1.0.0', source: 'mermaid', title: 'My Diagram' }, participants: [], groups: [], events: [] };
        const visitor = new MermaidGeneratorVisitor();
        const output = visitor.generate(root);
        
        expect(output).toContain('title My Diagram');
    });

    it('should generate participants', () => {
        const root: PolagraphRoot = { 
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

    it('should generate participant with multi-word name without extra quotes', () => {
        const root: PolagraphRoot = { 
            kind: 'root', 
            meta: { version: '1.0.0', source: 'mermaid' }, 
            participants: [
                { id: 'API', name: 'API Server', type: 'participant' }
            ], 
            groups: [], 
            events: [] 
        };
        const visitor = new MermaidGeneratorVisitor();
        const output = visitor.generate(root);
        
        // We expect it NOT to be quoted if the user wants clean text
        // But currently it IS quoted. checking what it does now vs what we want.
        // If we want to fix it, we should expect "API Server" plain.
        expect(output).toContain('participant API as API Server');
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
        const root: PolagraphRoot = { 
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
