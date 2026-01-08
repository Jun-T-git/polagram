import { describe, expect, it } from 'vitest';
import type { PolagramRoot } from '../../ast';
import { MergeFilter } from './merge';

describe('MergeFilter', () => {
    const createBaseAst = (): PolagramRoot => ({
        kind: 'root',
        meta: { version: '1.0', source: 'unknown' },
        participants: [
            { id: 'A', name: 'Service A', type: 'participant' },
            { id: 'B', name: 'Service B', type: 'participant' },
            { id: 'C', name: 'Service C', type: 'participant' },
        ],
        groups: [],
        events: [],
    });

    it('should merge participants into a new one', () => {
        const root = createBaseAst();
        const filter = new MergeFilter({
            action: 'merge',
            newName: 'MergedAB',
            selector: { kind: 'participant', name: { pattern: 'Service [AB]' } },
        });

        const result = filter.transform(root);

        // A and B should be gone, MergedAB should exist
        const pIds = result.participants.map(p => p.id);
        expect(pIds).not.toContain('A');
        expect(pIds).not.toContain('B');
        expect(pIds).toContain('MergedAB');
        expect(pIds).toContain('C');
    });

    it('should rewrite message endpoints', () => {
        const root = createBaseAst();
        root.events = [
            { kind: 'message', id: 'm1', from: 'C', to: 'A', text: 'req', type: 'sync', style: { line: 'solid', head: 'arrow' } },
            { kind: 'message', id: 'm2', from: 'B', to: 'C', text: 'res', type: 'reply', style: { line: 'dotted', head: 'open' } },
        ];
        
        const filter = new MergeFilter({
            action: 'merge',
            newName: 'MergedAB',
            selector: { kind: 'participant', name: { pattern: 'Service [AB]' } },
        });

        const result = filter.transform(root);
        const events = result.events as any[];

        expect(events[0].to).toBe('MergedAB');
        expect(events[1].from).toBe('MergedAB');
    });

    it('should remove internal messages between merged participants', () => {
        const root = createBaseAst();
        root.events = [
            { kind: 'message', id: 'm1', from: 'A', to: 'B', text: 'internal', type: 'sync', style: { line: 'solid', head: 'arrow' } },
        ];
        
        const filter = new MergeFilter({
            action: 'merge',
            newName: 'MergedAB',
            selector: { kind: 'participant', name: { pattern: 'Service [AB]' } },
        });

        const result = filter.transform(root);
        expect(result.events).toHaveLength(0);
    });

    it('should remove activations of merged participants', () => {
        const root = createBaseAst();
        root.events = [
            { kind: 'activation', participantId: 'A', action: 'activate' },
            { kind: 'activation', participantId: 'C', action: 'activate' },
        ];
        
        const filter = new MergeFilter({
            action: 'merge',
            newName: 'MergedAB',
            selector: { kind: 'participant', name: { pattern: 'Service [AB]' } },
        });

        const result = filter.transform(root);
        const events = result.events as any[];
        
        expect(events).toHaveLength(1);
        expect(events[0].participantId).toBe('C');
    });

    it('should remove internal notes', () => {
         const root = createBaseAst();
        root.events = [
            { kind: 'note', id: 'n1', text: 'Internal Note', position: 'over', participantIds: ['A', 'B'] },
        ];
        
        const filter = new MergeFilter({
            action: 'merge',
            newName: 'MergedAB',
            selector: { kind: 'participant', name: { pattern: 'Service [AB]' } },
        });

        const result = filter.transform(root);
        expect(result.events).toHaveLength(0);
    });

     it('should keep shared notes but rename participants', () => {
         const root = createBaseAst();
        root.events = [
            { kind: 'note', id: 'n1', text: 'Shared Note', position: 'over', participantIds: ['A', 'C'] },
        ];
        
        const filter = new MergeFilter({
            action: 'merge',
            newName: 'MergedAB',
            selector: { kind: 'participant', name: { pattern: 'Service [AB]' } },
        });

        const result = filter.transform(root);
        const note = result.events[0] as any;
        expect(note.participantIds).toContain('MergedAB');
        expect(note.participantIds).toContain('C');
        expect(note.participantIds).toHaveLength(2);
    });

    it('should remove empty fragments', () => {
        const root = createBaseAst();
        root.events = [
            { 
                kind: 'fragment', id: 'f1', operator: 'alt', branches: [
                    { 
                        id: 'b1', 
                        events: [
                             { kind: 'message', id: 'm1', from: 'A', to: 'B', text: 'internal', type: 'sync', style: { line: 'solid', head: 'arrow' } }
                        ] 
                    }
                ] 
            },
        ];
        
        const filter = new MergeFilter({
            action: 'merge',
            newName: 'MergedAB',
            selector: { kind: 'participant', name: { pattern: 'Service [AB]' } },
        });

        const result = filter.transform(root);
        expect(result.events).toHaveLength(0);
    });
});
